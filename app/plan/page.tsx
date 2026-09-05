'use client';

import { useState, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';

// --- Types ---

const INTERESTS = [
  { label: 'Nature',      emoji: '🌿' },
  { label: 'Food',        emoji: '🍜' },
  { label: 'History',     emoji: '🏛️' },
  { label: 'Nightlife',   emoji: '🎶' },
  { label: 'Adventure',   emoji: '🧗' },
  { label: 'Relaxation',  emoji: '🧘' },
] as const;

type Interest = (typeof INTERESTS)[number]['label'];

interface DayPlan {
  day: number;
  morning: string;
  afternoon: string;
  evening: string;
}

interface Itinerary {
  days: DayPlan[];
}

// --- Day card ---

const timeSlots = [
  { key: 'morning'   as const, icon: '🌅', label: 'Morning',   bg: 'from-amber-50 to-orange-50',  border: 'border-amber-100'  },
  { key: 'afternoon' as const, icon: '☀️', label: 'Afternoon', bg: 'from-sky-50 to-teal-50',      border: 'border-sky-100'    },
  { key: 'evening'   as const, icon: '🌙', label: 'Evening',   bg: 'from-violet-50 to-indigo-50', border: 'border-violet-100' },
];

function DayCard({ plan }: { plan: DayPlan }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-md shadow-orange-100/60 border border-orange-100 bg-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-200/50">
      <div className="bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white text-sm font-bold">
          {plan.day}
        </span>
        <h3 className="font-display text-white font-bold text-lg tracking-wide">Day {plan.day}</h3>
      </div>
      <div className="divide-y divide-stone-100">
        {timeSlots.map(({ key, icon, label, bg, border }) => (
          <div key={key} className={`bg-gradient-to-r ${bg} px-6 py-4 border-l-4 ${border}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{icon}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-stone-400">{label}</span>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed">{plan[key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Loading skeleton ---

function LoadingSkeleton({ count }: { count: number }) {
  return (
    <div className="mt-12 space-y-5">
      <div className="flex items-center gap-3 animate-pulse">
        <div className="h-5 w-48 bg-stone-200 rounded-full" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden border border-orange-100 shadow-md animate-pulse">
          <div className="h-14 bg-gradient-to-r from-orange-300 to-rose-300" />
          {[1, 2, 3].map((j) => (
            <div key={j} className="px-6 py-4 border-t border-stone-100 space-y-2">
              <div className="h-3 w-20 bg-stone-200 rounded-full" />
              <div className="h-4 w-full bg-stone-100 rounded-full" />
              <div className="h-4 w-4/5 bg-stone-100 rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// --- Save status banner ---

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function SaveBanner({ status, errorMsg }: { status: SaveStatus; errorMsg: string | null }) {
  if (status === 'idle') return null;

  const configs = {
    saving: { bg: 'bg-amber-50 border-amber-200',  text: 'text-amber-700', icon: '⏳', msg: 'Saving trip…'       },
    saved:  { bg: 'bg-teal-50 border-teal-200',    text: 'text-teal-700',  icon: '✅', msg: 'Trip saved!'        },
    error:  { bg: 'bg-red-50 border-red-200',      text: 'text-red-700',   icon: '⚠️', msg: errorMsg ?? 'Save failed' },
  };

  const c = configs[status];
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-5 py-3 text-sm font-medium ${c.bg} ${c.text} transition-all`}>
      <span className="text-base">{c.icon}</span>
      {c.msg}
    </div>
  );
}

// --- Main Page ---

export default function PlanPage() {
  const [destination, setDestination] = useState('');
  const [days, setDays]               = useState<number | ''>('');
  const [budget, setBudget]           = useState<number | ''>('');
  const [interests, setInterests]     = useState<Interest[]>([]);

  const [loading, setLoading]     = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [error, setError]         = useState<string | null>(null);

  const [saveStatus, setSaveStatus]   = useState<SaveStatus>('idle');
  const [saveError, setSaveError]     = useState<string | null>(null);

  const toggleInterest = (label: Interest) =>
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );

  // Save trip to Supabase
  const saveTrip = async (generatedItinerary: Itinerary) => {
    setSaveStatus('saving');
    setSaveError(null);

    const { error: dbError } = await supabase.from('trips').insert({
      destination,
      days: Number(days),
      budget: Number(budget),
      interests,
      itinerary_json: generatedItinerary,
    });

    if (dbError) {
      console.error('[saveTrip]', dbError.message);
      setSaveError(dbError.message);
      setSaveStatus('error');
    } else {
      setSaveStatus('saved');
      // Auto-reset banner after 4 s
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setItinerary(null);
    setError(null);
    setSaveStatus('idle');

    try {
      const res = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, days: Number(days), budget: Number(budget), interests }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

      const generatedItinerary = data as Itinerary;
      setItinerary(generatedItinerary);

      // Save to Supabase after successful generation
      await saveTrip(generatedItinerary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-teal-50">

      {/* ── Hero bar ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-rose-500 to-teal-600 px-6 py-10 text-center">
        <div className="absolute inset-0 bg-dot-pattern opacity-20 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="font-display text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">
            Plan My Trip ✈️
          </h1>
          <p className="text-white/80 text-base max-w-md mx-auto">
            Fill in the details below and Gemini AI will craft your perfect day-by-day itinerary.
          </p>
        </div>
      </div>

      {/* ── Form + Results ── */}
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">

        {/* Form card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-orange-100/60 border border-orange-100 p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-7">

            {/* Destination */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="destination" className="text-sm font-semibold text-stone-700">
                🗺️ Destination
              </label>
              <input
                id="destination"
                type="text"
                required
                placeholder="e.g. Kyoto, Japan"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Days & Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="days" className="text-sm font-semibold text-stone-700">
                  📅 Number of Days
                </label>
                <input
                  id="days"
                  type="number"
                  required
                  min={1}
                  max={30}
                  placeholder="e.g. 7"
                  value={days}
                  onChange={(e) => setDays(e.target.value === '' ? '' : Number(e.target.value))}
                  className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="budget" className="text-sm font-semibold text-stone-700">
                  💰 Budget (₹)
                </label>
                <input
                  id="budget"
                  type="number"
                  required
                  min={0}
                  placeholder="e.g. 50000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value === '' ? '' : Number(e.target.value))}
                  className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Interests */}
            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-stone-700">🎯 What do you love?</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {INTERESTS.map(({ label, emoji }) => {
                  const selected = interests.includes(label);
                  return (
                    <label
                      key={label}
                      className={`flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 cursor-pointer text-sm font-medium transition-all duration-200 select-none
                        ${selected
                          ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-rose-50 text-orange-700 shadow-sm shadow-orange-100'
                          : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-orange-200 hover:bg-orange-50/50'
                        }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selected}
                        onChange={() => toggleInterest(label)}
                      />
                      <span className="text-lg">{emoji}</span>
                      {label}
                      {selected && <span className="ml-auto text-orange-500 text-xs">✓</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="relative mt-1 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 animate-gradient px-8 py-4 text-white font-bold text-base shadow-lg shadow-orange-300/50 hover:shadow-xl hover:shadow-orange-400/50 hover:scale-[1.02] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-orange-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Generating your itinerary…
                  </span>
                : '✈️ Generate My Itinerary'
              }
            </button>
          </form>
        </div>

        {/* Loading skeleton */}
        {loading && <LoadingSkeleton count={Number(days) || 3} />}

        {/* Generation error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 flex gap-3 items-start">
            <span className="text-xl mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold text-red-700 text-sm mb-0.5">Something went wrong</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Itinerary */}
        {itinerary && !loading && (
          <div>
            {/* Save status banner */}
            <SaveBanner status={saveStatus} errorMsg={saveError} />

            <div className="flex items-center gap-3 mt-6 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
              <h2 className="font-display text-2xl font-bold text-stone-800 text-center px-2">
                Your {itinerary.days.length}-Day {destination} Adventure 🌍
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
            </div>

            <div className="space-y-5">
              {itinerary.days.map((plan) => (
                <DayCard key={plan.day} plan={plan} />
              ))}
            </div>

            {/* Re-plan nudge */}
            <div className="mt-8 text-center">
              <button
                onClick={() => { setItinerary(null); setSaveStatus('idle'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-sm text-orange-500 hover:text-orange-700 font-medium underline underline-offset-4 transition-colors"
              >
                ← Plan another trip
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
