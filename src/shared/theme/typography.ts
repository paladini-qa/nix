export const typography = {
  sizes: {
    xs:   10,
    sm:   11,
    base: 13,
    md:   15,
    lg:   17,
    xl:   20,
    xxl:  24,
    hero: 28,
  },
  weights: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
  },
} as const;

export type Typography = typeof typography;
