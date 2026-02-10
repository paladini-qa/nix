import React from "react";
import * as TextField from "@radix-ui/themes";

export interface NixInputProps extends TextField.RootProps {}

const NixInput = React.forwardRef<HTMLInputElement, NixInputProps>(
  ({ size = "2", variant = "surface", radius = "large", className = "", ...props }, ref) => {
    return (
      <TextField.Root
        ref={ref}
        size={size}
        variant={variant}
        radius={radius}
        className={`nix-input ${className}`.trim()}
        style={{
          borderRadius: "20px",
        }}
        {...props}
      />
    );
  }
);

NixInput.displayName = "NixInput";

export { TextField };
export default NixInput;
