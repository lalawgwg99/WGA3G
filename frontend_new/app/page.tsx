'use client';

import { useState, useRef } from 'react';

interface OrderData {
    bookingNo?: string;
    invoiceNo?: string;
    store: string;
    datetime: string;
    itemCode: string;
    itemName: string;
}

export default function HomePage() {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (field: keyof OrderData, value: string) => {
        if (orderData) {
            setOrderData({ ...orderData, [field]: value });
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setOrderData(null);
            setError('');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setOrderData(null);
            setError('');
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const analyzeImage = async () => {
        if (!selectedImage) return;
        setIsAnalyzing(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('image', selectedImage);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyze-simple`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || '識別失敗');
            }
            setOrderData(result.data);
        } catch (err: any) {
            console.error('Analysis error:', err);
            setError(err.message || '識別過程發生錯誤');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const formatItemCode = (code: string, name: string) => {
        if (!code) return '';
        const lowerName = name.toLowerCase();
        let prefix = '';
        if (lowerName.includes('手機') || lowerName.includes('手錶') || lowerName.includes('ipod') || lowerName.includes('pods') || lowerName.includes('phone')) {
            prefix = '42';
        } else if (lowerName.includes('電腦') || lowerName.includes('mac') || lowerName.includes('ipad')) {
            prefix = '45';
        }
        return prefix + code;
    };

    const copyToClipboard = async () => {
        if (!orderData) return;
        const formattedItemCode = formatItemCode(orderData.itemCode, orderData.itemName);
        const text = [
            `1. 店別: ${orderData.store}`,
            `2. 日期時間: ${orderData.datetime}`,
            `3. itemcode: ${formattedItemCode}`,
            `4. 品名: ${orderData.itemName}`,
            orderData.bookingNo && `5. 訂貨編號: ${orderData.bookingNo}`,
            orderData.invoiceNo && `6. 發票號碼: ${orderData.invoiceNo}`,
        ].filter(Boolean).join('\n');
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const shareToApp = async () => {
        if (!orderData || !selectedImage) return;
        const formattedItemCode = formatItemCode(orderData.itemCode, orderData.itemName);
        const text = [
            '📋 訂單資訊',
            `1. 店別: ${orderData.store}`,
            `2. 日期時間: ${orderData.datetime}`,
            `3. itemcode: ${formattedItemCode}`,
            `4. 品名: ${orderData.itemName}`,
            orderData.bookingNo && `5. 訂貨編號: ${orderData.bookingNo}`,
            orderData.invoiceNo && `6. 發票號碼: ${orderData.invoiceNo}`,
        ].filter(Boolean).join('\n');
        try {
            if (navigator.share) {
                await navigator.share({ title: '訂單資訊', text, files: [selectedImage] });
            } else {
                await copyToClipboard();
                alert('已複製文字！請手動分享圖片到 LINE');
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
                try {
                    await navigator.share({ title: '訂單資訊', text });
                } catch {
                    await copyToClipboard();
                }
            }
        }
    };

    const resetImage = () => {
        setSelectedImage(null);
        setPreviewUrl('');
        setOrderData(null);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-[#F2F2F7]">
            {/* iOS Navigation Bar */}
            <div className="ios-navbar sticky top-0 z-50 px-4 py-3">
                <h1 className="text-center text-[17px] font-semibold">訂單識別</h1>
            </div>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
                {/* Upload Section */}
                {!selectedImage ? (
                    <div className="ios-card p-8">
                        <div
                            className="cursor-pointer text-center"
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                        >
                            <div className="text-6xl mb-3">📸</div>
                            <p className="text-[17px] font-semibold text-[#000] mb-1">上傳訂單圖片</p>
                            <p className="text-[15px] text-[#8E8E93]">拍照或點擊選擇圖片</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </div>
                    </div>
                ) : (
                    /* Preview Section */
                    <div className="ios-card p-4">
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-3 bg-[#F2F2F7]">
                            <img src={previewUrl} alt="訂單預覽" className="w-full h-full object-contain" />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={resetImage}
                                className="flex-1 ios-btn-secondary py-3 text-[17px]"
                            >
                                重新選擇
                            </button>
                            <button
                                onClick={analyzeImage}
                                disabled={isAnalyzing}
                                className="flex-[2] ios-btn-primary py-3 text-[17px]"
                            >
                                {isAnalyzing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="ios-spinner">◌</span>
                                        識別中...
                                    </span>
                                ) : '開始識別'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="ios-card p-4 border-l-4 border-red-500">
                        <p className="text-red-600 text-[15px]">{error}</p>
                    </div>
                )}

                {/* Results Section */}
                {orderData && (
                    <div className="ios-card overflow-hidden">
                        <div className="px-4 py-3 bg-[#F2F2F7] flex items-center justify-between">
                            <h2 className="text-[17px] font-semibold">識別結果</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="px-3 py-1 ios-btn-secondary text-[15px]"
                                >
                                    {isEditing ? '完成' : '編輯'}
                                </button>
                                <button
                                    onClick={shareToApp}
                                    className="px-3 py-1 ios-btn-primary text-[15px]"
                                >
                                    分享
                                </button>
                            </div>
                        </div>

                        <div className="divide-y divide-[#C6C6C8]">
                            {[
                                { label: '店別', field: 'store' },
                                { label: '時間', field: 'datetime' },
                                { label: '商品代碼', field: 'itemCode', special: true },
                            ].map((item) => (
                                <div key={item.field} className="ios-list-item flex items-center">
                                    <span className="text-[15px] text-[#8E8E93] w-24 shrink-0">{item.label}</span>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={(orderData as any)[item.field]}
                                            onChange={(e) => handleInputChange(item.field as any, e.target.value)}
                                            className="flex-1 ios-input py-2 px-3 text-[15px]"
                                        />
                                    ) : (
                                        <span className={`flex-1 text-[15px] ${item.special ? 'text-[#007AFF] font-medium' : 'text-[#000]'}`}>
                                            {item.field === 'itemCode' ? formatItemCode(orderData.itemCode, orderData.itemName) : (orderData as any)[item.field]}
                                        </span>
                                    )}
                                </div>
                            ))}

                            <div className="ios-list-item">
                                <div className="text-[15px] text-[#8E8E93] mb-2">品名</div>
                                {isEditing ? (
                                    <textarea
                                        value={orderData.itemName}
                                        onChange={(e) => handleInputChange('itemName', e.target.value)}
                                        rows={2}
                                        className="w-full ios-input text-[15px]"
                                    />
                                ) : (
                                    <div className="text-[15px] text-[#000]">
                                        {orderData.itemName}
                                    </div>
                                )}
                            </div>

                            {['bookingNo', 'invoiceNo'].map((field) => (
                                ((orderData as any)[field] || isEditing) && (
                                    <div key={field} className="ios-list-item flex items-center">
                                        <span className="text-[15px] text-[#8E8E93] w-24 shrink-0">
                                            {field === 'bookingNo' ? '訂貨編號' : '發票號碼'}
                                        </span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={(orderData as any)[field] || ''}
                                                onChange={(e) => handleInputChange(field as any, e.target.value)}
                                                className="flex-1 ios-input py-2 px-3 text-[15px]"
                                                placeholder="選填"
                                            />
                                        ) : (
                                            <span className="flex-1 text-[15px] text-[#000]">{(orderData as any)[field]}</span>
                                        )}
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center py-4">
                    <p className="text-[13px] text-[#8E8E93]">確保照片清晰以獲得最佳識別效果</p>
                </div>
            </div>
        </div>
    );
}
