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
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const getMetaTag = (name: string) => {
      const el = doc.querySelector(`meta[property='og:${name}']`) || doc.querySelector(`meta[name='${name}']`);
      return el?.getAttribute("content");
    };

    const metadata = {
      title: getMetaTag("title") || doc.title,
      description: getMetaTag("description"),
      imageUrl: getMetaTag("image"),
    };

    return {
      statusCode: 200,
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