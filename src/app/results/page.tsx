'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import ShopTheLook from '@/components/ShopTheLook';
import { motion } from 'framer-motion';
import { globalState } from '@/utils/globalState';


function ResultsContent() {
    const searchParams = useSearchParams();

    // Use state to store images (needed for client-side sessionStorage access)
    const [beforeImage, setBeforeImage] = useState('');
    const [afterImage, setAfterImage] = useState('');
    const [style, setStyle] = useState('modern');
    const [roomType, setRoomType] = useState('living room');

    const [products, setProducts] = useState<any[]>([]);

    const [error, setError] = useState<string | null>(null);

    // Load data from Global State
    useEffect(() => {
        const loadImages = async () => {
            // 1. Try Global State (fastest)
            if (globalState.beforeImage && globalState.afterImage) {
                console.log('Found images in Global State');
                setBeforeImage(globalState.beforeImage);
                setAfterImage(globalState.afterImage);
                setProducts(globalState.products || []);
                return;
            }

            // 2. Fallback to URL parameters
            const urlBefore = searchParams.get('before');
            const urlAfter = searchParams.get('after');

            if (urlBefore && urlAfter) {
                setBeforeImage(urlBefore);
                setAfterImage(urlAfter);
                return;
            }

            // 3. If nothing found after a short delay, show error
            setTimeout(() => {
                if (!globalState.beforeImage && !searchParams.get('before')) {
                    setError('Images not found. Please try generating again.');
                }
            }, 2000);
        };

        loadImages();

        // Always load style and roomType from URL
        setStyle(searchParams.get('style') || 'modern');
        setRoomType(searchParams.get('roomType') || 'living room');
    }, [searchParams]);


    const [showShareMenu, setShowShareMenu] = useState(false);

    const handleShare = (platform: string) => {
        const shareText = `I just transformed my ${roomType} with AI! Check out this amazing ${style} redesign 🎨✨`;
        const shareUrl = window.location.href;

        const urls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
        };

        window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
    };

    const handleDownload = () => {
        // In production, this would download the high-res image
        const link = document.createElement('a');
        link.href = afterImage;
        link.download = `dreamroom-${style}-${roomType}.png`;
        link.click();
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <a href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        DreamRoom AI
                    </a>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowShareMenu(!showShareMenu)}
                            className="px-6 py-2 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition-all"
                        >
                            📤 Share
                        </button>
                        <button
                            onClick={handleDownload}
                            className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:opacity-90 transition-all"
                        >
                            ⬇️ Download HD
                        </button>
                    </div>
                </div>

                {/* Share Menu */}
                {showShareMenu && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute right-6 top-16 bg-card border border-border rounded-xl shadow-2xl p-4 min-w-[200px]"
                    >
                        <div className="text-sm font-semibold text-foreground/60 mb-3">Share on:</div>
                        <div className="space-y-2">
                            <button
                                onClick={() => handleShare('twitter')}
                                className="w-full text-left px-4 py-2 rounded-lg hover:bg-muted transition-all flex items-center gap-3"
                            >
                                <span>🐦</span>
                                <span>Twitter</span>
                            </button>
                            <button
                                onClick={() => handleShare('facebook')}
                                className="w-full text-left px-4 py-2 rounded-lg hover:bg-muted transition-all flex items-center gap-3"
                            >
                                <span>📘</span>
                                <span>Facebook</span>
                            </button>
                            <button
                                onClick={() => handleShare('pinterest')}
                                className="w-full text-left px-4 py-2 rounded-lg hover:bg-muted transition-all flex items-center gap-3"
                            >
                                <span>📌</span>
                                <span>Pinterest</span>
                            </button>
                            <button
                                onClick={() => handleShare('whatsapp')}
                                className="w-full text-left px-4 py-2 rounded-lg hover:bg-muted transition-all flex items-center gap-3"
                            >
                                <span>💬</span>
                                <span>WhatsApp</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Success Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-block mb-4 px-6 py-2 bg-success/10 border border-success/20 rounded-full">
                        <span className="text-success font-semibold">✅ Transformation Complete!</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Your <span className="capitalize">{style} {roomType}</span> Redesign
                    </h1>
                    <p className="text-xl text-foreground/60">
                        Compare your before and after transformation below
                    </p>
                </motion.div>

                {/* Before/After Slider */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-16"
                >
                    {error ? (
                        <div className="w-full aspect-video max-w-2xl mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center border border-destructive/20 p-8 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <span className="text-4xl">⚠️</span>
                                <p className="text-destructive font-semibold">{error}</p>
                                <a href="/" className="text-sm underline hover:opacity-80">Return Home</a>
                            </div>
                        </div>
                    ) : beforeImage && afterImage ? (
                        <BeforeAfterSlider beforeImage={beforeImage} afterImage={afterImage} />
                    ) : (
                        <div className="w-full aspect-square max-w-2xl mx-auto rounded-2xl bg-muted/20 flex items-center justify-center border border-white/10">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-foreground/50">Loading your design...</p>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-3 gap-6 mb-16"
                >
                    <div className="bg-card border border-border rounded-2xl p-6 text-center">
                        <div className="text-3xl mb-2">⚡</div>
                        <div className="text-2xl font-bold text-primary">2.3s</div>
                        <div className="text-sm text-foreground/50">Generation Time</div>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-6 text-center">
                        <div className="text-3xl mb-2">🎨</div>
                        <div className="text-2xl font-bold text-primary capitalize">{style}</div>
                        <div className="text-sm text-foreground/50">Design Style</div>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-6 text-center">
                        <div className="text-3xl mb-2">✨</div>
                        <div className="text-2xl font-bold text-primary">4K</div>
                        <div className="text-sm text-foreground/50">Ultra HD Quality</div>
                    </div>
                </motion.div>

                {/* Shop The Look */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <ShopTheLook style={style} roomType={roomType} products={products} />
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="text-center mt-16 p-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl border border-primary/20"
                >
                    <h2 className="text-3xl font-bold mb-4">Love it? Transform Another Room!</h2>
                    <p className="text-foreground/60 mb-8 text-lg">
                        Try different styles or redesign other rooms in your home
                    </p>
                    <a
                        href="/"
                        className="inline-block bg-gradient-to-r from-primary to-secondary text-white px-12 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                    >
                        ✨ Create Another Design
                    </a>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-12 px-6 mt-20">
                <div className="max-w-7xl mx-auto text-center text-sm text-foreground/40">
                    <p>© 2024 DreamRoom AI. Transform any room with artificial intelligence.</p>
                </div>
            </footer>
        </div>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ResultsContent />
        </Suspense>
    );
}
