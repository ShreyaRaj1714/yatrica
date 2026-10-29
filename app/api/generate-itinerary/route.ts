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
  hotels: {
    budget: Hotel;
    mid_range: Hotel;
    premium: Hotel;
  };
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

    // 3. Build prompt
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

Important rules:
- All prices must be in Indian Rupees (₹ INR). Budget accordingly — ₹${budget} is the TOTAL trip budget.
- Use ₹ symbol when mentioning prices in descriptions.
- Provide realistic approximate GPS coordinates (approx_lat, approx_lng) for every activity and hotel — these will be plotted on a map.
- Each day must have exactly 3 activities: one morning, one afternoon, one evening.
- Recommend 3 hotels: one budget, one mid-range, one premium — all in or near ${destination}.

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

    // 4. Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      { model: 'gemini-3.6-flash' },
      { apiVersion: 'v1' }
    );

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

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

    // 6. Return parsed itinerary
    return NextResponse.json(itinerary, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('[generate-itinerary]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
