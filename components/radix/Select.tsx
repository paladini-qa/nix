import React from "react";
import { Select as SelectRadix } from "@radix-ui/themes";

export const SelectRoot = SelectRadix.Root;
export const SelectTrigger = SelectRadix.Trigger;
export const SelectContent = SelectRadix.Content;
export const SelectItem = SelectRadix.Item;
export const SelectGroup = SelectRadix.Group;
export const SelectLabel = SelectRadix.Label;
export const SelectSeparator = SelectRadix.Separator;

export interface NixSelectTriggerProps extends React.ComponentPropsWithoutRef<typeof SelectRadix.Trigger> {}

export const NixSelectTrigger = React.forwardRef<HTMLButtonElement, NixSelectTriggerProps>(
  ({ size = "2", variant = "surface", radius = "large", ...props }, ref) => {
    return (
      <SelectRadix.Trigger
        ref={ref}
        size={size}
        variant={variant}
        radius={radius}
        style={{ borderRadius: "20px" }}
        {...props}
      />
    );
  }
);

NixSelectTrigger.displayName = "NixSelectTrigger";

export interface NixSelectContentProps extends React.ComponentPropsWithoutRef<typeof SelectRadix.Content> {}

export const NixSelectContent = React.forwardRef<HTMLDivElement, NixSelectContentProps>(
  (props, ref) => {
    return (
      <SelectRadix.Content
        ref={ref}
        position="popper"
        style={{ borderRadius: "20px" }}
        {...props}
      />
    );
  }
);

NixSelectContent.displayName = "NixSelectContent";
