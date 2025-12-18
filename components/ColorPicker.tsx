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
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (val: number) =>
    Math.round((val + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
  const isUserInteracting = useRef(false);

  const isSmall = size === "small";
  const wheelSize = isSmall ? 150 : 180;
  const open = Boolean(anchorEl);

  // Função para desenhar o canvas com valores HSL específicos
  const drawColorWheel = React.useCallback((h: number, s: number, l: number) => {
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

      ctx.fillStyle = hslToHex(angle, s, l);
      ctx.fill();
    }

    // Desenha o indicador de posição atual
    const indicatorAngle = (h * Math.PI) / 180;
    const indicatorRadius = (outerRadius + innerRadius) / 2;
    const indicatorX = centerX + indicatorRadius * Math.cos(indicatorAngle);
    const indicatorY = centerY + indicatorRadius * Math.sin(indicatorAngle);

    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 8, 0, 2 * Math.PI);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = hslToHex(h, s, l);
    ctx.fill();
  }, [wheelSize]);

  // Sincroniza HSL com o value quando activeColor muda ou quando o popover abre
  useEffect(() => {
    if (isUserInteracting.current) return;
    
    const currentColor = activeColor === "primary" ? value.primary : value.secondary;
    const hsl = hexToHsl(currentColor);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
  }, [activeColor, value.primary, value.secondary]);

  // Redesenha o canvas quando os valores HSL mudam
  useEffect(() => {
    drawColorWheel(hue, saturation, lightness);
  }, [hue, saturation, lightness, drawColorWheel]);

  // Redesenha o canvas quando o popover abre (com delay para garantir que o DOM está pronto)
  useEffect(() => {
    if (open) {
      // Pega os valores HSL atuais do value prop diretamente
      const currentColor = activeColor === "primary" ? value.primary : value.secondary;
      const hsl = hexToHsl(currentColor);
      
      // Atualiza os estados
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
      
      // Usa requestAnimationFrame para garantir que o canvas está no DOM
      const frameId = requestAnimationFrame(() => {
        // Desenha com os valores corretos diretamente
        drawColorWheel(hsl.h, hsl.s, hsl.l);
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [open, activeColor, value.primary, value.secondary, drawColorWheel]);

  const handleWheelClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = wheelRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - wheelSize / 2;
    const y = e.clientY - rect.top - wheelSize / 2;

    let angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    const newHue = Math.round(angle);
    setHue(newHue);
    updateColor(newHue, saturation, lightness);
  };

  const updateColor = (h: number, s: number, l: number) => {
    // Marca que o usuário está interagindo para evitar ciclo de conversão
    isUserInteracting.current = true;
    
    const newHex = hslToHex(h, s, l);
    if (activeColor === "primary") {
      onChange({ ...value, primary: newHex });
    } else {
      onChange({ ...value, secondary: newHex });
    }
    
    // Reseta o flag após um curto período
    setTimeout(() => {
      isUserInteracting.current = false;
    }, 100);
  };

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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

