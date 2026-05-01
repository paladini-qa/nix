import React from "react";
import { Button as RadixButton } from "@radix-ui/themes";

/** Tamanhos canônicos: sm (32px), md (40px), lg (48px) — também aceita aliases legados */
export type NixButtonSize = "sm" | "md" | "lg" | "fab" | "small" | "medium" | "large";
export type NixButtonVariant = "solid" | "soft" | "ghost" | "outline" | "surface";

const SIZE_MAP: Record<NixButtonSize, "1" | "2" | "3" | "4"> = {
  sm: "1",
  md: "2",
  lg: "3",
  fab: "4",
  // aliases legados para retrocompatibilidade
  small: "1",
  medium: "2",
  large: "3",
};

/** Normaliza aliases para o nome canônico da classe CSS */
const SIZE_CLASS_MAP: Record<NixButtonSize, string> = {
  sm: "sm",
  md: "md",
  lg: "lg",
  fab: "fab",
  small: "sm",
  medium: "md",
  large: "lg",
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
  /** Estado de carregamento — desabilita o botão e exibe cursor wait */
  loading?: boolean;
}

const NixButton = React.forwardRef<HTMLButtonElement, NixButtonProps>(
  (
    {
      size = "md",
      variant = "solid",
      color = "purple",
      className = "",
      style,
      loading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClass = SIZE_CLASS_MAP[size];

    return (
      <RadixButton
        ref={ref}
        size={SIZE_MAP[size]}
        variant={VARIANT_MAP[variant]}
        color={color}
        disabled={disabled || loading}
        className={`nix-control nix-button nix-button--${sizeClass} ${className}`.trim()}
        style={{
          transition: "all 0.2s ease-in-out",
          touchAction: "manipulation",
          cursor: loading ? "wait" : undefined,
          ...style,
        }}
        {...props}
      />
    );
  }
);

NixButton.displayName = "NixButton";

export default NixButton;
