export const orbitColors = {
  primary: "#7548F8",
  lavender: "#A78BFA",
  midnight: "#171324",
  cloud: "#F5F3FF",
} as const;

export const colors = {
  bg: {
    app:      orbitColors.midnight,
    card:     '#1a1d2e',
    elevated: '#252840',
    input:    '#1e2035',
  },
  border: {
    default: '#2a2d45',
    subtle:  '#1e2030',
  },
  primary: orbitColors.primary,
  income:  '#4ade80',
  expense: '#f87171',
  warning: '#fcd34d',
  text: {
    primary:  '#e8eaf0',
    secondary:'#c4c8e0',
    muted:    '#7c80a8',
    disabled: '#4b5280',
  },
} as const;

export type Colors = typeof colors;
