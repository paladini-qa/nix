import React, { useState, useEffect } from "react";
import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Box,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Close as CloseIcon,
  TextFields as TextIcon,
  Mic as MicIcon,
  PhotoCamera as CameraIcon,
  AutoAwesome as AIIcon,
} from "@mui/icons-material";
import SmartInputModal from "./SmartInputModal";
import { SmartInputMode, ParsedTransaction } from "../types";

interface SmartInputFABProps {
  onTransactionCreate: (transaction: Omit<ParsedTransaction, "confidence" | "rawInput">) => void;
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  visible?: boolean;
}

const SmartInputFAB: React.FC<SmartInputFABProps> = ({
  onTransactionCreate,
  categories,
  paymentMethods,
  visible = true,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const [isOpen, setIsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<SmartInputMode>("text");

  // Fecha o SpeedDial quando a visibilidade muda para false
  useEffect(() => {
    if (!visible) {
      setIsOpen(false);
    }
  }, [visible]);


  const handleActionClick = (mode: SmartInputMode) => {
    setInitialMode(mode);
    setIsOpen(false);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleConfirm = (transaction: Omit<ParsedTransaction, "confidence" | "rawInput">) => {
    onTransactionCreate(transaction);
    setModalOpen(false);
  };

  const actions = [
    {
      icon: <TextIcon />,
      name: "Texto",
      mode: "text" as SmartInputMode,
      color: theme.palette.primary.main,
    },
    {
      icon: <MicIcon />,
      name: "Áudio",
      mode: "audio" as SmartInputMode,
      color: theme.palette.secondary.main,
    },
    {
      icon: <CameraIcon />,
      name: "Imagem",
      mode: "image" as SmartInputMode,
      color: theme.palette.info.main,
    },
  ];

  // Não renderiza nada se não estiver visível
  if (!visible) return null;

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          bottom: { xs: 24, sm: 32 },
          right: { xs: 24, sm: 32 },
          zIndex: 1050,
        }}
      >
          <SpeedDial
            ariaLabel="Cadastro inteligente"
            icon={
              <SpeedDialIcon
                icon={<AIIcon />}
                openIcon={<CloseIcon />}
              />
            }
            open={isOpen}
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            direction="up"
            FabProps={{
              sx: {
                width: 56,
                height: 56,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 4px 16px -2px ${alpha(theme.palette.primary.main, 0.4)}`,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                  transform: "scale(1.05)",
                  boxShadow: `0 6px 20px -2px ${alpha(theme.palette.primary.main, 0.5)}`,
                },
              },
            }}
            sx={{
              "& .MuiSpeedDial-actions": {
                gap: 1,
                pb: 1,
              },
            }}
          >
            {actions.map((action) => (
              <SpeedDialAction
                key={action.mode}
                icon={action.icon}
                tooltipTitle={action.name}
                tooltipOpen
                onClick={() => handleActionClick(action.mode)}
                FabProps={{
                  sx: {
                    bgcolor: isDarkMode
                      ? alpha(action.color, 0.15)
                      : alpha(action.color, 0.1),
                    color: action.color,
                    border: `1.5px solid ${alpha(action.color, 0.25)}`,
                    boxShadow: `0 2px 8px -2px ${alpha(action.color, 0.3)}`,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: alpha(action.color, 0.2),
                      transform: "scale(1.08)",
                      boxShadow: `0 4px 12px -2px ${alpha(action.color, 0.4)}`,
                    },
                  },
                }}
                sx={{
                  "& .MuiSpeedDialAction-staticTooltipLabel": {
                    bgcolor: isDarkMode
                      ? alpha(theme.palette.background.paper, 0.95)
                      : alpha("#FFFFFF", 0.98),
                    color: "text.primary",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    borderRadius: "10px",
                    px: 1.25,
                    py: 0.5,
                    boxShadow: `0 2px 8px -2px ${alpha("#000", 0.15)}`,
                    border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.05)}`,
                    backdropFilter: "blur(8px)",
                  },
                }}
              />
            ))}
          </SpeedDial>
      </Box>

      {/* Modal de entrada inteligente */}
      <SmartInputModal
        open={modalOpen}
        onClose={handleModalClose}
        onConfirm={handleConfirm}
        categories={categories}
        paymentMethods={paymentMethods}
        initialMode={initialMode}
      />
    </>
  );
};

export default SmartInputFAB;


