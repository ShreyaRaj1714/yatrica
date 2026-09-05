import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// --- Types ---

interface ItineraryRequestBody {
  destination: string;
  days: number;
  budget: number;
  interests: string[];
}

interface DayPlan {
  day: number;
  morning: string;
  afternoon: string;
  evening: string;
}

interface Itinerary {
  days: DayPlan[];
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
You are a travel planning assistant. Generate a detailed day-by-day travel itinerary.

Trip details:
- Destination: ${destination}
- Duration: ${days} day(s)
- Budget: ₹${budget} INR total (Indian Rupees)
- Interests: ${interestsList}

Important: The budget is in Indian Rupees (INR), not USD. Recommend activities, restaurants, and accommodation that are realistically priced within this INR budget. Use ₹ when mentioning any prices.

Respond ONLY with a valid JSON object. Do not include markdown, code fences, backticks, or any explanation — just raw JSON.

The JSON must follow this exact structure:
{
  "days": [
    {
      "day": 1,
      "morning": "Description of morning activity",
      "afternoon": "Description of afternoon activity",
      "evening": "Description of evening activity"
    }
  ]
}

Generate exactly ${days} day object(s) in the "days" array, numbered 1 through ${days}.
Keep each activity description concise (1–2 sentences), specific to ${destination}, and mindful of the ₹${budget} INR budget.
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
