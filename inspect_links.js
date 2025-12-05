const cheerio = require('cheerio');

async function main() {
    try {
        const response = await fetch('https://www.damro.lk');
        const html = await response.text();
        const $ = cheerio.load(html);

        console.log('--- Links Found ---');
        $('a').each((_, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            if (href && href.startsWith('http') && text) {
                console.log(`${text} -> ${href}`);
            }
        });
    } catch (e) {
        console.error(e);
    }
}

main();
