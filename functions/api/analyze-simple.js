export async function onRequestPost(context) {
    try {
        const apiKey = context.env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ success: false, error: 'Server Config Error: GEMINI_API_KEY is missing' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const formData = await context.request.formData();
        const image = formData.get('image');

        if (!image || !(image instanceof File)) {
            return new Response(JSON.stringify({ success: false, error: '請上傳圖片' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const arrayBuffer = await image.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, uint8Array.slice(i, i + chunkSize));
        }
        const base64Image = btoa(binary);

        const promptText = `你是一個訂單識別專家。請分析這張訂單圖片，精確提取資訊：

**重要規則**：
- 商品只從「表格明細區」識別，不要從收據副聯或其他區域重複識別
- 每個商品只出現一次，根據表格行數判斷商品數量
- 如果同一商品在不同區域出現，只算一次

**識別區域**：
1. **編號區**: bookingNo (訂貨編號) 和 invoiceNo (發票號碼)
2. **店點資訊**: store (店別名稱,例如:成功店(ZK))
3. **表格明細區**: 只識別表格內的商品行，每行一個商品
   - itemCode: 商品代碼 (通常9-13碼數字)
   - itemName: 完整品名
4. **日期時間**: datetime (格式: DD/MM/YYYY HH:mm 或 YYYY/MM/DD HH:mm)

請以 JSON 格式回傳:
{
  "bookingNo": "訂貨編號或null",
  "invoiceNo": "發票號碼或null",
  "store": "店別",
  "datetime": "日期時間",
  "items": [
    { "itemCode": "代碼", "itemName": "品名" }
  ]
}`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: promptText },
                        { inline_data: { mime_type: image.type, data: base64Image } }
                    ]
                }],
                generationConfig: {
                    temperature: 0,
                    response_mime_type: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        if (!result.candidates || result.candidates.length === 0) {
            throw new Error('No candidates returned from Gemini');
        }

        const text = result.candidates[0].content.parts[0].text;
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const data = JSON.parse(cleanedText);

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message || '識別失敗' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
