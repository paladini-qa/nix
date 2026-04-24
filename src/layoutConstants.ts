/**
 * Layout constants – Padrões de responsividade web e mobile
 *
 * Regra: web = mais espaço e componentes maiores; mobile = mais compacto, touch targets mínimos.
 *
 * Uso:
 * - Importar constantes em sx: sx={{ p: CONTENT_PADDING, gap: SECTION_GAP }}
 * - Ou usar useLayoutSpacing() para obter valores numéricos do breakpoint atual
 */

// Breakpoints (espelhando theme.ts para uso em objetos responsivos)
export const BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 1024,
  lg: 1200,
  xl: 1536,
} as const;

// Padding do conteúdo principal (unidades theme.spacing, 8px cada)
export const CONTENT_PADDING = {
  xs: 1.25,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 4,
} as const;

// Padding horizontal do conteúdo — reduzido em relação ao CONTENT_PADDING para evitar excessos laterais
export const CONTENT_PADDING_X = {
  xs: 1.25,
  sm: 2,
  md: 2.5,
  lg: 3,
  xl: 3.5,
} as const;

// Gap entre blocos na página
export const SECTION_GAP = {
  xs: 2,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 4,
} as const;

// Grid container spacing
export const GRID_SPACING = {
  xs: 1,
  sm: 1.5,
  md: 2,
  lg: 2.5,
  xl: 3,
} as const;

// Stack / Card gap
export const STACK_GAP = {
  xs: 1.5,
  sm: 1.5,
  md: 2,
  lg: 2.5,
  xl: 2.5,
} as const;

// Ícone em card/lista (px)
export const ICON_SIZE = {
  xs: 32,
  sm: 36,
  md: 40,
  lg: 48,
  xl: 52,
} as const;

// Card min-height (px)
export const CARD_MIN_HEIGHT = {
  xs: 100,
  sm: 110,
  md: 130,
  lg: 140,
  xl: 140,
} as const;

// Touch target mínimo para mobile (px)
export const TOUCH_TARGET_MIN = 44;

// Larguras fixas
export const SIDEBAR_WIDTH = 280;
export const MOBILE_DRAWER_WIDTH = 300;
export const SIDE_PANEL_WIDTH = 520;
export const SIDE_PANEL_WIDTH_MOBILE = "100vw";

// Largura máxima do conteúdo (opcional, px)
export const CONTENT_MAX_WIDTH = 1400;
