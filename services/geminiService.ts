import { GoogleGenAI, Type } from "@google/genai";

interface UrlMetadata {
  title: string;
  description: string;
  imageUrl?: string | null;
}

// Ensure you have your API_KEY in environment variables
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.warn("Gemini API-Schlüssel nicht gefunden. Bitte setzen Sie die Umgebungsvariable process.env.API_KEY.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  if (!API_KEY) {
      // Fallback for demo purposes if API key is not set
      return {
          title: `Beispiel-Titel für: ${url}`,
          description: `Dies ist eine Beispielbeschreibung. Setzen Sie Ihren Gemini API-Schlüssel, um echte Daten zu erhalten.`,
          imageUrl: url.includes("maps") ? null : "https://picsum.photos/400/200"
      };
  }

  try {
    const prompt = `You are an expert web metadata extractor. Your task is to analyze the webpage at "${url}" and return a JSON object with its title, description, and a high-quality preview image URL.

Follow these steps precisely:
1.  **Title**: Find the best title. Prioritize in this order: 'og:title', then the HTML <title> tag.
2.  **Description**: Find the best description. Prioritize: 'og:description', then 'twitter:description', then a concise summary of the page's main content (max 150 chars).
3.  **Image URL**: Find ONE high-quality image URL. This is critical.
    a. **Priority 1**: The 'og:image' or 'og:image:secure_url' meta tag. These are the most reliable.
    b. **Priority 2**: The 'twitter:image' meta tag.
    c. **Final Attempt**: If no social media image tags exist, find the first content-relevant <img> tag. The image must be a meaningful photo or illustration, NOT a logo, icon, SVG, or small element.
    d. **URL Conversion**: Ensure the final URL is absolute. Convert relative paths (e.g., "/img/photo.jpg") using the base origin: ${new URL(url).origin}.
    e. **CRITICAL RULE**: If no suitable, high-quality static image is found (e.g., on web apps like Google Maps or pages with only logos/icons), you MUST return \`null\` for the imageUrl field. Do not guess. A large favicon (like an apple-touch-icon) is a last resort, but otherwise return \`null\`.

Return ONLY the final JSON object. Be fast and accurate.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "The main title of the webpage."
            },
            description: {
              type: Type.STRING,
              description: "A short summary of the page content."
            },
            imageUrl: {
              type: Type.STRING,
              description: "The direct, absolute URL for the main image. Must be null if no suitable image is found."
            }
          },
          required: ["title", "description"]
        }
      }
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    
    return {
        title: parsed.title || 'Titel nicht gefunden',
        description: parsed.description || 'Keine Beschreibung verfügbar.',
        imageUrl: parsed.imageUrl
    };

  } catch (error) {
    console.error(`Fehler beim Abrufen der Metadaten für ${url}:`, error);
    throw new Error('Metadaten konnten nicht von der Gemini API abgerufen werden.');
  }
}