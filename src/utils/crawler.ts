// Install with npm install @mendable/firecrawl-js
import FirecrawlApp from '@mendable/firecrawl-js';

const app = new FirecrawlApp({apiKey: process.env.NEXT_FIRECRAWL_KEY});

export async function crawlUrl(url: string) {
    return await app.scrape(
        url,
        {
            formats: ['markdown']
        }
    )

}

