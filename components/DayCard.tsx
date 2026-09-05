// Shared DayCard component used on both /plan and /trips pages

export interface DayPlan {
  day: number;
  morning: string;
  afternoon: string;
  evening: string;
}

const timeSlots = [
  { key: 'morning'   as const, icon: '🌅', label: 'Morning',   bg: 'from-amber-50 to-orange-50',  border: 'border-amber-100'  },
  { key: 'afternoon' as const, icon: '☀️', label: 'Afternoon', bg: 'from-sky-50 to-teal-50',      border: 'border-sky-100'    },
  { key: 'evening'   as const, icon: '🌙', label: 'Evening',   bg: 'from-violet-50 to-indigo-50', border: 'border-violet-100' },
];

export function DayCard({ plan }: { plan: DayPlan }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-md shadow-orange-100/60 border border-orange-100 bg-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-200/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white text-sm font-bold">
          {plan.day}
        </span>
        <h3 className="font-display text-white font-bold text-lg tracking-wide">Day {plan.day}</h3>
      </div>
      {/* Time slots */}
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
