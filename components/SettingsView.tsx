import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Chip,
  Grid,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Tooltip,
  alpha,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  CreditCard as CreditCardIcon,
  LocalOffer as TagIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { TransactionType, ColorConfig, CategoryColors, PaymentMethodColors } from "../types";
import ColorPicker from "./ColorPicker";
import { availableLanguages } from "../i18n";

// Cores padrão para novas categorias
const DEFAULT_INCOME_COLORS: ColorConfig = { primary: "#10b981", secondary: "#059669" };
const DEFAULT_EXPENSE_COLORS: ColorConfig = { primary: "#ef4444", secondary: "#dc2626" };
const DEFAULT_PAYMENT_COLORS: ColorConfig = { primary: "#6366f1", secondary: "#4f46e5" };

interface SettingsViewProps {
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  categoryColors: CategoryColors;
  paymentMethodColors: PaymentMethodColors;
  onAddCategory: (type: TransactionType, category: string) => void;
  onRemoveCategory: (type: TransactionType, category: string) => void;
  onAddPaymentMethod: (method: string) => void;
  onRemovePaymentMethod: (method: string) => void;
  onUpdateCategoryColor: (type: TransactionType, category: string, colors: ColorConfig) => void;
  onUpdatePaymentMethodColor: (method: string, colors: ColorConfig) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  categories,
  paymentMethods,
  categoryColors,
  paymentMethodColors,
  onAddCategory,
  onRemoveCategory,
  onAddPaymentMethod,
  onRemovePaymentMethod,
  onUpdateCategoryColor,
  onUpdatePaymentMethodColor,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [newIncomeCat, setNewIncomeCat] = useState("");
  const [newExpenseCat, setNewExpenseCat] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState("");

  // Obtém o idioma atual detectado do navegador
  const currentLanguage = availableLanguages.find(
    (lang) => i18n.language.startsWith(lang.code.split("-")[0])
  ) || availableLanguages[0];

  const handleAddCat = (type: TransactionType) => {
    const val = type === "income" ? newIncomeCat : newExpenseCat;
    const setVal = type === "income" ? setNewIncomeCat : setNewExpenseCat;

    if (val.trim()) {
      onAddCategory(type, val.trim());
      setVal("");
    }
  };

  const handleAddMethod = () => {
    if (newPaymentMethod.trim()) {
      onAddPaymentMethod(newPaymentMethod.trim());
      setNewPaymentMethod("");
    }
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 3 }}
    >
      <Box>
        <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
          {t("settings.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("settings.subtitle")}
        </Typography>
      </Box>

      {/* Language Display - Segue o idioma do navegador */}
      <Paper
        sx={{
          p: isMobile ? 2 : 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <LanguageIcon sx={{ color: "primary.main" }} />
          <Typography variant="subtitle1" fontWeight={600}>
            {t("settings.language")}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 1.5,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          }}
        >
          <Typography variant="h5" sx={{ lineHeight: 1 }}>
            {currentLanguage.flag}
          </Typography>
          <Box>
            <Typography variant="body1" fontWeight={500}>
              {currentLanguage.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("settings.languageAutoDetected")}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={isMobile ? 2 : 3}>
        {/* Income Categories */}
        <Grid size={{ xs: 12, md: 6, xl: 4 }}>
          <Paper sx={{ p: isMobile ? 2 : 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: isMobile ? 2 : 3,
              }}
            >
              <ArrowUpIcon
                color="success"
                fontSize={isMobile ? "small" : "medium"}
              />
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                fontWeight={600}
              >
                Income Categories
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="New category..."
                value={newIncomeCat}
                onChange={(e) => setNewIncomeCat(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCat("income")}
              />
              <IconButton
                color="success"
                onClick={() => handleAddCat("income")}
                sx={{
                  bgcolor: "success.main",
                  color: "white",
                  "&:hover": { bgcolor: "success.dark" },
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {categories.income.map((cat) => {
                const colors = categoryColors.income?.[cat] || DEFAULT_INCOME_COLORS;
                return (
                  <Box
                    key={cat}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1,
                      borderRadius: 2,
                      bgcolor: "action.hover",
                    }}
                  >
                    <ColorPicker
                      value={colors}
                      onChange={(newColors) => onUpdateCategoryColor("income", cat, newColors)}
                      size="small"
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        fontWeight: 500,
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {cat}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => onRemoveCategory("income", cat)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Expense Categories */}
        <Grid size={{ xs: 12, md: 6, xl: 4 }}>
          <Paper sx={{ p: isMobile ? 2 : 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: isMobile ? 2 : 3,
              }}
            >
              <ArrowDownIcon
                color="secondary"
                fontSize={isMobile ? "small" : "medium"}
              />
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                fontWeight={600}
              >
                Expense Categories
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="New category..."
                value={newExpenseCat}
                onChange={(e) => setNewExpenseCat(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCat("expense")}
              />
              <IconButton
                color="secondary"
                onClick={() => handleAddCat("expense")}
                sx={{
                  bgcolor: "secondary.main",
                  color: "white",
                  "&:hover": { bgcolor: "secondary.dark" },
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {categories.expense.map((cat) => {
                const colors = categoryColors.expense?.[cat] || DEFAULT_EXPENSE_COLORS;
                return (
                  <Box
                    key={cat}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1,
                      borderRadius: 2,
                      bgcolor: "action.hover",
                    }}
                  >
                    <ColorPicker
                      value={colors}
                      onChange={(newColors) => onUpdateCategoryColor("expense", cat, newColors)}
                      size="small"
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        fontWeight: 500,
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {cat}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => onRemoveCategory("expense", cat)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Payment Methods */}
        <Grid size={{ xs: 12, md: 12, xl: 4 }}>
          <Paper sx={{ p: isMobile ? 2 : 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: isMobile ? 2 : 3,
              }}
            >
              <CreditCardIcon
                color="primary"
                fontSize={isMobile ? "small" : "medium"}
              />
              <Typography
                variant={isMobile ? "subtitle1" : "h6"}
                fontWeight={600}
              >
                Payment Methods
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="New method..."
                value={newPaymentMethod}
                onChange={(e) => setNewPaymentMethod(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMethod()}
              />
              <IconButton
                color="primary"
                onClick={handleAddMethod}
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {paymentMethods.map((method) => {
                const colors = paymentMethodColors[method] || DEFAULT_PAYMENT_COLORS;
                return (
                  <Box
                    key={method}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1,
                      borderRadius: 2,
                      bgcolor: "action.hover",
                    }}
                  >
                    <ColorPicker
                      value={colors}
                      onChange={(newColors) => onUpdatePaymentMethodColor(method, newColors)}
                      size="small"
                    />
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                      <CreditCardIcon
                        fontSize="small"
                        sx={{
                          color: colors.primary,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        {method}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => onRemovePaymentMethod(method)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsView;
