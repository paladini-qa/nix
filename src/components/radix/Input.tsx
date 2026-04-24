import React from "react";
import { Text } from "@radix-ui/themes";
import * as TextField from "@radix-ui/themes";

export interface NixInputProps extends TextField.RootProps {
  /** Ícone ou elemento exibido à esquerda do input */
  startAdornment?: React.ReactNode;
  /** Ícone ou elemento exibido à direita do input */
  endAdornment?: React.ReactNode;
  /** Mensagem de erro exibida abaixo do input, destaca a borda em vermelho */
  errorMessage?: string;
}

const NixInput = React.forwardRef<HTMLInputElement, NixInputProps>(
  ({
    size = "2",
    variant = "surface",
    radius = "large",
    className = "",
    startAdornment,
    endAdornment,
    errorMessage,
    children,
    ...props
  }, ref) => {
    const inputEl = (
      <TextField.Root
        ref={ref as React.Ref<HTMLDivElement>}
        size={size}
        variant={variant}
        radius={radius}
        className={`nix-control nix-input${errorMessage ? " nix-input--error" : ""} ${className}`.trim()}
        style={{ borderRadius: "var(--radius-input, 20px)" }}
        {...props}
      >
        {startAdornment && (
          <TextField.Slot side="left" style={{ paddingLeft: 4, color: "var(--nix-text-secondary)" }}>
            {startAdornment}
          </TextField.Slot>
        )}
        {children}
        {endAdornment && (
          <TextField.Slot side="right" style={{ paddingRight: 4, color: "var(--nix-text-secondary)" }}>
            {endAdornment}
          </TextField.Slot>
        )}
      </TextField.Root>
    );

    if (!errorMessage) return inputEl;

    return (
      <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {inputEl}
        <Text
          as="span"
          size="1"
          color="red"
          style={{ paddingLeft: 12, lineHeight: 1.4, display: "block" }}
        >
          {errorMessage}
        </Text>
      </span>
    );
  }
);

NixInput.displayName = "NixInput";

export { TextField };
export default NixInput;
