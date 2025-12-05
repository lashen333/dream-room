import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const { action } = await request.json();

        if (action === 'categorize-all') {
            const { data: products, error } = await supabase
                .from('products')
                .select('*')
                .or('category.is.null,category.eq."",category.eq.product,category.eq.uncategorized');

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            if (!products || products.length === 0) {
                return NextResponse.json({
                    success: true,
                    message: 'All products already categorized!',
                    count: 0
                });
            }

            console.log(`Found ${products.length} products to categorize`);

            let categorizedCount = 0;
            const batchSize = 20;

            for (let i = 0; i < Math.min(products.length, batchSize); i++) {
                const product = products[i];
                const category = categorizeFallback(product.title, product.description);

                const { error: updateError } = await supabase
                    .from('products')
                    .update({ category })
                    .eq('id', product.id);

                if (!updateError) {
                    categorizedCount++;
                    console.log(`✅ ${product.title} -> ${category}`);
                }
            }

            return NextResponse.json({
                success: true,
                message: `Categorized ${categorizedCount} products (${products.length - batchSize} remaining)`,
                categorized: categorizedCount,
                remaining: Math.max(0, products.length - batchSize)
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Categorization error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function categorizeFallback(title: string, description?: string): string {
    const text = `${title} ${description || ''}`.toLowerCase();

    // BEDROOM - Check first for bedroom-specific items
    if (
        text.includes('dressing table') ||
        text.includes('dresser') ||
        text.includes('wardrobe') ||
        text.includes('almirah') ||
        text.includes('nightstand') ||
        text.includes('bed frame') ||
        text.includes('mattress') ||
        (text.includes('bed') && !text.includes('sofa bed') && !text.includes('bedside'))
    ) {
        return 'Bedroom';
    }

    // OFFICE - Very specific office furniture
    if (
        text.includes('office desk') ||
        text.includes('computer desk') ||
        text.includes('study table') ||
        text.includes('office chair') ||
        text.includes('swivel chair') ||
        text.includes('task chair') ||
        text.includes('ergonomic chair') ||
        text.includes('bookshelf') ||
        text.includes('bookcase') ||
        text.includes('filing cabinet') ||
        text.includes('file cabinet') ||
        (text.includes('desk') && !text.includes('reception'))
    ) {
        return 'Office';
    }

    // LIVING ROOM
    if (
        text.includes('sofa') ||
        text.includes('couch') ||
        text.includes('settee') ||
        text.includes('recliner') ||
        text.includes('armchair') ||
        text.includes('coffee table') ||
        text.includes('centre table') ||
        text.includes('center table') ||
        text.includes('tv stand') ||
        text.includes('tv unit') ||
        text.includes('tv cabinet') ||
        text.includes('display cabinet') && !text.includes('kitchen')
    ) {
        return 'Living Room';
    }

    // DINING/KITCHEN
    if (
        text.includes('dining table') ||
        text.includes('dining chair') ||
        text.includes('dining set') ||
        text.includes('kitchen cabinet') ||
        text.includes('pantry cupboard') ||
        text.includes('buffet') ||
        text.includes('sideboard') ||
        (text.includes('table') && text.includes('chair') && !text.includes('office'))
    ) {
        return 'Dining Room';
    }

    // BATHROOM
    if (
        text.includes('bathroom') ||
        text.includes('vanity') ||
        text.includes('basin') ||
        text.includes('toilet') ||
        text.includes('commode') ||
        text.includes('shower') ||
        text.includes('bath rack')
    ) {
        return 'Bathroom';
    }

    // KIDS/BABY
    if (
        text.includes('baby') ||
        text.includes('kids') ||
        text.includes('children') ||
        text.includes('crib') ||
        text.includes('bunk bed') ||
        text.includes('toy storage')
    ) {
        return 'Kids Room';
    }

    // OUTDOOR
    if (
        text.includes('outdoor') ||
        text.includes('garden') ||
        text.includes('patio') ||
        text.includes('lawn') ||
        text.includes('gazebo')
    ) {
        return 'Outdoor';
    }

    // GENERIC FURNITURE - Try to be smarter
    if (text.includes('stool')) {
        return 'Dining Room'; // Most stools are dining/kitchen
    }

    if (text.includes('chair') && !text.includes('office')) {
        return 'Dining Room'; // Standalone chairs are usually dining
    }

    if (text.includes('table') && !text.includes('coffee') && !text.includes('center')) {
        return 'Dining Room';
    }

    if (text.includes('rack') || text.includes('shelf') || text.includes('organizer')) {
        return 'Living Room'; // Generic storage
    }

    return 'Living Room'; // Safe default
}
