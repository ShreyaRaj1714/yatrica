'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { DayCard, type DayPlan } from '@/components/DayCard';
import { HotelSection, type HotelsData } from '@/components/HotelSection';

// --- Types ---

interface ItineraryJson {
  days: DayPlan[];
  hotels?: HotelsData;        // only present on new-format trips
}

interface Trip {
  id: string;
  created_at: string;
  destination: string;
  days: number;
  budget: number;
  interests: string[];
  itinerary_json: ItineraryJson;
}

// --- Trip card with expandable itinerary ---

function TripCard({ trip }: { trip: Trip }) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(trip.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const hasDays   = Array.isArray(trip.itinerary_json?.days) && trip.itinerary_json.days.length > 0;
  const hasHotels = !!trip.itinerary_json?.hotels;

  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-md shadow-orange-100/40 overflow-hidden transition-all duration-300">

      {/* Card header */}
      <div className="bg-gradient-to-r from-orange-500 via-rose-500 to-teal-500 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-white leading-tight">
              {trip.destination}
            </h2>
            <p className="text-white/70 text-xs mt-1">Saved on {date}</p>
          </div>
          <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {trip.days} {trip.days === 1 ? 'day' : 'days'}
          </span>
        </div>
      </div>

      {/* Trip meta */}
      <div className="px-6 py-4 flex flex-wrap gap-4 border-b border-stone-100">
        <div className="flex items-center gap-1.5 text-sm text-stone-600">
          <span>💰</span>
          <span className="font-medium">₹{trip.budget.toLocaleString('en-IN')}</span>
          <span className="text-stone-400 text-xs">budget</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-stone-600">
          <span>📅</span>
          <span className="font-medium">{trip.days} {trip.days === 1 ? 'day' : 'days'}</span>
        </div>
        {trip.interests?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {trip.interests.map((i) => (
              <span key={i} className="rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                {i}
              </span>
            ))}
          </div>
        )}
        {/* Format badge */}
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${hasHotels ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-stone-100 text-stone-500'}`}>
          {hasHotels ? '✨ Rich format' : 'Classic format'}
        </span>
      </div>

      {/* Toggle button */}
      <div className="px-6 py-4">
        {hasDays ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 hover:shadow-md hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            {expanded ? '▲ Hide Itinerary' : '▼ View Itinerary'}
          </button>
        ) : (
          <p className="text-sm text-stone-400 italic">No itinerary data available.</p>
        )}
      </div>

      {/* Expandable itinerary */}
      {expanded && hasDays && (
        <div className="px-6 pb-8 border-t border-stone-100 pt-5 space-y-5">
          <h3 className="font-display text-lg font-bold text-stone-800">
            {trip.days}-Day {trip.destination} Itinerary 🌍
          </h3>

          {/* Day cards — handles both old and new format */}
          <div className="space-y-4">
            {trip.itinerary_json.days.map((plan) => (
              <DayCard key={plan.day} plan={plan} destination={trip.destination} />
            ))}
          </div>

          {/* Hotels — only for new-format trips */}
          {hasHotels && (
            <HotelSection hotels={trip.itinerary_json.hotels!} destination={trip.destination} />
          )}
        </div>
      )}
    </div>
  );
}

// --- Loading skeleton ---

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-md animate-pulse overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-orange-300 to-rose-300" />
      <div className="px-6 py-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 bg-stone-200 rounded-full w-24" />
          <div className="h-5 bg-stone-100 rounded-full w-16" />
        </div>
        <div className="h-9 bg-orange-100 rounded-full w-36 mt-1" />
      </div>
    </div>
  );
}

// --- Main Page ---

export default function TripsPage() {
  const [trips, setTrips]     = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
      const { data, error: dbError } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) setError(dbError.message);
      else setTrips((data ?? []) as Trip[]);

      setLoading(false);
    };
    fetchTrips();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-teal-50">

      {/* Hero bar */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-orange-500 to-rose-500 px-6 py-10 text-center">
        <div className="absolute inset-0 bg-dot-pattern opacity-20 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="font-display text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">
            My Trips 🗺️
          </h1>
          <p className="text-white/80 text-base max-w-md mx-auto">
            All your AI-generated itineraries, saved in one place.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Loading */}
        {loading && (
          <div className="space-y-5">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 flex gap-3 items-start">
            <span className="text-xl mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold text-red-700 text-sm mb-0.5">Could not load trips</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && trips.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">✈️</p>
            <h2 className="font-display text-2xl font-bold text-stone-700 mb-2">No trips yet</h2>
            <p className="text-stone-500 text-sm mb-6">Plan your first adventure and it'll appear here.</p>
            <Link href="/plan" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-md hover:scale-105 transition-all duration-200">
              Plan My First Trip →
            </Link>
          </div>
        )}

        {/* Trip list */}
        {!loading && !error && trips.length > 0 && (
          <div className="space-y-6">
            <p className="text-stone-500 text-sm text-right">
              {trips.length} {trips.length === 1 ? 'trip' : 'trips'} saved
            </p>
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
