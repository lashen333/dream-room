'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [categorizing, setCategorizing] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            setProducts(data);
        }
    };

    const handleCategorizeAll = async () => {
        setCategorizing(true);
        setMessage('🤖 AI Agent is categorizing products...');

        try {
            const response = await fetch('/api/products/categorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'categorize-all' }),
            });

            const data = await response.json();

            if (data.success) {
                setMessage(`✅ ${data.message}`);
                fetchProducts();

                if (data.remaining > 0) {
                    setTimeout(() => handleCategorizeAll(), 2000);
                } else {
                    setCategorizing(false);
                }
            } else {
                setMessage(`❌ Error: ${data.error}`);
                setCategorizing(false);
            }
        } catch (error) {
            setMessage('❌ Categorization failed');
            setCategorizing(false);
        }
    };





    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

                {/* Scraper Section */}
                <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Product Scraper</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCategorizeAll}
                                disabled={categorizing}
                                className="text-green-500 text-sm hover:bg-green-500/10 px-3 py-2 rounded-lg transition-colors border border-green-500/20 disabled:opacity-50"
                            >
                                {categorizing ? '🤖 Categorizing...' : '🤖 Auto-Categorize All'}
                            </button>
                            <button
                                onClick={async () => {
                                    if (!confirm('Are you sure you want to DELETE ALL products? This cannot be undone.')) return;
                                    setIsLoading(true);
                                    const { error } = await supabase.from('products').delete().neq('id', 0);
                                    if (error) {
                                        setMessage(`❌ Error deleting: ${error.message}`);
                                    } else {
                                        setMessage('✅ All products deleted successfully.');
                                        fetchProducts();
                                    }
                                    setIsLoading(false);
                                }}
                                className="text-red-500 text-sm hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors border border-red-500/20"
                            >
                                🗑️ Delete All Products
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={async () => {
                                setIsLoading(true);
                                setMessage('🚀 Starting full catalog scrape...');
                                try {
                                    const response = await fetch('/api/products/scrape', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ action: 'scrape_all' }),
                                    });
                                    const data = await response.json();
                                    if (data.success) {
                                        setMessage(`✅ Scraping complete! Found ${data.totalFound} new products.`);
                                        fetchProducts();
                                    } else {
                                        setMessage(`❌ Error: ${data.error}`);
                                    }
                                } catch (error) {
                                    setMessage('❌ Scraping failed');
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            disabled={isLoading}
                            className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                            {isLoading ? '⏳ Scraping...' : '🚀 Scrape All Products'}
                        </button>
                    </div>



                    {message && (
                        <div className={`mt-4 p-3 rounded-lg ${message.includes('Error') || message.includes('Failed') ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                            {message}
                        </div>
                    )}
                </div>

                {/* Products List */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-6">Product Inventory ({products.length})</h2>

                    <div className="grid gap-4">
                        {products.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No products found. Add some URLs above!</p>
                        ) : (
                            products.map((product) => (
                                <div key={product.id} className="flex gap-4 p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                                    <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                                        {product.image_url && (
                                            <Image
                                                src={product.image_url}
                                                alt={product.title}
                                                fill
                                                className="object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate">{product.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {product.category ? <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs mr-2">{product.category}</span> : null}
                                            {product.source}
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-primary">{product.price}</span>
                                            <a
                                                href={product.product_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-500 hover:underline"
                                            >
                                                View Original Link
                                            </a>
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!confirm('Delete this product?')) return;
                                            await supabase.from('products').delete().eq('id', product.id);
                                            fetchProducts();
                                        }}
                                        className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg h-fit"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
