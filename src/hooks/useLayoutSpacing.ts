import { useTheme, useMediaQuery } from "@mui/material";
import {
  CONTENT_PADDING,
  SECTION_GAP,
  GRID_SPACING,
  STACK_GAP,
  ICON_SIZE,
  CARD_MIN_HEIGHT,
  SIDEBAR_WIDTH,
  MOBILE_DRAWER_WIDTH,
  SIDE_PANEL_WIDTH,
  SIDE_PANEL_WIDTH_MOBILE,
  TOUCH_TARGET_MIN,
  CONTENT_MAX_WIDTH,
} from "../layoutConstants";

type BreakpointKey = keyof typeof CONTENT_PADDING;

/**
 * Retorna o índice do breakpoint atual (0 = xs, 1 = sm, ...)
 */
function useBreakpointIndex(): number {
  const theme = useTheme();
  const xs = useMediaQuery(theme.breakpoints.up("xs"));
  const sm = useMediaQuery(theme.breakpoints.up("sm"));
  const md = useMediaQuery(theme.breakpoints.up("md"));
  const lg = useMediaQuery(theme.breakpoints.up("lg"));
  const xl = useMediaQuery(theme.breakpoints.up("xl"));

  if (xl) return 4;
  if (lg) return 3;
  if (md) return 2;
  if (sm) return 1;
  return 0;
}

const KEYS: BreakpointKey[] = ["xs", "sm", "md", "lg", "xl"];

function getValueAt<T extends Record<BreakpointKey, number>>(
  obj: T,
  index: number
): T[BreakpointKey] {
  const key = KEYS[Math.min(index, KEYS.length - 1)];
  return obj[key];
}

export interface LayoutSpacing {
  contentPadding: number;
  sectionGap: number;
  gridSpacing: number;
  stackGap: number;
  iconSize: number;
  cardMinHeight: number;
  touchTargetMin: number;
  sidebarWidth: number;
  mobileDrawerWidth: number;
  sidePanelWidth: number | string;
  contentMaxWidth: number;
  isMobile: boolean;
}

/**
 * Hook que retorna os valores numéricos de layout para o breakpoint atual.
 * Use quando preferir um único número em vez de objeto responsivo no sx.
 */
export function useLayoutSpacing(): LayoutSpacing {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const index = useBreakpointIndex();

  return {
    contentPadding: getValueAt(CONTENT_PADDING, index),
    sectionGap: getValueAt(SECTION_GAP, index),
    gridSpacing: getValueAt(GRID_SPACING, index),
    stackGap: getValueAt(STACK_GAP, index),
    iconSize: getValueAt(ICON_SIZE, index),
    cardMinHeight: getValueAt(CARD_MIN_HEIGHT, index),
    touchTargetMin: TOUCH_TARGET_MIN,
    sidebarWidth: SIDEBAR_WIDTH,
    mobileDrawerWidth: MOBILE_DRAWER_WIDTH,
    sidePanelWidth: isMobile ? (SIDE_PANEL_WIDTH_MOBILE as string) : SIDE_PANEL_WIDTH,
    contentMaxWidth: CONTENT_MAX_WIDTH,
    isMobile,
  };
}
