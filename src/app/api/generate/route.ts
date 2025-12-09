import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Replicate from 'replicate';

// Helper to run Replicate with 429 retry logic
async function runReplicateWithRetry(replicate: Replicate, model: string, input: any, maxRetries = 3): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await replicate.run(model as `${string}/${string}`, { input });
        } catch (error: any) {
            console.log(`[Replicate Helper] Caught error on attempt ${i + 1}:`, error.message || error);

            // Check for Rate Limit (429) - Relaxed check
            const isRateLimit =
                (error.message && error.message.includes('429')) ||
                (error.status && parseInt(String(error.status)) === 429) ||
                (error.message && error.message.toLowerCase().includes('rate limit')) ||
                (error.message && error.message.includes('throttled'));

            if (isRateLimit) {
                console.warn(`⚠️ Replicate Rate Limit hit (Attempt ${i + 1}/${maxRetries}). Waiting to retry...`);

                // Try to parse retry_after from error, default to 2s
                const retryMatch = error.message?.match(/retry_after"?:(\d+)/);
                const waitTime = retryMatch ? parseInt(retryMatch[1]) * 1000 : 2000;

                if (i === maxRetries - 1) throw error; // No more retries

                console.log(`   Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime + 500)); // Wait + buffer
                continue;
            }

            // Not a rate limit error? Throw immediately
            throw error;
        }
    }
}

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

        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        // Fetch Products
        const { data: allProducts, error: dbError } = await supabase
            .from('products')
            .select('*')
            .limit(500);

        if (dbError) console.error('Database error:', dbError);

        console.log(`Total products in DB: ${allProducts?.length || 0}`);

        let selectedProducts: any[] = [];
        const targetRoom = (roomType || 'living room').toLowerCase();

        if (allProducts && allProducts.length > 0) {
            const categoryMap: Record<string, string[]> = {
                'living room': ['living room', 'living', 'lounge'],
                'bedroom': ['bedroom', 'bed room'],
                'kitchen': ['kitchen', 'dining room', 'dining'],
                'office': ['office', 'study', 'work'],
                'bathroom': ['bathroom', 'bath'],
                'dining room': ['dining room', 'dining', 'kitchen']
            };

            const targetCategories = categoryMap[targetRoom] || [targetRoom];

            // Define Style Keywords for Scoring
            const styleKeywords: Record<string, string[]> = {
                modern: ['modern', 'contemporary', 'sleek', 'glass', 'metal', 'white', 'black', 'grey'],
                minimalist: ['minimal', 'simple', 'scandinavian', 'white', 'wood', 'clean'],
                industrial: ['industrial', 'metal', 'leather', 'rustic', 'black', 'raw'],
                boho: ['boho', 'bohemian', 'rattan', 'colorful', 'pattern', 'vintage', 'green'],
                scandinavian: ['scandinavian', 'nordic', 'wood', 'white', 'light', 'cozy'],
                luxury: ['luxury', 'velvet', 'gold', 'marble', 'premium', 'elegant', 'classic']
            };

            const styleWords = styleKeywords[style] || styleKeywords['modern'];

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
                'living room': ['bed', 'mattress', 'toilet', 'commode', 'baby', 'desk', 'dressing', 'wardrobe', 'kitchen'],
                'bedroom': ['toilet', 'commode', 'office', 'desk', 'dining', 'kitchen'],
                'kitchen': ['bed', 'sofa', 'couch', 'wardrobe', 'dressing', 'nightstand', 'mattress'],
                'dining room': ['bed', 'sofa', 'wardrobe', 'dressing', 'nightstand', 'mattress']
            };

            const positive = positiveKeywords[targetRoom] || [];
            const negative = negativeKeywords[targetRoom] || [];

            const scoredProducts = allProducts.map((p: any) => {
                let score = 0;
                const title = (p.title || '').toLowerCase();
                const desc = (p.description || '').toLowerCase();
                const category = (p.category || '').toLowerCase();

                // 1. Category Match (Base Score)
                if (targetCategories.some(cat => category === cat.toLowerCase())) {
                    score += 500;
                } else if (targetCategories.some(cat => category.includes(cat))) {
                    score += 250;
                }

                // 2. Room Type Keywords
                positive.forEach(word => {
                    if (title.includes(word)) score += 50;
                    if (desc.includes(word)) score += 20;
                });

                // 3. Style Matching (Huge Boost for User Consistency)
                styleWords.forEach(word => {
                    if (title.includes(word)) score += 150; // Boost matching style
                    if (desc.includes(word)) score += 50;
                });



                // 5. Negative Filtering
                negative.forEach(word => {
                    if (title.includes(word)) score -= 1000;
                    if (category.includes(word)) score -= 1000;
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
                console.warn('⚠️ NO PRODUCTS MATCHED! Categories may need checking.');
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
            ? `featuring specific furniture: ${productDescriptions}`
            : 'with elegant modern furniture';

        const prompt = `${stylePrompts[style] || stylePrompts.modern}, ${roomTypeEmphasis} interior, ${furnitureContext}, professionally designed, photorealistic 8k, interior photography, natural lighting`;

        console.log('===DETAILED PROMPT ===');
        console.log(prompt);

        let dataUrl: string;

        // Try Replicate image-to-image (img2img)
        try {
            console.log('🎨 Generating with Replicate (img2img)...');

            const output = await runReplicateWithRetry(
                replicate,
                "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
                {
                    image: image,
                    prompt: prompt,
                    negative_prompt: "blurry, distorted, unrealistic, bad quality, floating furniture, messy, watermark, text",
                    num_inference_steps: 30, // Increased slightly for quality
                    guidance_scale: 7.5,
                    strength: 0.65, // Keep original structure but allow changes
                    scheduler: "DPMSolverMultistep",
                    width: 1024,
                    height: 1024
                }
            ) as string[];

            const generatedImageUrl = Array.isArray(output) ? output[0] : output;
            const imageResponse = await fetch(generatedImageUrl);
            const imageBuffer = await imageResponse.arrayBuffer();
            const base64 = Buffer.from(imageBuffer).toString('base64');
            dataUrl = `data:image/jpeg;base64,${base64}`;

            console.log('✅ Replicate generation successful!');

        } catch (replicateError: any) {
            console.warn('⚠️ Replicate failed, falling back to Pollinations...');
            console.warn('Error:', replicateError.message);

            const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&enhance=true`;
            const arrayBuffer = await generateWithRetry(pollinationsUrl);
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            dataUrl = `data:image/jpeg;base64,${base64}`;

            console.log('✅ Pollinations fallback successful');
        }

        console.log(`✅ Generated! Returning ${selectedProducts.length} products`);

        return NextResponse.json({
            success: true,
            generatedImage: dataUrl,
            style: style,
            products: selectedProducts,
        });

    } catch (error: any) {
        console.error('❌ Generation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
