import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

type Bindings = {
    ORDERS_DB: KVNamespace;
    GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

// AI 圖片識別 API
app.post('/api/analyze-simple', async (c) => {
    try {
        const formData = await c.req.parseBody();
        const image = formData['image'];

        if (!image || !(image instanceof File)) {
            return c.json({ success: false, error: '請上傳圖片' }, 400);
        }

        const arrayBuffer = await image.arrayBuffer();
        const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        const genAI = new GoogleGenerativeAI(c.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `你是一個訂單識別專家。請分析這張訂單圖片,依照視覺區域精確提取資訊:

1. **左上角編號區**: 找出 bookingNo (訂貨編號) 和 invoiceNo (發票號碼)
2. **左側店點資訊**: 提取 store (店別名稱,例如:台北101店、高雄夢時代)
3. **表格明細區**: 找出 itemCode (9碼商品代碼) 和 itemName (完整品名)
4. **右側日期時間**: 提取 datetime (格式: YYYY/MM/DD HH:mm)

請以 JSON 格式回傳:
{
  "bookingNo": "訂貨編號或null",
  "invoiceNo": "發票號碼或null",
  "store": "店別",
  "datetime": "日期時間",
  "itemCode": "9碼代碼",
  "itemName": "品名"
}`;

        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Image, mimeType: image.type } }
        ]);

        const text = result.response.text();
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const data = JSON.parse(cleanedText);

        const imageDataUrl = `data:${image.type};base64,${base64Image}`;

        return c.json({
            success: true,
            data: { ...data, imageDataUrl }
        });
    } catch (e: any) {
        console.error('Analysis error:', e);
        return c.json({ success: false, error: e.message || '識別失敗' }, 500);
    }
});

// 建立訂單 API
app.post('/api/create-order-simple', async (c) => {
    try {
        const body = await c.req.json();
        const orderId = crypto.randomUUID().split('-')[0];
        const orderData = {
            orderId,
            createdAt: new Date().toISOString(),
            ...body
        };

        await c.env.ORDERS_DB.put(`order_simple:${orderId}`, JSON.stringify(orderData));

        if (body.imageDataUrl) {
            await c.env.ORDERS_DB.put(`img_simple:${orderId}`, body.imageDataUrl);
        }

        return c.json({
            success: true,
            orderId,
            viewUrl: `/view/${orderId}`
        });
    } catch (e: any) {
        return c.json({ success: false, error: e.message }, 500);
    }
});

// 查詢訂單 API
app.get('/api/view/:orderId', async (c) => {
    try {
        const orderId = c.req.param('orderId');
        const orderData = await c.env.ORDERS_DB.get(`order_simple:${orderId}`);

        if (!orderData) {
            return c.json({ success: false, error: '訂單不存在' }, 404);
        }

        return c.json({ success: true, data: JSON.parse(orderData) });
    } catch (e: any) {
        return c.json({ success: false, error: e.message }, 500);
    }
});

// 讀取圖片 API
app.get('/api/image/:orderId', async (c) => {
    try {
        const orderId = c.req.param('orderId');
        const imageDataUrl = await c.env.ORDERS_DB.get(`img_simple:${orderId}`);

        if (!imageDataUrl) {
            return c.json({ success: false, error: '圖片不存在' }, 404);
        }

        return c.json({ success: true, imageDataUrl });
    } catch (e: any) {
        return c.json({ success: false, error: e.message }, 500);
    }
});

export default app;
