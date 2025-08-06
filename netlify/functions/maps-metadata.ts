import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

function isGoogleMapsUrl(url: string): boolean {
  return /(?:google\.[a-z.]+\/maps|maps\.app\.goo\.gl)/i.test(url);
}

export const handler: Handler = async (event) => {
  try {
    const url = event.queryStringParameters?.url || '';
    if (!url || !isGoogleMapsUrl(url)) {
      return { statusCode: 400, body: 'Invalid Google Maps URL' };
    }

    if (!PLACES_API_KEY) {
      return { statusCode: 500, body: 'Places API Key missing' };
    }

    // 1. Find place from text (URL string)
    const findPlaceEndpoint = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(url)}&inputtype=textquery&fields=place_id&key=${PLACES_API_KEY}`;
    const findRes = await fetch(findPlaceEndpoint);
    const findJson = await findRes.json();
    const placeId = findJson?.candidates?.[0]?.place_id;
    if (!placeId) {
      return { statusCode: 404, body: 'Place not found' };
    }

    // 2. Get place details
    const fields = ['name', 'formatted_address', 'geometry/location', 'photos', 'rating', 'url'].join(',');
    const detailsEndpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${PLACES_API_KEY}`;
    const detailsRes = await fetch(detailsEndpoint);
    const detailsJson = await detailsRes.json();
    const result = detailsJson?.result;
    if (!result) {
      return { statusCode: 404, body: 'Details not found' };
    }

    let imageUrl: string | null = null;
    if (result.photos?.length) {
      const photoRef = result.photos[0].photo_reference;
      imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${PLACES_API_KEY}`;
    }

    const payload = {
      title: result.name,
      description: result.formatted_address,
      lat: result.geometry?.location?.lat,
      lng: result.geometry?.location?.lng,
      rating: result.rating,
      mapsUrl: result.url || url,
      imageUrl,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('maps-metadata error', error);
    return { statusCode: 500, body: 'Server error' };
  }
};
