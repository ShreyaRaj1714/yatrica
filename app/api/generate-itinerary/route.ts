import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// --- Types ---

interface ItineraryRequestBody {
  destination: string;
  days: number;
  budget: number;
  interests: string[];
}

export interface Activity {
  time: 'morning' | 'afternoon' | 'evening';
  title: string;
  description: string;
  place_name: string;
  area: string;
  approx_lat: number;
  approx_lng: number;
}

export interface DayPlan {
  day: number;
  activities: Activity[];
}

export interface Hotel {
  name: string;
  area: string;
  price_per_night_inr: number;
  why_recommended: string;
  approx_lat: number;
  approx_lng: number;
}

export interface Itinerary {
  days: DayPlan[];
  hotels?: {
    budget?: Hotel;
    mid_range?: Hotel;
    premium?: Hotel;
  };
  hotelBudgetPerNight?: number;
}

// --- Helpers ---

function isRetryableError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('high demand') ||
    msg.includes('Service Unavailable') ||
    msg.includes('Too Many Requests') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('UNAVAILABLE')
  );
}

// --- Route handler ---

export async function POST(req: NextRequest) {
  try {
    // 1. Parse & validate request body
    const body: ItineraryRequestBody = await req.json();
    const { destination, days, budget, interests } = body;

    if (!destination || !days || !budget) {
      return NextResponse.json(
        { error: 'Missing required fields: destination, days, budget' },
        { status: 400 }
      );
    }

    // 2. Validate API key
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server misconfiguration: GOOGLE_GEMINI_API_KEY is not set' },
        { status: 500 }
      );
    }

    // 3. Compute hotel budget per night (40% of total budget / days, rounded to nearest 100)
    const hotelBudgetPerNight = Math.max(
      100,
      Math.round(((budget * 0.4) / days) / 100) * 100
    );

    // 4. Build prompt
    const interestsList =
      interests && interests.length > 0
        ? interests.join(', ')
        : 'general sightseeing';

    const prompt = `
You are an expert travel planning assistant with deep knowledge of Indian destinations. Generate a rich, realistic day-by-day travel itinerary.

Trip details:
- Destination: ${destination}
- Duration: ${days} day(s)
- Total Budget: ₹${budget} INR (Indian Rupees)
- Interests: ${interestsList}
- Max Hotel Budget per Night: ₹${hotelBudgetPerNight} INR

Important rules:
- All prices must be in Indian Rupees (₹ INR). Budget accordingly — ₹${budget} is the TOTAL trip budget.
- Use ₹ symbol when mentioning prices in descriptions.
- Provide realistic approximate GPS coordinates (approx_lat, approx_lng) for every activity and hotel — these will be plotted on a map.
- Each day must have exactly 3 activities: one morning, one afternoon, one evening.
- Recommend exactly 3 stays with price_per_night_inr AT MOST ₹${hotelBudgetPerNight}. Do not suggest any stay above this price. If the budget is very low, suggest hostels, homestays or budget guesthouses.

Respond ONLY with a valid JSON object. Do not include markdown, code fences, backticks, or any explanation — output raw JSON only.

The JSON must follow this EXACT structure (no extra fields, no missing fields):
{
  "days": [
    {
      "day": 1,
      "activities": [
        {
          "time": "morning",
          "title": "Short activity title",
          "description": "1–2 sentence description with any relevant prices in ₹",
          "place_name": "Exact name of the place",
          "area": "Neighbourhood or town name",
          "approx_lat": 28.6139,
          "approx_lng": 77.2090
        },
        {
          "time": "afternoon",
          "title": "Short activity title",
          "description": "1–2 sentence description",
          "place_name": "Exact name of the place",
          "area": "Neighbourhood or town name",
          "approx_lat": 28.6200,
          "approx_lng": 77.2100
        },
        {
          "time": "evening",
          "title": "Short activity title",
          "description": "1–2 sentence description",
          "place_name": "Exact name of the place",
          "area": "Neighbourhood or town name",
          "approx_lat": 28.6300,
          "approx_lng": 77.2200
        }
      ]
    }
  ],
  "hotels": {
    "budget": {
      "name": "Hotel name",
      "area": "Neighbourhood or town",
      "price_per_night_inr": 1500,
      "why_recommended": "1 sentence reason",
      "approx_lat": 28.6150,
      "approx_lng": 77.2080
    },
    "mid_range": {
      "name": "Hotel name",
      "area": "Neighbourhood or town",
      "price_per_night_inr": 4500,
      "why_recommended": "1 sentence reason",
      "approx_lat": 28.6160,
      "approx_lng": 77.2085
    },
    "premium": {
      "name": "Hotel name",
      "area": "Neighbourhood or town",
      "price_per_night_inr": 12000,
      "why_recommended": "1 sentence reason",
      "approx_lat": 28.6170,
      "approx_lng": 77.2090
    }
  }
}

Generate exactly ${days} day object(s) in the "days" array, numbered 1 through ${days}.
Tailor every activity and hotel to ${destination}, the ₹${budget} INR budget, and the interests: ${interestsList}.
`.trim();

    // 4. Call Gemini with retry on 503/429 (3 attempts on main model: wait 2s, then 4s)
    const genAI = new GoogleGenerativeAI(apiKey);
    const MAIN_MODEL = 'gemini-3.6-flash';
    const FALLBACK_MODEL = 'gemini-3.5-flash-lite';
    const RETRY_DELAYS_MS = [2000, 4000];

    let rawText = '';

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const model = genAI.getGenerativeModel(
          { model: MAIN_MODEL },
          { apiVersion: 'v1' }
        );
        const result = await model.generateContent(prompt);
        rawText = result.response.text().trim();
        break; // Succeeded
      } catch (err: unknown) {
        console.warn(`[generate-itinerary] Attempt ${attempt}/3 on ${MAIN_MODEL} failed:`, err instanceof Error ? err.message : err);
        if (attempt < 3 && isRetryableError(err)) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]));
        } else if (!isRetryableError(err)) {
          break;
        }
      }
    }

    // If all attempts on main model fail, try once with fallback model
    if (!rawText) {
      console.warn(`[generate-itinerary] Main model failed. Trying fallback model: ${FALLBACK_MODEL}...`);
      try {
        const fallback = genAI.getGenerativeModel(
          { model: FALLBACK_MODEL },
          { apiVersion: 'v1' }
        );
        const result = await fallback.generateContent(prompt);
        rawText = result.response.text().trim();
      } catch (fallbackErr: unknown) {
        console.error(`[generate-itinerary] Fallback model ${FALLBACK_MODEL} failed:`, fallbackErr instanceof Error ? fallbackErr.message : fallbackErr);
      }
    }

    // If everything fails, return friendly error message
    if (!rawText) {
      return NextResponse.json(
        { error: 'Our AI is busy right now, please try again in a minute.' },
        { status: 503 }
      );
    }

    // 5. Strip any accidental markdown fences and parse JSON
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    let itinerary: Itinerary;
    try {
      itinerary = JSON.parse(cleaned);
    } catch {
      console.error('Gemini returned non-JSON response:', rawText);
      return NextResponse.json(
        { error: 'Failed to parse itinerary from AI response', raw: rawText },
        { status: 502 }
      );
    }

    // 6. Filter hotels above hotelBudgetPerNight
    if (itinerary.hotels && typeof itinerary.hotels === 'object') {
      const hotelEntries = Object.entries(itinerary.hotels).filter(
        (entry): entry is [string, Hotel] => Boolean(entry[1] && typeof entry[1] === 'object')
      );

      if (hotelEntries.length > 0) {
        const withinBudget = hotelEntries.filter(
          ([, hotel]) => typeof hotel.price_per_night_inr === 'number' && hotel.price_per_night_inr <= hotelBudgetPerNight
        );

        if (withinBudget.length > 0) {
          const filteredHotels: Record<string, Hotel> = {};
          for (const [key, hotel] of withinBudget) {
            filteredHotels[key] = hotel;
          }
          itinerary.hotels = filteredHotels;
        } else {
          // If none remain, keep the cheapest one from the original list
          const cheapest = hotelEntries.reduce((prev, curr) => {
            const prevPrice = typeof prev[1].price_per_night_inr === 'number' ? prev[1].price_per_night_inr : Infinity;
            const currPrice = typeof curr[1].price_per_night_inr === 'number' ? curr[1].price_per_night_inr : Infinity;
            return currPrice < prevPrice ? curr : prev;
          });
          itinerary.hotels = {
            [cheapest[0]]: cheapest[1],
          };
        }
      }
    }

    itinerary.hotelBudgetPerNight = hotelBudgetPerNight;

    // 7. Return parsed itinerary
    return NextResponse.json(itinerary, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[generate-itinerary]', message);
    if (isRetryableError(err)) {
      return NextResponse.json(
        { error: 'Our AI is busy right now, please try again in a minute.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
