import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Popover,
  IconButton,
  Button,
  Slider,
} from "@mui/material";
import { Check as CheckIcon } from "@mui/icons-material";
import { ColorConfig } from "../types";

interface ColorPickerProps {
  value: ColorConfig;
  onChange: (color: ColorConfig) => void;
  label?: string;
  size?: "small" | "medium";
}

// Converte HSL para Hex
const hslToHex = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Converte Hex para HSL
const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 50, l: 50 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  size = "medium",
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [activeColor, setActiveColor] = useState<"primary" | "secondary">("primary");
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(70);
  const [lightness, setLightness] = useState(50);
  const wheelRef = useRef<HTMLCanvasElement>(null);

  const isSmall = size === "small";
  const wheelSize = isSmall ? 150 : 180;

  useEffect(() => {
    const currentColor = activeColor === "primary" ? value.primary : value.secondary;
    const hsl = hexToHsl(currentColor);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
  }, [activeColor, value]);

  // Desenha o círculo de cores
  useEffect(() => {
    const canvas = wheelRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = wheelSize / 2;
    const centerY = wheelSize / 2;
    const outerRadius = wheelSize / 2 - 5;
    const innerRadius = outerRadius - 25;

    // Limpa o canvas
    ctx.clearRect(0, 0, wheelSize, wheelSize);

    // Desenha o anel de cores
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = ((angle - 1) * Math.PI) / 180;
      const endAngle = ((angle + 1) * Math.PI) / 180;

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = hslToHex(angle, saturation, lightness);
      ctx.fill();
    }

    // Desenha o indicador de posição atual
    const indicatorAngle = ((hue - 90) * Math.PI) / 180;
    const indicatorRadius = (outerRadius + innerRadius) / 2;
    const indicatorX = centerX + indicatorRadius * Math.cos(indicatorAngle);
    const indicatorY = centerY + indicatorRadius * Math.sin(indicatorAngle);

    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 8, 0, 2 * Math.PI);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = hslToHex(hue, saturation, lightness);
    ctx.fill();
  }, [hue, saturation, lightness, wheelSize]);

  const handleWheelClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = wheelRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - wheelSize / 2;
    const y = e.clientY - rect.top - wheelSize / 2;

    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    setHue(Math.round(angle));
    updateColor(Math.round(angle), saturation, lightness);
  };

  const updateColor = (h: number, s: number, l: number) => {
    const newHex = hslToHex(h, s, l);
    if (activeColor === "primary") {
      onChange({ ...value, primary: newHex });
    } else {
      onChange({ ...value, secondary: newHex });
    }
  };

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      {/* Preview Button */}
      <Box
        onClick={handleOpen}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
          p: 0.5,
          borderRadius: 1,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Box
          sx={{
            width: isSmall ? 28 : 36,
            height: isSmall ? 28 : 36,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${value.primary} 0%, ${value.secondary} 100%)`,
            border: 2,
            borderColor: "divider",
            boxShadow: 1,
          }}
        />
        {label && (
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        )}
      </Box>

      {/* Color Picker Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Paper sx={{ p: 2, width: isSmall ? 200 : 240 }}>
          {/* Color selector tabs */}
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Button
              size="small"
              variant={activeColor === "primary" ? "contained" : "outlined"}
              onClick={() => setActiveColor("primary")}
              sx={{
                flex: 1,
                minWidth: 0,
                bgcolor: activeColor === "primary" ? value.primary : "transparent",
                borderColor: value.primary,
                color: activeColor === "primary" ? "#fff" : value.primary,
                "&:hover": {
                  bgcolor: activeColor === "primary" ? value.primary : `${value.primary}20`,
                },
              }}
            >
              Primary
            </Button>
            <Button
              size="small"
              variant={activeColor === "secondary" ? "contained" : "outlined"}
              onClick={() => setActiveColor("secondary")}
              sx={{
                flex: 1,
                minWidth: 0,
                bgcolor: activeColor === "secondary" ? value.secondary : "transparent",
                borderColor: value.secondary,
                color: activeColor === "secondary" ? "#fff" : value.secondary,
                "&:hover": {
                  bgcolor: activeColor === "secondary" ? value.secondary : `${value.secondary}20`,
                },
              }}
            >
              Secondary
            </Button>
          </Box>

          {/* Color Wheel */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <canvas
              ref={wheelRef}
              width={wheelSize}
              height={wheelSize}
              onClick={handleWheelClick}
              style={{ cursor: "crosshair" }}
            />
          </Box>

          {/* Saturation Slider */}
          <Box sx={{ px: 1, mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Saturation
            </Typography>
            <Slider
              size="small"
              value={saturation}
              min={0}
              max={100}
              onChange={(_, val) => {
                setSaturation(val as number);
                updateColor(hue, val as number, lightness);
              }}
              sx={{
                color: hslToHex(hue, saturation, lightness),
                "& .MuiSlider-track": {
                  background: `linear-gradient(to right, ${hslToHex(hue, 0, lightness)}, ${hslToHex(hue, 100, lightness)})`,
                },
              }}
            />
          </Box>

          {/* Lightness Slider */}
          <Box sx={{ px: 1, mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Lightness
            </Typography>
            <Slider
              size="small"
              value={lightness}
              min={10}
              max={90}
              onChange={(_, val) => {
                setLightness(val as number);
                updateColor(hue, saturation, val as number);
              }}
              sx={{
                color: hslToHex(hue, saturation, lightness),
                "& .MuiSlider-track": {
                  background: `linear-gradient(to right, ${hslToHex(hue, saturation, 10)}, ${hslToHex(hue, saturation, 50)}, ${hslToHex(hue, saturation, 90)})`,
                },
              }}
            />
          </Box>

          {/* Preview */}
          <Box
            sx={{
              height: 40,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${value.primary} 0%, ${value.secondary} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600, textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
              Preview
            </Typography>
          </Box>
        </Paper>
      </Popover>
    </>
  );
};

export default ColorPicker;

