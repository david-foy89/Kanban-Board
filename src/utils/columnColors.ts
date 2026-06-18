const COLUMN_ACCENTS = [
  { bar: 'bg-sky-500', ring: 'ring-sky-500/30', text: 'text-sky-400' },
  { bar: 'bg-violet-500', ring: 'ring-violet-500/30', text: 'text-violet-400' },
  { bar: 'bg-amber-500', ring: 'ring-amber-500/30', text: 'text-amber-400' },
  { bar: 'bg-emerald-500', ring: 'ring-emerald-500/30', text: 'text-emerald-400' },
  { bar: 'bg-rose-500', ring: 'ring-rose-500/30', text: 'text-rose-400' },
  { bar: 'bg-cyan-500', ring: 'ring-cyan-500/30', text: 'text-cyan-400' },
] as const;

export function getColumnAccent(index: number) {
  return COLUMN_ACCENTS[index % COLUMN_ACCENTS.length];
}
