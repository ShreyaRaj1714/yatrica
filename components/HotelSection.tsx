import { mapsUrlFromQuery } from './DayCard';

// ── Types ──────────────────────────────────────────────────────────────────

export interface Hotel {
  name: string;
  area: string;
  price_per_night_inr: number;
  why_recommended: string;
  approx_lat?: number;
  approx_lng?: number;
}

export interface HotelsData {
  budget?: Hotel;
  mid_range?: Hotel;
  premium?: Hotel;
}

// ── Config ─────────────────────────────────────────────────────────────────

const tiers = [
  { key: 'budget'    as const, label: 'Budget',    emoji: '🏠', border: 'border-emerald-200', bg: 'from-emerald-50 to-teal-50',   badge: 'bg-emerald-100 text-emerald-700'  },
  { key: 'mid_range' as const, label: 'Mid-Range', emoji: '🏨', border: 'border-sky-200',     bg: 'from-sky-50 to-indigo-50',     badge: 'bg-sky-100 text-sky-700'          },
  { key: 'premium'   as const, label: 'Premium',   emoji: '🏰', border: 'border-amber-200',   bg: 'from-amber-50 to-orange-50',   badge: 'bg-amber-100 text-amber-700'      },
] as const;

// ── Hotel card ─────────────────────────────────────────────────────────────

function HotelCard({ hotel, tier, destination }: { hotel: Hotel; tier: typeof tiers[number]; destination?: string }) {
  const query = destination ? `${hotel.name}, ${destination}` : `${hotel.name}, ${hotel.area}`;
  const mapsHref = mapsUrlFromQuery(query);

  return (
    <div className={`rounded-xl border-2 ${tier.border} bg-gradient-to-br ${tier.bg} p-5 flex flex-col gap-3 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
      {/* Tier badge + emoji */}
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wide ${tier.badge}`}>
          {tier.emoji} {tier.label}
        </span>
        <span className="text-sm font-bold text-stone-700">
          ₹{hotel.price_per_night_inr.toLocaleString('en-IN')}
          <span className="text-xs font-normal text-stone-400">/night</span>
        </span>
      </div>

      {/* Name + area */}
      <div>
        <p className="font-display font-bold text-stone-800 text-base leading-snug">{hotel.name}</p>
        <p className="text-xs text-stone-500 mt-0.5">📍 {hotel.area}</p>
      </div>

      {/* Why recommended */}
      <p className="text-xs text-stone-600 leading-relaxed">{hotel.why_recommended}</p>

      {/* Maps link */}
      <a
        href={mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200 px-3 py-1 text-xs font-semibold text-teal-700 hover:border-teal-300 hover:bg-teal-50 transition-all duration-150"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        Open in Google Maps
      </a>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────

export function HotelSection({
  hotels,
  destination,
  hotelBudgetPerNight,
}: {
  hotels: HotelsData;
  destination?: string;
  hotelBudgetPerNight?: number;
}) {
  const availableTiers = tiers.filter((tier) => Boolean(hotels[tier.key]));
  if (availableTiers.length === 0) return null;

  return (
    <div className="mt-8">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
        <h2 className="font-display text-xl font-bold text-stone-800 px-2 whitespace-nowrap">
          🛏️ Where to Stay
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-200 to-transparent" />
      </div>

      {typeof hotelBudgetPerNight === 'number' && (
        <p className="text-center text-xs text-stone-500 mb-5">
          Stays within ₹{hotelBudgetPerNight.toLocaleString('en-IN')} per night
        </p>
      )}

      {/* Hotel cards */}
      <div className={`grid grid-cols-1 ${availableTiers.length === 1 ? 'max-w-md mx-auto' : availableTiers.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4 ${typeof hotelBudgetPerNight !== 'number' ? 'mt-5' : ''}`}>
        {availableTiers.map((tier) => (
          <HotelCard key={tier.key} hotel={hotels[tier.key]!} tier={tier} destination={destination} />
        ))}
      </div>
    </div>
  );
}
