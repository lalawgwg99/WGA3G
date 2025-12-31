import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
    ORDERS_DB: KVNamespace;
    GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS - 允許所有來源
app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
}));

// 健康檢查
app.get('/', (c) => c.json({ status: 'ok', message: 'oolala-api is ready' }));
app.get('/health', (c) => c.json({ status: 'ok', time: new Date().toISOString() }));

// AI 圖片識別 API (使用 REST API，不依賴 SDK)
app.post('/api/analyze-simple', async (c) => {
    try {
        const apiKey = c.env.GEMINI_API_KEY;
        if (!apiKey) {
            return c.json({ success: false, error: 'Server Config Error: GEMINI_API_KEY is missing' }, 500);
        }

        const formData = await c.req.parseBody();
        const image = formData['image'];

        if (!image || !(image instanceof File)) {
            return c.json({ success: false, error: '請上傳圖片' }, 400);
        }

        const arrayBuffer = await image.arrayBuffer();
        const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        // 構建 Prompt
        const promptText = `你是一個訂單識別專家。請分析這張訂單圖片，依照視覺區域精確提取資訊：

1. **左上角編號區**: 找出 bookingNo (訂貨編號) 和 invoiceNo (發票號碼)
2. **左側店點資訊**: 提取 store (店別名稱,例如:WG五甲店)
3. **表格明細區**: 找出所有商品的 itemCode (9碼商品代碼) 和 itemName (完整品名),可能有 1-5 個商品
4. **右側日期時間**: 提取 datetime (格式: YYYY/MM/DD HH:mm)

請以 JSON 格式回傳:
{
  "bookingNo": "訂貨編號或null",
  "invoiceNo": "發票號碼或null",
  "store": "店別",
  "datetime": "日期時間",
  "items": [
    { "itemCode": "9碼代碼", "itemName": "品名" }
  ]
}`;

        // 直接呼叫 Google Gemini REST API
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

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
                    response_mime_type: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        // 解析回應
        if (!result.candidates || result.candidates.length === 0) {
            throw new Error('No candidates returned from Gemini');
        }

        const text = result.candidates[0].content.parts[0].text;
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const data = JSON.parse(cleanedText);

        return c.json({ success: true, data });

    } catch (e: any) {
        console.error('Analysis error:', e);
        return c.json({ success: false, error: e.message || '識別失敗' }, 500);
    }
});

export default app;
