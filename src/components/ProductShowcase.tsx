'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { ExternalLink, ShoppingBag } from 'lucide-react';

interface Product {
    id: string;
    title: string;
    price: string;
    image_url: string;
    product_url: string;
    category?: string;
}

interface ProductShowcaseProps {
    products?: Product[];
    roomType: string;
}

export default function ProductShowcase({ products = [], roomType }: ProductShowcaseProps) {
    if (products.length === 0) {
        return (
            <div className="bg-muted/30 rounded-xl md:rounded-2xl p-8 md:p-12 text-center border border-border">
                <ShoppingBag className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg md:text-xl font-semibold mb-2">No Products Found</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                    No matching products for this {roomType}. Add products in Admin panel.
                </p>
            </div>
        );
    }

    const handleBuyClick = (productUrl: string) => {
        window.open(productUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="text-center px-4">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Matching Furniture</h2>
                <p className="text-sm md:text-lg text-muted-foreground">
                    {products.length} items for your {roomType}
                </p>
            </div>

            {/* Mobile-Optimized Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 px-2 md:px-0">
                {products.map((product, index) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.3 }}
                        className="group bg-card border border-border rounded-xl md:rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex flex-col"
                    >
                        {/* Product Image */}
                        <div className="relative w-full aspect-square bg-muted overflow-hidden">
                            <Image
                                src={product.image_url}
                                alt={product.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder.png';
                                }}
                            />
                            {product.category && (
                                <div className="absolute top-2 left-2 bg-primary/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-[10px] md:text-xs font-medium">
                                    {product.category}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="p-3 md:p-4 flex flex-col flex-grow">
                            <h3 className="font-semibold text-sm md:text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem] md:min-h-[3rem]">
                                {product.title}
                            </h3>

                            <div className="mt-auto space-y-2 md:space-y-3">
                                {/* Price */}
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg md:text-xl lg:text-2xl font-bold text-primary">
                                        {product.price}
                                    </span>
                                </div>

                                {/* Buy Button */}
                                <button
                                    onClick={() => handleBuyClick(product.product_url)}
                                    className="w-full bg-gradient-to-r from-primary to-secondary text-white py-2 md:py-3 px-3 md:px-4 rounded-lg md:rounded-xl text-sm md:text-base font-semibold hover:opacity-90 transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-1.5 md:gap-2 active:scale-95"
                                >
                                    <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
                                    <span className="hidden sm:inline">Buy Now</span>
                                    <span className="sm:hidden">Buy</span>
                                    <ExternalLink className="w-3 h-3 md:w-4 md:h-4 opacity-70" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Footer Note */}
            <div className="text-center text-xs md:text-sm text-muted-foreground pt-2 md:pt-4 px-4">
                <p>Tap "Buy" to view details and purchase from the store</p>
            </div>
        </div>
    );
}
