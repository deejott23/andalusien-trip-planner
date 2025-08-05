import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const url = event.queryStringParameters?.url;

  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "URL is required" }),
    };
  }

  try {
    console.log(`Fetching metadata for: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const getMetaTag = (name: string) => {
      const el = doc.querySelector(`meta[property='og:${name}']`) || doc.querySelector(`meta[name='${name}']`);
      return el?.getAttribute("content");
    };

    // Verbesserte Bildsuche
    const findImageUrl = () => {
      // 1. Open Graph Image
      const ogImage = getMetaTag("image");
      if (ogImage) return ogImage;

      // 2. Twitter Card Image
      const twitterImage = doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content");
      if (twitterImage) return twitterImage;

      // 3. Schema.org Image
      const schemaImage = doc.querySelector('meta[itemprop="image"]')?.getAttribute("content");
      if (schemaImage) return schemaImage;

      // 4. Erste Bild-URL aus dem Content
      const firstImage = doc.querySelector('img[src]');
      if (firstImage) {
        const src = firstImage.getAttribute("src");
        if (src && (src.startsWith('http') || src.startsWith('//'))) {
          return src.startsWith('//') ? `https:${src}` : src;
        }
      }

      return null;
    };

    const metadata = {
      title: getMetaTag("title") || doc.title,
      description: getMetaTag("description"),
      imageUrl: findImageUrl(),
    };

    console.log(`Metadata extracted:`, metadata);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(metadata),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch metadata" }),
    };
  }
};

export { handler };