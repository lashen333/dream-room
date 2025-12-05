import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

async function generateWithRetry(url: string, maxRetries = 3): Promise<ArrayBuffer> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`Attempt ${i + 1}/${maxRetries} to generate image...`);
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'User-Agent': 'DreamRoom-AI/1.0' },
                signal: AbortSignal.timeout(60000)
            });

            if (!response.ok) {
                throw new Error(`Status ${response.status}`);
            }

            return await response.arrayBuffer();
        } catch (error: any) {
            console.warn(`Attempt ${i + 1} failed:`, error.message);
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    throw new Error('All retries failed');
}

function extractProductDetails(product: any): string {
    const title = product.title || '';

    // Extract key details from title
    const details: string[] = [];

    // Material
    if (title.toLowerCase().includes('wood') || title.toLowerCase().includes('teak')) {
        details.push('wooden');
    } else if (title.toLowerCase().includes('metal')) {
        details.push('metal');
    } else if (title.toLowerCase().includes('plastic')) {
        details.push('plastic');
    }

    // Color hints
    if (title.toLowerCase().includes('brown') || title.toLowerCase().includes('teak')) {
        details.push('brown');
    } else if (title.toLowerCase().includes('black')) {
        details.push('black');
    } else if (title.toLowerCase().includes('white')) {
        details.push('white');
    } else if (title.toLowerCase().includes('blue')) {
        details.push('blue');
    }

    // Type
    const cleanTitle = title.toLowerCase()
        .replace(/\s*-\s*[a-z0-9]+$/i, '') // Remove product codes
        .replace(/\([^)]*\)/g, ''); // Remove parentheses

    return `${details.join(' ')} ${cleanTitle}`.trim();
}

export async function POST(request: NextRequest) {
    try {
        const { image, style, roomType } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        console.log('=== GENERATION REQUEST ===');
        console.log('Room Type:', roomType);
        console.log('Style:', style);

        const { data: allProducts, error: dbError } = await supabase
            .from('products')
            .select('*')
            .limit(500);

        if (dbError) console.error('Database error:', dbError);

        console.log(`Total products in DB: ${allProducts?.length || 0}`);

        let selectedProducts: any[] = [];
        const targetRoom = (roomType || 'living room').toLowerCase();

        if (allProducts && allProducts.length > 0) {

            const categoryCount: Record<string, number> = {};
            allProducts.forEach(p => {
                const cat = p.category || 'uncategorized';
                categoryCount[cat] = (categoryCount[cat] || 0) + 1;
            });
            console.log('Category Distribution:', categoryCount);

            const categoryMap: Record<string, string[]> = {
                'living room': ['living room', 'living', 'lounge'],
                'bedroom': ['bedroom', 'bed room'],
                'kitchen': ['kitchen', 'dining room', 'dining'],
                'office': ['office', 'study', 'work'],
                'bathroom': ['bathroom', 'bath'],
                'dining room': ['dining room', 'dining', 'kitchen']
            };

            const targetCategories = categoryMap[targetRoom] || [targetRoom];
            console.log('Looking for categories:', targetCategories);

            const positiveKeywords: Record<string, string[]> = {
                'living room': ['sofa', 'couch', 'coffee table', 'tv', 'armchair', 'living'],
                'bedroom': ['bed', 'mattress', 'wardrobe', 'nightstand', 'dresser'],
                'kitchen': ['dining', 'table', 'chair', 'stool', 'kitchen'],
                'office': ['desk', 'office', 'bookshelf', 'table', 'cabinet', 'filing'],
                'bathroom': ['vanity', 'mirror', 'bath', 'towel'],
                'dining room': ['dining', 'table', 'chair', 'buffet']
            };

            const negativeKeywords: Record<string, string[]> = {
                'office': ['bed', 'sofa', 'couch', 'baby', 'commode', 'toilet', 'coffee table', 'dressing', 'wardrobe'],
                'living room': ['bed', 'mattress', 'toilet', 'commode', 'baby', 'desk', 'dressing', 'wardrobe'],
                'bedroom': ['toilet', 'commode', 'office', 'desk', 'dining'],
            };

            const positive = positiveKeywords[targetRoom] || [];
            const negative = negativeKeywords[targetRoom] || [];

            const scoredProducts = allProducts.map((p: any) => {
                let score = 0;
                const title = (p.title || '').toLowerCase();
                const desc = (p.description || '').toLowerCase();
                const category = (p.category || '').toLowerCase();

                if (targetCategories.some(cat => category === cat.toLowerCase())) {
                    score += 200;
                } else if (targetCategories.some(cat => category.includes(cat))) {
                    score += 100;
                }

                positive.forEach(word => {
                    if (title.includes(word)) score += 20;
                    if (desc.includes(word)) score += 10;
                });

                negative.forEach(word => {
                    if (title.includes(word)) score -= 300;
                    if (category.includes(word)) score -= 300;
                });

                return { ...p, score };
            });

            const validProducts = scoredProducts
                .filter(p => p.score > 0)
                .sort((a, b) => b.score - a.score);

            console.log(`Products with positive score: ${validProducts.length}`);

            if (validProducts.length > 0) {
                console.log('Top matches:');
                validProducts.slice(0, 12).forEach((p, idx) => {
                    console.log(`  ${idx + 1}. ${p.title} (Score: ${p.score}, Category: ${p.category})`);
                });
                selectedProducts = validProducts.slice(0, 12);
            } else {
                console.warn('⚠️ NO PRODUCTS MATCHED! Categories need fixing.');
                selectedProducts = [];
            }
        }

        // Create DETAILED prompt with specific product descriptions
        const roomTypeEmphasis = targetRoom.toUpperCase();

        // Extract top 3-4 products for detailed description
        const topProducts = selectedProducts.slice(0, 4);
        const productDescriptions = topProducts.map(p => extractProductDetails(p)).join(', ');

        const stylePrompts: Record<string, string> = {
            modern: 'modern minimalist interior design, clean lines, neutral colors, contemporary furniture',
            minimalist: 'minimalist scandinavian interior, white walls, natural wood, simple furniture',
            industrial: 'industrial loft interior design, exposed brick, metal fixtures, concrete floors',
            boho: 'bohemian interior design, colorful textiles, plants, macrame, warm lighting',
            scandinavian: 'scandinavian nordic interior, hygge aesthetic, light wood, cozy textiles',
            luxury: 'luxury high-end interior design, marble, gold accents, designer furniture',
        };

        // Build detailed, descriptive prompt
        const furnitureContext = productDescriptions
            ? `featuring ${productDescriptions}`
            : 'with elegant modern furniture';

        const prompt = `${stylePrompts[style] || stylePrompts.modern}, ${roomTypeEmphasis} interior, ${furnitureContext}, professionally designed ${roomTypeEmphasis}, realistic interior photography, 8k quality, natural lighting, professional staging, realistic perspective`;

        console.log('=== DETAILED PROMPT ===');
        console.log(prompt);

        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&enhance=true`;

        const arrayBuffer = await generateWithRetry(pollinationsUrl);
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        console.log(`✅ Generated! Returning ${selectedProducts.length} products`);

        return NextResponse.json({
            success: true,
            generatedImage: dataUrl,
            style: style,
            products: selectedProducts,
            requiresComposition: false // No client-side composition needed
        });

    } catch (error: any) {
        console.error('❌ Generation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
