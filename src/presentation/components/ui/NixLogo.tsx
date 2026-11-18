import { useTheme } from "@mui/material";

interface NixLogoProps {
  size: number;
  decorative?: boolean;
}

export default function NixLogo({ size, decorative = false }: NixLogoProps) {
  const dark = useTheme().palette.mode === "dark";
  const variant = dark ? "gradient" : "purple";

  return (
    <img
      src={`${import.meta.env.BASE_URL}brand/nix-orbit-${variant}.svg`}
      alt={decorative ? "" : "Nix"}
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0 }}
    />
  );
}
