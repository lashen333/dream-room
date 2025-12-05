'use client';

import { useState, useEffect, useRef } from 'react';

interface Product {
    id: string;
    title: string;
    price: string;
    image_url: string;
    product_url: string;
}

interface ProductComposerProps {
    backgroundImage: string;
    products: Product[];
    onCompositeReady: (compositeImage: string) => void;
}

export default function ProductComposer({ backgroundImage, products, onCompositeReady }: ProductComposerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCompositing, setIsCompositing] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (backgroundImage && products.length > 0) {
            composeImage();
        }
    }, [backgroundImage, products]);

    const loadImage = (url: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
            const img = new window.Image();

            const isExternal = url.startsWith('http') && !url.includes(window.location.hostname);
            const proxiedUrl = isExternal ? `/api/proxy-image?url=${encodeURIComponent(url)}` : url;

            const timeout = setTimeout(() => {
                console.warn(`Image load timeout: ${url}`);
                resolve(null);
            }, 10000);

            img.onload = () => {
                clearTimeout(timeout);
                if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                    resolve(img);
                } else {
                    resolve(null);
                }
            };

            img.onerror = () => {
                clearTimeout(timeout);
                resolve(null);
            };

            img.src = proxiedUrl;
        });
    };

    const removeWhiteBackground = (img: HTMLImageElement): HTMLCanvasElement => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d')!;

        tempCtx.drawImage(img, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;

        // Remove white/light backgrounds
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // If pixel is very light (near white), make it transparent
            const brightness = (r + g + b) / 3;
            if (brightness > 240 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15) {
                data[i + 3] = 0; // Set alpha to 0 (transparent)
            }
        }

        tempCtx.putImageData(imageData, 0, 0);
        return tempCanvas;
    };

    const addRealisticShadow = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        perspective: number
    ) => {
        // Floor shadow
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000000';

        // Create elliptical shadow at base
        const shadowY = y + height - 10;
        const shadowWidth = width * 0.8;
        const shadowHeight = height * 0.15 * perspective;

        ctx.beginPath();
        ctx.ellipse(
            x + width / 2,
            shadowY,
            shadowWidth / 2,
            shadowHeight / 2,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
    };

    const composeImage = async () => {
        setIsCompositing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        try {
            const bgImg = await loadImage(backgroundImage);

            if (!bgImg) {
                console.error('Background image failed to load');
                onCompositeReady(backgroundImage);
                return;
            }

            canvas.width = bgImg.width;
            canvas.height = bgImg.height;
            ctx.drawImage(bgImg, 0, 0);

            setProgress(30);

            const productImages: (HTMLImageElement | null)[] = [];

            for (let i = 0; i < Math.min(products.length, 6); i++) {
                const product = products[i];
                console.log(`Loading product ${i + 1}: ${product.title}`);
                const img = await loadImage(product.image_url);
                productImages.push(img);
                setProgress(30 + (i + 1) * 10);
            }

            const validImages = productImages.filter((img): img is HTMLImageElement => img !== null);
            console.log(`Successfully loaded ${validImages.length} product images`);

            if (validImages.length === 0) {
                console.warn('No product images loaded, using background only');
                onCompositeReady(backgroundImage);
                return;
            }

            // Realistic positioning with perspective
            const positions = [
                // Front row (closer, larger)
                { x: 0.3, y: 0.72, scale: 0.35, perspective: 1.0, depth: 'front' },
                { x: 0.7, y: 0.72, scale: 0.35, perspective: 1.0, depth: 'front' },

                // Middle row (medium distance)
                { x: 0.15, y: 0.60, scale: 0.25, perspective: 0.8, depth: 'middle' },
                { x: 0.5, y: 0.55, scale: 0.28, perspective: 0.8, depth: 'middle' },
                { x: 0.85, y: 0.60, scale: 0.25, perspective: 0.8, depth: 'middle' },

                // Back row (far, smaller)
                { x: 0.35, y: 0.45, scale: 0.18, perspective: 0.6, depth: 'back' },
            ];

            validImages.forEach((img, index) => {
                try {
                    const pos = positions[index % positions.length];

                    // Remove white background
                    const processedCanvas = removeWhiteBackground(img);

                    // Calculate size with perspective
                    const baseSize = Math.min(canvas.width, canvas.height);
                    const targetWidth = baseSize * pos.scale;
                    const aspectRatio = img.height / img.width;
                    const targetHeight = targetWidth * aspectRatio;

                    const x = canvas.width * pos.x - targetWidth / 2;
                    const y = canvas.height * pos.y - targetHeight;

                    // Add realistic floor shadow BEFORE drawing product
                    addRealisticShadow(ctx, x, y, targetWidth, targetHeight, pos.perspective);

                    // Add soft glow/ambient shadow around product
                    ctx.save();
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                    ctx.shadowBlur = 20 * pos.perspective;
                    ctx.shadowOffsetX = 5 * pos.perspective;
                    ctx.shadowOffsetY = 10 * pos.perspective;

                    // Draw product with transparency preserved
                    ctx.globalAlpha = 0.95; // Slight transparency for realism
                    ctx.drawImage(processedCanvas, x, y, targetWidth, targetHeight);

                    ctx.restore();

                    // Add subtle light reflection if front row
                    if (pos.depth === 'front') {
                        ctx.save();
                        ctx.globalAlpha = 0.08;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(x, y, targetWidth, targetHeight * 0.3);
                        ctx.restore();
                    }

                } catch (error) {
                    console.warn(`Failed to process image ${index}:`, error);
                }
            });

            setProgress(100);

            const compositeDataUrl = canvas.toDataURL('image/jpeg', 0.92);
            onCompositeReady(compositeDataUrl);

        } catch (error) {
            console.error('Composition error:', error);
            onCompositeReady(backgroundImage);
        } finally {
            setIsCompositing(false);
        }
    };

    if (!isCompositing && progress === 100) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-card p-8 rounded-xl text-center max-w-md">
                <div className="mb-4">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Creating Photorealistic Design</h3>
                <p className="text-muted-foreground mb-4">
                    Placing products with realistic perspective and lighting...
                </p>
                <div className="w-full bg-muted rounded-full h-2">
                    <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
