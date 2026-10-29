// Shared DayCard — supports both old format (morning/afternoon/evening strings)
// and new format (activities array with rich place data).

// ── Types ──────────────────────────────────────────────────────────────────

export interface Activity {
  time: 'morning' | 'afternoon' | 'evening';
  title: string;
  description: string;
  place_name: string;
  area: string;
  approx_lat: number;
  approx_lng: number;
}

/** New rich format */
export interface DayPlanNew {
  day: number;
  activities: Activity[];
}

/** Old flat format (backward compat) */
export interface DayPlanOld {
  day: number;
  morning: string;
  afternoon: string;
  evening: string;
}

export type DayPlan = DayPlanNew | DayPlanOld;

export function isNewFormat(day: DayPlan): day is DayPlanNew {
  return 'activities' in day && Array.isArray((day as DayPlanNew).activities);
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function mapsUrlFromQuery(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function MapsButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 hover:border-teal-400 transition-all duration-150"
    >
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
      Open in Google Maps
    </a>
  );
}

// ── Time slot config ───────────────────────────────────────────────────────

const timeConfig = {
  morning:   { icon: '🌅', label: 'Morning',   bg: 'from-amber-50 to-orange-50',  border: 'border-amber-100'  },
  afternoon: { icon: '☀️', label: 'Afternoon', bg: 'from-sky-50 to-teal-50',      border: 'border-sky-100'    },
  evening:   { icon: '🌙', label: 'Evening',   bg: 'from-violet-50 to-indigo-50', border: 'border-violet-100' },
} as const;

const timeSlotOrder: (keyof typeof timeConfig)[] = ['morning', 'afternoon', 'evening'];

// ── New-format activity row ────────────────────────────────────────────────

function ActivityRow({ activity, destination }: { activity: Activity; destination?: string }) {
  const cfg = timeConfig[activity.time];
  const query = destination ? `${activity.place_name}, ${destination}` : `${activity.place_name}${activity.area ? `, ${activity.area}` : ''}`;
  const mapsHref = mapsUrlFromQuery(query);

  return (
    <div className={`bg-gradient-to-r ${cfg.bg} px-6 py-4 border-l-4 ${cfg.border}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{cfg.icon}</span>
        <span className="text-xs font-bold uppercase tracking-widest text-stone-400">{cfg.label}</span>
      </div>
      <p className="font-semibold text-stone-800 text-sm mb-0.5">{activity.title}</p>
      <p className="text-sm text-stone-600 leading-relaxed mb-2">{activity.description}</p>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="text-xs text-stone-600 flex items-center gap-1.5">
          <span>📍</span>
          <span className="font-semibold text-stone-700">{activity.place_name}</span>
          {activity.area && <span className="text-stone-400">· {activity.area}</span>}
        </span>
        <MapsButton href={mapsHref} />
      </div>
    </div>
  );
}

// ── Old-format slot row ────────────────────────────────────────────────────

function OldSlotRow({ time, text }: { time: keyof typeof timeConfig; text: string }) {
  const cfg = timeConfig[time];
  return (
    <div className={`bg-gradient-to-r ${cfg.bg} px-6 py-4 border-l-4 ${cfg.border}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{cfg.icon}</span>
        <span className="text-xs font-bold uppercase tracking-widest text-stone-400">{cfg.label}</span>
      </div>
      <p className="text-sm text-stone-700 leading-relaxed">{text}</p>
    </div>
  );
}

// ── DayCard ────────────────────────────────────────────────────────────────

export function DayCard({ plan, destination }: { plan: DayPlan; destination?: string }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-md shadow-orange-100/60 border border-orange-100 bg-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-200/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white text-sm font-bold">
          {plan.day}
        </span>
        <h3 className="font-display text-white font-bold text-lg tracking-wide">Day {plan.day}</h3>
      </div>

      {/* Slots */}
      <div className="divide-y divide-stone-100">
        {isNewFormat(plan)
          ? timeSlotOrder.map((t) => {
              const act = plan.activities.find((a) => a.time === t);
              return act ? <ActivityRow key={t} activity={act} destination={destination} /> : null;
            })
          : timeSlotOrder.map((t) => (
              <OldSlotRow key={t} time={t} text={(plan as DayPlanOld)[t]} />
            ))
        }
      </div>
    </div>
  );
}
