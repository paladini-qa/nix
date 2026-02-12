import React from "react";
import { Button as RadixButton } from "@radix-ui/themes";

export type NixButtonSize = "small" | "medium" | "large" | "fab";
export type NixButtonVariant = "solid" | "soft" | "ghost" | "outline" | "surface";

const SIZE_MAP: Record<NixButtonSize, "1" | "2" | "3" | "4"> = {
  small: "1",
  medium: "2",
  large: "3",
  fab: "4",
};

const VARIANT_MAP: Record<NixButtonVariant, "solid" | "soft" | "ghost" | "outline" | "surface" | "classic"> = {
  solid: "solid",
  soft: "soft",
  ghost: "ghost",
  outline: "outline",
  surface: "surface",
};

export interface NixButtonProps
  extends Omit<React.ComponentPropsWithoutRef<typeof RadixButton>, "size" | "variant"> {
  size?: NixButtonSize;
  variant?: NixButtonVariant;
  color?: "purple" | "gray" | "red" | "green" | "cyan";
}

const NixButton = React.forwardRef<HTMLButtonElement, NixButtonProps>(
  ({ size = "medium", variant = "solid", color = "purple", className = "", style, ...props }, ref) => {
    return (
      <RadixButton
        ref={ref}
        size={SIZE_MAP[size]}
        variant={VARIANT_MAP[variant]}
        color={color}
        className={`nix-control nix-button nix-button--${size} ${className}`.trim()}
        style={{
          transition: "all 0.2s ease-in-out",
          ...style,
        }}
        {...props}
      />
    );
  }
);

NixButton.displayName = "NixButton";

export default NixButton;
