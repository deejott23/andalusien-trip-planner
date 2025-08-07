import fetch from 'node-fetch';

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

function isGoogleMapsUrl(url: string): boolean {
  return /(?:google\.[a-z.]+\/maps|maps\.app\.goo\.gl)/i.test(url);
}

function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  // Match @lat,lng in path
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }
  // Match ?q=lat,lng
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }
  return null;
}

function extractPlaceIdFromUrl(url: string): string | null {
  // Match q=place_id:ChIJ...
  const pidMatch = url.match(/[?&]q=place_id:([^&]+)/);
  return pidMatch ? decodeURIComponent(pidMatch[1]) : null;
}

type NetlifyEvent = { queryStringParameters?: { url?: string } };

export const handler = async (event: NetlifyEvent) => {
  try {
    const url = event.queryStringParameters?.url || '';
    if (!url || !isGoogleMapsUrl(url)) {
      return { statusCode: 400, body: 'Invalid Google Maps URL' };
    }

    if (!PLACES_API_KEY) {
      return { statusCode: 500, body: 'Places API Key missing' };
    }

    // 1) Versuche, die Short-URL aufzulösen (maps.app.goo.gl -> finale Google-Maps-URL)
    let finalUrl = url;
    try {
      const headRes = await fetch(url, { redirect: 'follow' as any });
      if (headRes?.url) finalUrl = headRes.url;
    } catch (e) {
      // Ignorieren, wir versuchen andere Strategien
    }

    // 2) Versuche, Place-ID direkt aus der URL zu extrahieren
    let placeId: string | undefined;
    const placeIdFromUrl = extractPlaceIdFromUrl(finalUrl);
    if (placeIdFromUrl) {
      placeId = placeIdFromUrl;
    }

    // 3) Wenn keine Place-ID, versuche Koordinaten zu extrahieren und reverse geocoding
    if (!placeId) {
      const coords = extractCoordsFromUrl(finalUrl);
      if (coords) {
        const geocodeEndpoint = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${PLACES_API_KEY}`;
        const geoRes = await fetch(geocodeEndpoint);
        if (!geoRes.ok) {
          const txt = await geoRes.text();
          console.error('Geocode error', geoRes.status, txt);
        } else {
          const geoJson = await geoRes.json();
          placeId = geoJson?.results?.[0]?.place_id;
        }
      }
    }

    // 4) Fallback: findplacefromtext mit der finalen URL als Textquery
    if (!placeId) {
      const findPlaceEndpoint = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(finalUrl)}&inputtype=textquery&fields=place_id&key=${PLACES_API_KEY}`;
      const findRes = await fetch(findPlaceEndpoint);
      if (!findRes.ok) {
        const txt = await findRes.text();
        console.error('FindPlace error', findRes.status, txt);
      } else {
        const findJson = await findRes.json();
        placeId = findJson?.candidates?.[0]?.place_id;
      }
    }

    if (!placeId) {
      // Kein Treffer – 200 mit leerem JSON zurückgeben, damit der Client still weiterläuft
      return {
        statusCode: 200,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // 2. Get place details
    const fields = ['name', 'formatted_address', 'geometry/location', 'photos', 'rating', 'url'].join(',');
    const detailsEndpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${PLACES_API_KEY}`;
    const detailsRes = await fetch(detailsEndpoint);
    if (!detailsRes.ok) {
      const txt = await detailsRes.text();
      console.error('Place Details error', detailsRes.status, txt);
      return { statusCode: 502, body: 'Google Place Details Fehler' };
    }
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
