export async function crawlUrl(startUrl: string, depth: number) {
    const queue: string[] = [startUrl]; 
    const visited: Set<string> = new Set([startUrl]); 
    const docs: any[] = [];
    
    const startDomain = new URL(startUrl).hostname;

    console.log(`Starting crawl for ${startUrl} with depth limit of ${depth} pages`);

    while (queue.length > 0 && docs.length < depth) {
        // We take the first URL from the queue (BFS) and process it
        const currentUrl = queue.shift()!;
        
        try {
            console.log(`📄 Scrapping (${docs.length + 1}/${depth}): ${currentUrl}`);
            
            
            const response = await fetch(`https://r.jina.ai/${currentUrl}`, {
                headers: {
                    'Accept': 'application/json',
                    // 'Authorization': `Bearer ${process.env.JINA_API_KEY}` // (Optional)
                }
            });

            if (!response.ok) {
                console.warn(`⚠️ Error HTTP ${response.status} scrapping ${currentUrl}`);
                continue;
            }

            const json = await response.json();
            
            // Extract the data from the response.
            const { title, content, url: finalUrl } = json.data;

            docs.push({
                metadata: {
                    title: title || '',
                    sourceURL: finalUrl || currentUrl,
                },
                markdown: content || ''
            });

            if (docs.length >= depth) break;

            // Extract links from the content to continue crawling
            const linkRegex = /\[.*?\]\((.*?)\)/g;
            let match;
            
            while ((match = linkRegex.exec(content)) !== null) {
                let linkUrl = match[1];
                
                try {
                    // Clean the urls (relative to absolute, remove hashes)
                    const parsedUrl = new URL(linkUrl, finalUrl || currentUrl);
                    parsedUrl.hash = ''; // Quitamos el ancla (#) para no repetir la misma página
                    linkUrl = parsedUrl.href;

                    // if the link is within the same domain and we haven't visited it yet, we add it to the queue
                    if (parsedUrl.hostname === startDomain && !visited.has(linkUrl)) {
                        visited.add(linkUrl);
                        queue.push(linkUrl);
                    }
                } catch (e) {
                    // if the URL is malformed, we skip it
                    console.warn(`Malformed URL skipped: ${linkUrl} (found in ${currentUrl})`);
                }
            }

            // Small delay to avoid hitting the server too hard (optional, adjust as needed)
            await new Promise(res => setTimeout(res, 1000));

        } catch (error) {
            console.error(`Error processing ${currentUrl}:`, error);
        }
    }

    console.log(`Crawl finished. Docs received: ${docs.length}`);
    return docs;
}