import React, { useState } from "react";
import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Box,
  alpha,
  useTheme,
  Zoom,
} from "@mui/material";
import {
  Add as AddIcon,
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

  if (!visible) return null;

  return (
    <>
      <Zoom in={visible}>
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
                width: 64,
                height: 64,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 8px 32px -4px ${alpha(theme.palette.primary.main, 0.5)}`,
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                  transform: "scale(1.05)",
                  boxShadow: `0 12px 40px -4px ${alpha(theme.palette.primary.main, 0.6)}`,
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
                      ? alpha(action.color, 0.2)
                      : alpha(action.color, 0.1),
                    color: action.color,
                    border: `2px solid ${alpha(action.color, 0.3)}`,
                    boxShadow: `0 4px 16px -4px ${alpha(action.color, 0.4)}`,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: alpha(action.color, 0.2),
                      transform: "scale(1.1)",
                      boxShadow: `0 6px 20px -4px ${alpha(action.color, 0.5)}`,
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
                    fontSize: "0.85rem",
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.75,
                    boxShadow: `0 4px 16px -4px ${alpha("#000", 0.2)}`,
                    border: `1px solid ${isDarkMode ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.06)}`,
                    backdropFilter: "blur(8px)",
                  },
                }}
              />
            ))}
          </SpeedDial>
        </Box>
      </Zoom>

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

