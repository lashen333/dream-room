'use client';

import { motion } from 'framer-motion';

interface Product {
    id: string;
    title: string;
    price: string;
    image_url: string;
    product_url: string;
    source: string;
}

interface ShopTheLookProps {
    style: string;
    roomType: string;
    products?: Product[];
}

export default function ShopTheLook({ style, roomType, products = [] }: ShopTheLookProps) {
    // Use passed products if available, otherwise show empty state or fallback
    // For this implementation, we'll prioritize passed products

    const displayProducts = products.length > 0 ? products : [];

    if (displayProducts.length === 0) {
        return (
            <div className="bg-gradient-to-br from-muted/50 to-muted/20 rounded-3xl p-8 border border-border text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">🛍️ Shop This Look</h2>
                <p className="text-foreground/60">
                    No matching products found for this design yet.
                    <br />
                    <span className="text-sm">Try adding product URLs in the Admin Dashboard!</span>
                </p>
            </div>
        );
    }

    // Calculate total (simple sum of parsed prices if possible, otherwise just 0)
    const total = displayProducts.reduce((sum, product) => {
        // Try to parse price string like "$1,299" or "1299"
        const priceString = product.price?.toString().replace(/[^0-9.]/g, '') || '0';
        const price = parseFloat(priceString);
        return sum + (isNaN(price) ? 0 : price);
    }, 0);

    return (
        <div className="bg-gradient-to-br from-muted/50 to-muted/20 rounded-3xl p-8 border border-border">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">🛍️ Shop This Look</h2>
                    <p className="text-foreground/60">
                        Curated items for your <span className="font-semibold text-primary">{style} {roomType}</span>
                    </p>
                </div>
                {total > 0 && (
                    <div className="text-right">
                        <div className="text-sm text-foreground/50">Total Value</div>
                        <div className="text-3xl font-bold text-primary">${total.toLocaleString()}</div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {displayProducts.map((product, index) => (
                    <motion.div
                        key={product.id || index}
                        className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary transition-all hover:shadow-xl flex flex-col"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -5 }}
                    >
                        <a
                            href={product.product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-[4/3] overflow-hidden block"
                        >
                            <img
                                src={product.image_url}
                                alt={product.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            {product.source && (
                                <div className="absolute top-3 right-3 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold">
                                    {product.source}
                                </div>
                            )}
                        </a>
                        <div className="p-4 flex flex-col flex-grow">
                            <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                {product.title}
                            </h3>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-2xl font-bold text-primary">{product.price}</span>
                                <a
                                    href={product.product_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary hover:text-white transition-all"
                                >
                                    Buy Now
                                </a>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-4">
                <button className="flex-1 bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl">
                    🛒 Buy Entire Room {total > 0 ? `($${total.toLocaleString()})` : ''}
                </button>
                <button className="px-8 py-4 border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary hover:text-white transition-all">
                    Save for Later
                </button>
            </div>

            <p className="text-center mt-6 text-xs text-foreground/40">
                💡 Affiliate Disclosure: We may earn a commission from purchases made through these links at no extra cost to you.
            </p>
        </div>
    );
}
