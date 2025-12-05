import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';

// Helper to scrape a single HTML page
const scrapePage = (html: string, url: string) => {
    const $ = cheerio.load(html);
    const baseUrl = new URL(url).origin;
    const products: any[] = [];
    const links: string[] = [];

    // Helper to infer category from URL
    const inferCategory = (link: string) => {
        try {
            const urlObj = new URL(link);
            const path = urlObj.pathname.toLowerCase();
            // Common categories
            if (path.includes('living')) return 'living room';
            if (path.includes('bedroom') || path.includes('bed')) return 'bedroom';
            if (path.includes('kitchen') || path.includes('dining') || path.includes('cook')) return 'kitchen'; // Group dining with kitchen/dining
            if (path.includes('office')) return 'office';
            if (path.includes('bath')) return 'bathroom';

            // Fallback: try to get the segment before the product name
            const segments = path.split('/').filter(Boolean);
            if (segments.length > 1) {
                return segments[segments.length - 2].replace(/-/g, ' ');
            }
            return 'other';
        } catch (e) {
            return 'other';
        }
    };

    // 1. Extract Links for Crawling
    $('a').each((_, element) => {
        let href = $(element).attr('href');
        if (href) {
            if (!href.startsWith('http')) {
                href = new URL(href, baseUrl).toString();
            }
            // Only internal links
            if (href.startsWith(baseUrl)) {
                links.push(href);
            }
        }
    });

    // 2. Extract Products
    const productCardSelectors = [
        '.product-card', '.product-item', '.grid-item', 'li.product',
        '.v-product', '.card', '.item', '[data-product-id]',
        '.product-grid-item', '.archive-product', '.product-inner',
        '.woocommerce-LoopProduct-link'
    ];

    let foundGrid = false;

    for (const selector of productCardSelectors) {
        const cards = $(selector);
        if (cards.length > 1) {
            cards.each((_, element) => {
                const card = $(element);
                let title = card.find('h2, h3, h4, .product-title, .name, .title, .product-name, .woocommerce-loop-product__title').first().text().trim();
                let price = card.find('.price, .amount, .money, [data-price], .product-price').first().text().trim();
                let image = card.find('img').attr('src') || card.find('img').attr('data-src');
                let link = card.find('a').attr('href');

                if (title && image) {
                    if (image && !image.startsWith('http')) image = new URL(image, baseUrl).toString();
                    if (link && !link.startsWith('http')) link = new URL(link, baseUrl).toString();
                    if (price) price = price.replace(/\s+/g, ' ').trim();

                    const category = inferCategory(link || url);

                    products.push({
                        title,
                        price: price || 'Check Price',
                        image_url: image,
                        product_url: link || url,
                        source: new URL(url).hostname,
                        category: category
                    });
                }
            });
            if (products.length > 0) foundGrid = true;
        }
    }

    // Fallback: Single Product Page Metadata
    if (!foundGrid) {
        let title = $('meta[property="og:title"]').attr('content') || $('title').text();
        let image = $('meta[property="og:image"]').attr('content');
        let price = $('[itemprop="price"], .price, .product-price').first().text().trim();

        if (title && image) {
            if (image && !image.startsWith('http')) image = new URL(image, baseUrl).toString();

            const category = inferCategory(url);

            products.push({
                title: title.trim(),
                price: price || 'Check Price',
                image_url: image,
                product_url: url,
                source: new URL(url).hostname,
                category: category
            });
        }
    }

    return { products, links: [...new Set(links)] };
};

export async function POST(request: NextRequest) {
    try {
        const { url, maxPages = 5, action = 'scrape' } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        console.log(`Request: ${action} at ${url}`);

        if (action === 'discover') {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Compatible; DreamRoomBot/1.0)' }
            });
            const html = await response.text();
            const $ = cheerio.load(html);
            const baseUrl = new URL(url).origin;
            const discoveredLinks: { title: string, url: string }[] = [];
            const seen = new Set();

            $('a').each((_, element) => {
                let href = $(element).attr('href');
                let text = $(element).text().trim();

                if (href && text) {
                    if (!href.startsWith('http')) {
                        try { href = new URL(href, baseUrl).toString(); } catch (e) { }
                    }

                    // Filter for likely category links
                    if (href && href.startsWith(baseUrl) && !seen.has(href)) {
                        // Heuristic: Link contains 'product', 'category', 'shop', or matches known categories
                        const lowerHref = href.toLowerCase();
                        if (
                            lowerHref.includes('product') ||
                            lowerHref.includes('category') ||
                            lowerHref.includes('living') ||
                            lowerHref.includes('bedroom') ||
                            lowerHref.includes('dining') ||
                            lowerHref.includes('office')
                        ) {
                            seen.add(href);
                            discoveredLinks.push({ title: text, url: href });
                        }
                    }
                }
            });

            return NextResponse.json({ success: true, links: discoveredLinks.slice(0, 50) });
        }
        const visited = new Set<string>();
        const queue = [url];
        const allProducts: any[] = [];

        let pagesScraped = 0;
        const MAX_PAGES = Math.min(maxPages, 10); // Hard limit for Vercel timeout safety

        while (queue.length > 0 && pagesScraped < MAX_PAGES) {
            const currentUrl = queue.shift()!;

            if (visited.has(currentUrl)) continue;
            visited.add(currentUrl);

            console.log(`Scraping (${pagesScraped + 1}/${MAX_PAGES}): ${currentUrl}`);

            try {
                const response = await fetch(currentUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Compatible; DreamRoomBot/1.0)' },
                    signal: AbortSignal.timeout(5000) // 5s timeout per page
                });

                if (!response.ok) continue;

                const html = await response.text();
                const { products, links } = scrapePage(html, currentUrl);

                // Add products
                products.forEach(p => {
                    // Simple duplicate check
                    if (!allProducts.some(existing => existing.image_url === p.image_url)) {
                        allProducts.push(p);
                    }
                });

                // Add new links to queue (prioritize product/category links if possible)
                for (const link of links) {
                    if (!visited.has(link)) {
                        // Simple heuristic: prioritize links that look like categories
                        if (link.includes('product') || link.includes('category') || link.includes('shop') || link.includes('collection')) {
                            queue.unshift(link); // BFS but prioritize interesting links
                        } else {
                            queue.push(link);
                        }
                    }
                }

                pagesScraped++;

            } catch (err) {
                console.error(`Failed to scrape ${currentUrl}:`, err);
            }
        }

        console.log(`Crawl complete. Found ${allProducts.length} products.`);

        if (allProducts.length === 0) {
            return NextResponse.json({ error: 'No products found during crawl' }, { status: 422 });
        }

        // Save to Supabase
        const { data, error } = await supabase
            .from('products')
            .upsert(allProducts, { onConflict: 'image_url' }) // Requires unique constraint on image_url
            .select();

        // If upsert fails (no constraint), try insert ignoring errors for now
        if (error) {
            await supabase.from('products').insert(allProducts).select();
        }

        return NextResponse.json({
            success: true,
            count: allProducts.length,
            pagesScraped,
            products: allProducts
        });

    } catch (error: any) {
        console.error('Crawl Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to crawl website' },
            { status: 500 }
        );
    }
}
