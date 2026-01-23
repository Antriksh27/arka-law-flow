// Unified mobile design system constants
// Used across all mobile dialogs, sheets, and menus

export const PASTEL_COLORS = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-200', activeBg: 'bg-emerald-100' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-500', border: 'border-sky-200', activeBg: 'bg-sky-100' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-500', border: 'border-violet-200', activeBg: 'bg-violet-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-200', activeBg: 'bg-amber-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-500', border: 'border-rose-200', activeBg: 'bg-rose-100' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', activeBg: 'bg-slate-200' },
} as const;

export const AVATAR_COLORS = [
  { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { bg: 'bg-sky-100', text: 'text-sky-600' },
  { bg: 'bg-violet-100', text: 'text-violet-600' },
  { bg: 'bg-amber-100', text: 'text-amber-600' },
  { bg: 'bg-rose-100', text: 'text-rose-600' },
];

export const NOTE_COLORS = {
  yellow: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  blue: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  red: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  gray: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
} as const;

export const STATUS_COLORS = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  lead: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  inactive: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  disposed: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
} as const;

export const CARD_STYLES = {
  base: 'bg-white rounded-2xl shadow-sm',
  withBorder: 'bg-white rounded-2xl shadow-sm border border-slate-100',
  interactive: 'bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all',
};

export const BUTTON_STYLES = {
  primary: 'bg-slate-800 hover:bg-slate-700 text-white rounded-full',
  secondary: 'bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 rounded-full',
};

export const FILTER_CHIP_STYLES = {
  active: 'bg-slate-800 text-white border-transparent',
  inactive: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
};

export const SHEET_STYLES = {
  container: 'bg-slate-50',
  card: 'bg-white rounded-2xl shadow-sm overflow-hidden',
  header: 'text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3',
  actionBar: 'fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100',
};

// Helper function to get avatar color based on name
export const getAvatarColor = (name: string) => {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

// Helper function to get initials from name
export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};
