import React from "react";
import { Card as RadixCard } from "@radix-ui/themes";
import { useMediaQuery, useTheme } from "@mui/material";

export interface NixCardProps extends React.ComponentPropsWithoutRef<typeof RadixCard> {
  /** Desktop padding (default 24px), mobile uses 16px */
  padding?: "none" | "small" | "medium" | "large";
  /** Enable glassmorphism style */
  glass?: boolean;
  /** Enable hover lift effect */
  hover?: boolean;
}

const NixCard = React.forwardRef<HTMLDivElement, NixCardProps>(
  ({ padding = "medium", glass = true, hover = true, className = "", style, children, ...props }, ref) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const paddingValue =
      padding === "none"
        ? "0"
        : padding === "small"
          ? isMobile ? "12px" : "16px"
          : padding === "large"
            ? isMobile ? "20px" : "32px"
            : isMobile
              ? "16px"
              : "24px";

    return (
      <RadixCard
        ref={ref}
        variant="surface"
        size="3"
        className={`nix-card ${glass ? "nix-glass-panel" : ""} ${hover ? "nix-card--hover" : ""} ${className}`.trim()}
        style={{
          padding: paddingValue,
          borderRadius: "20px",
          transition: "all 0.2s ease-in-out",
          ...style,
        }}
        {...props}
      >
        {children}
      </RadixCard>
    );
  }
);

NixCard.displayName = "NixCard";

export default NixCard;
