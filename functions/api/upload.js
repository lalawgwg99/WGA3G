// R2 上傳 API - 上傳圖片到 Cloudflare R2

export async function onRequestPost(context) {
    try {
        const bucket = context.env.IMAGES;
        if (!bucket) {
            return new Response(JSON.stringify({
                success: false,
                error: 'R2 bucket not configured'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const formData = await context.request.formData();
        const image = formData.get('image');

        if (!image || !(image instanceof File)) {
            return new Response(JSON.stringify({
                success: false,
                error: '請上傳圖片'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 生成唯一檔名
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const ext = image.type === 'image/png' ? 'png' : 'jpg';
        const filename = `order_${timestamp}_${random}.${ext}`;

        // 上傳到 R2
        const arrayBuffer = await image.arrayBuffer();
        await bucket.put(filename, arrayBuffer, {
            httpMetadata: {
                contentType: image.type
            }
        });

        // 公開 URL
        const publicUrl = `https://pub-6eed26d759db402694acfc84445bdd21.r2.dev/${filename}`;

        return new Response(JSON.stringify({
            success: true,
            url: publicUrl,
            filename: filename
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({
            success: false,
            error: e.message || '上傳失敗'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
