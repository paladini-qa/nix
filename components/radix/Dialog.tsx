import React from "react";
import { Dialog as DialogNamespace, Flex } from "@radix-ui/themes";
import { useMediaQuery, useTheme } from "@mui/material";

export const Dialog = DialogNamespace.Root;
export const DialogTrigger = DialogNamespace.Trigger;
export const DialogTitle = DialogNamespace.Title;
export const DialogDescription = DialogNamespace.Description;
export const DialogClose = DialogNamespace.Close;

export interface NixDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogNamespace.Content> {
  /** Force fullscreen on mobile (default true) */
  fullScreenMobile?: boolean;
}

export const NixDialogContent = React.forwardRef<HTMLDivElement, NixDialogContentProps>(
  ({ fullScreenMobile = true, children, style, ...props }, ref) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    return (
      <DialogNamespace.Content
        ref={ref}
        size="4"
        style={{
          borderRadius: fullScreenMobile && isMobile ? 0 : "20px",
          maxHeight: fullScreenMobile && isMobile ? "100vh" : "90vh",
          padding: "24px",
          backdropFilter: "blur(8px)",
          ...style,
        }}
        {...props}
      >
        {children}
      </DialogNamespace.Content>
    );
  }
);

NixDialogContent.displayName = "NixDialogContent";

export interface NixDialogActionsProps {
  children: React.ReactNode;
  gap?: "1" | "2" | "3";
  className?: string;
}

export function NixDialogActions({ children, gap = "2", className = "" }: NixDialogActionsProps) {
  return (
    <Flex gap={gap} justify="end" mt="4" className={className}>
      {children}
    </Flex>
  );
}
