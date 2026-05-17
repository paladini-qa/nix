export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
} as const;

export const radius = {
  sm:   8,
  md:   10,
  lg:   14,
  xl:   16,
  full: 999,
} as const;

export type Spacing = typeof spacing;
export type Radius  = typeof radius;
