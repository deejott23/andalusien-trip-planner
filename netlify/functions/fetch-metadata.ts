import fetch from "node-fetch";

type NetlifyEvent = { queryStringParameters?: { url?: string } };

function extractHeadHtml(html: string): string {
  const match = html.match(/<head[\s\S]*?<\/head>/i);
  return match ? match[0] : html;
}

function getMetaContent(headHtml: string, names: string[], baseUrl: string): string | undefined {
  for (const name of names) {
    const og = new RegExp(`<meta[^>]+property=["']og:${name}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i');
    const byName = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`, 'i');
    const m1 = headHtml.match(og);
    if (m1 && m1[1]) return resolveUrl(m1[1], baseUrl);
    const m2 = headHtml.match(byName);
    if (m2 && m2[1]) return resolveUrl(m2[1], baseUrl);
  }
  return undefined;
}

function resolveUrl(possiblyRelative: string, baseUrl: string): string {
  try {
    if (possiblyRelative.startsWith('//')) return `https:${possiblyRelative}`;
    return new URL(possiblyRelative, baseUrl).toString();
  } catch {
    return possiblyRelative;
  }
}

function extractTitle(headHtml: string): string | undefined {
  const mOg = headHtml.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (mOg && mOg[1]) return mOg[1];
  const mTitle = headHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (mTitle && mTitle[1]) return mTitle[1].trim();
  const mName = headHtml.match(/<meta[^>]+name=["']title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (mName && mName[1]) return mName[1];
  return undefined;
}

function extractDescription(headHtml: string): string | undefined {
  const mOg = headHtml.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (mOg && mOg[1]) return mOg[1];
  const mName = headHtml.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (mName && mName[1]) return mName[1];
  return undefined;
}

function extractImage(headHtml: string, baseUrl: string): string | undefined {
  const fromOg = getMetaContent(headHtml, ["image"], baseUrl);
  if (fromOg) return fromOg;
  const twitter = headHtml.match(/<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (twitter && twitter[1]) return resolveUrl(twitter[1], baseUrl);
  const itemprop = headHtml.match(/<meta[^>]+itemprop=["']image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (itemprop && itemprop[1]) return resolveUrl(itemprop[1], baseUrl);
  // Notfall: erstes <img> im Head (selten) oder im Anfang des Dokuments
  const img = headHtml.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (img && img[1]) return resolveUrl(img[1], baseUrl);
  return undefined;
}

export const handler = async (event: NetlifyEvent) => {
  const url = event.queryStringParameters?.url;

  if (!url) {
    return { statusCode: 400, body: JSON.stringify({ error: "URL is required" }) };
  }

  try {
    console.log(`Fetching metadata for: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000 as any
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error('Fetch target error', response.status, txt.slice(0, 500));
      return { statusCode: 502, body: JSON.stringify({ error: 'Upstream error' }) };
    }

    const html = await response.text();
    const headHtml = extractHeadHtml(html);

    const title = extractTitle(headHtml) || url;
    const description = extractDescription(headHtml);
    const imageUrl = extractImage(headHtml, url);

    const metadata = { title, description, imageUrl };

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
    console.error('fetch-metadata error', error);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch metadata" }) };
  }
};

export default handler;