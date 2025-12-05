'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface BeforeAfterSliderProps {
    beforeImage: string;
    afterImage: string;
}

export default function BeforeAfterSlider({ beforeImage, afterImage }: BeforeAfterSliderProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = (x / rect.width) * 100;

        setSliderPosition(Math.min(Math.max(percentage, 0), 100));
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) handleMove(e.clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging) handleMove(e.touches[0].clientX);
    };

    return (
        <div className="relative w-full">
            {/* Labels */}
            <div className="flex justify-between mb-4">
                <span className="text-sm font-semibold text-foreground/60">Before</span>
                <span className="text-sm font-semibold text-primary">After (AI Enhanced)</span>
            </div>

            <div
                ref={containerRef}
                className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl cursor-ew-resize select-none"
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={handleMouseMove}
                onTouchStart={() => setIsDragging(true)}
                onTouchEnd={() => setIsDragging(false)}
                onTouchMove={handleTouchMove}
            >
                {/* After Image (Full) */}
                <div className="absolute inset-0">
                    <img
                        src={afterImage}
                        alt="After redesign"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-primary/90 px-4 py-2 rounded-lg backdrop-blur-sm">
                        <span className="text-white font-semibold text-sm">✨ AI Enhanced</span>
                    </div>
                </div>

                {/* Before Image (Clipped) */}
                <div
                    className="absolute inset-0"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                    <img
                        src={beforeImage}
                        alt="Before redesign"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-black/70 px-4 py-2 rounded-lg backdrop-blur-sm">
                        <span className="text-white font-semibold text-sm">Original</span>
                    </div>
                </div>

                {/* Slider Line */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl"
                    style={{ left: `${sliderPosition}%` }}
                >
                    {/* Slider Handle */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center cursor-ew-resize"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                    </motion.div>
                </div>
            </div>

            {/* Instruction */}
            <p className="text-center mt-4 text-sm text-foreground/50">
                👆 Drag the slider to compare before and after
            </p>
        </div>
    );
}
