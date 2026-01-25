// Centralized color constants for consistent styling across all components
// Uses slate palette as the primary neutral color system

export const COLORS = {
  // Background colors
  bg: {
    page: 'bg-slate-50',           // Main page backgrounds
    card: 'bg-white',              // Card backgrounds
    muted: 'bg-slate-100',         // Muted/subtle backgrounds
    input: 'bg-slate-50',          // Input field backgrounds
    hover: 'hover:bg-slate-50',    // Hover state backgrounds
    active: 'bg-slate-100',        // Active/selected state backgrounds
  },

  // Border colors
  border: {
    default: 'border-slate-200',   // Default borders
    light: 'border-slate-100',     // Subtle borders
    focus: 'focus:border-slate-300', // Focus state borders
    divider: 'border-slate-200',   // Divider lines
  },

  // Text colors
  text: {
    primary: 'text-slate-900',     // Primary text
    secondary: 'text-slate-700',   // Secondary text
    muted: 'text-slate-500',       // Muted/helper text
    light: 'text-slate-400',       // Very light text (placeholders)
    white: 'text-white',           // White text (on dark backgrounds)
  },

  // Ring/outline colors
  ring: {
    focus: 'focus:ring-slate-200',
    focusVisible: 'focus-visible:ring-slate-200',
  },

  // Common component patterns
  patterns: {
    // Card styling
    card: 'bg-white rounded-2xl shadow-sm border border-slate-100',
    cardInteractive: 'bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow',
    
    // Input styling
    input: 'bg-slate-50 border-slate-200 rounded-xl focus:border-slate-300 focus:ring-slate-200',
    
    // Button styling (secondary/ghost)
    buttonSecondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
    buttonGhost: 'text-slate-600 hover:bg-slate-100',
    
    // Badge/chip styling
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    badgeMuted: 'bg-slate-50 text-slate-500 border-slate-100',
    
    // List item styling
    listItem: 'hover:bg-slate-50 border-b border-slate-100',
    listItemActive: 'bg-slate-100 border-b border-slate-100',
    
    // Section header
    sectionHeader: 'text-xs font-semibold text-slate-400 uppercase tracking-wider',
    
    // Divider
    divider: 'border-t border-slate-200',
  },

  // Status colors (using slate for default/neutral states)
  status: {
    default: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dot: 'bg-slate-500',
    },
    muted: {
      bg: 'bg-slate-50',
      text: 'text-slate-500',
      border: 'border-slate-100',
      dot: 'bg-slate-400',
    },
  },

  // Avatar colors (for consistency with existing AVATAR_COLORS)
  avatar: {
    slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
  },

  // Skeleton/loading states
  skeleton: {
    base: 'bg-slate-200',
    shimmer: 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200',
  },
} as const;

// Helper function to combine multiple color classes
export const cn = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Export individual sections for easier imports
export const { bg, border, text, ring, patterns, status, skeleton } = COLORS;
