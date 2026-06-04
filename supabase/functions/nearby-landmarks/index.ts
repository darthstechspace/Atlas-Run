import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PlaceResult = {
  place_id: string;
  name: string;
  geometry: { location: { lat: number; lng: number } };
  types?: string[];
  vicinity?: string;
};

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true };
}

function mapCategory(types: string[] = []): string {
  if (types.some((t) => t.includes('library'))) return 'Library';
  if (types.some((t) => t.includes('museum'))) return 'Museum';
  if (types.some((t) => t.includes('park'))) return 'Park';
  if (types.some((t) => t.includes('monument') || t.includes('tourist'))) return 'Monument';
  if (types.some((t) => t.includes('trail') || t.includes('natural'))) return 'Trail';
  return 'Historic';
}

function mapRarity(types: string[] = []): string {
  if (types.some((t) => t.includes('university') || t.includes('museum'))) return 'Rare';
  if (types.some((t) => t.includes('tourist_attraction'))) return 'Epic';
  if (types.some((t) => t.includes('park') || t.includes('library'))) return 'Uncommon';
  return 'Common';
}

async function searchPlaces(lat: number, lng: number, radius: number, type: string, googleKey: string) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  url.searchParams.set('location', `${lat},${lng}`);
  url.searchParams.set('radius', String(radius));
  url.searchParams.set('type', type);
  url.searchParams.set('key', googleKey);
  const res = await fetch(url.toString());
  const data = await res.json();
  return (data.results ?? []) as PlaceResult[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const rate = checkRateLimit(user.id);
    if (!rate.ok) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': String(rate.retryAfterSec ?? 60),
        },
      });
    }

    const { lat, lng, radius = 1500 } = await req.json();
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return new Response(JSON.stringify({ error: 'lat and lng required' }), { status: 400, headers: corsHeaders });
    }

    const googleKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleKey) {
      return new Response(JSON.stringify({ error: 'GOOGLE_PLACES_API_KEY not configured' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const placeTypes = ['library', 'museum', 'park', 'tourist_attraction', 'church'];
    const batches = await Promise.all(
      placeTypes.map((type) => searchPlaces(lat, lng, radius, type, googleKey))
    );

    const seen = new Set<string>();
    const results: PlaceResult[] = [];
    for (const batch of batches) {
      for (const place of batch) {
        if (!seen.has(place.place_id)) {
          seen.add(place.place_id);
          results.push(place);
        }
      }
    }

    const landmarks = results.slice(0, 30).map((p) => {
      const category = mapCategory(p.types);
      const rarity = mapRarity(p.types);
      return {
        place_id: p.place_id,
        name: p.name,
        latitude: p.geometry.location.lat,
        longitude: p.geometry.location.lng,
        category,
        rarity,
        lore: p.vicinity ? `Discovered near ${p.vicinity}.` : 'A local point of interest awaits explorers.',
      };
    });

    if (landmarks.length > 0) {
      await supabase.from('landmark_cache').upsert(landmarks, { onConflict: 'place_id' });
    }

    return new Response(JSON.stringify({ landmarks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
