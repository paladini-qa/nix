import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Grid,
  useMediaQuery,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Category as CategoryIcon,
} from "@mui/icons-material";
import { TransactionType, ColorConfig, CategoryColors } from "../types";
import ColorPicker from "./ColorPicker";

// Cores padrão para novas categorias
const DEFAULT_INCOME_COLORS: ColorConfig = { primary: "#10b981", secondary: "#059669" };
const DEFAULT_EXPENSE_COLORS: ColorConfig = { primary: "#ef4444", secondary: "#dc2626" };

interface CategoriesViewProps {
  categories: { income: string[]; expense: string[] };
  categoryColors: CategoryColors;
  onAddCategory: (type: TransactionType, category: string) => void;
  onRemoveCategory: (type: TransactionType, category: string) => void;
  onUpdateCategoryColor: (type: TransactionType, category: string, colors: ColorConfig) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`category-tabpanel-${index}`}
      aria-labelledby={`category-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </Box>
  );
}

const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  categoryColors,
  onAddCategory,
  onRemoveCategory,
  onUpdateCategoryColor,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";

  const [tabValue, setTabValue] = useState(0);
  const [newIncomeCat, setNewIncomeCat] = useState("");
  const [newExpenseCat, setNewExpenseCat] = useState("");

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddCat = (type: TransactionType) => {
    const val = type === "income" ? newIncomeCat : newExpenseCat;
    const setVal = type === "income" ? setNewIncomeCat : setNewExpenseCat;

    if (val.trim()) {
      onAddCategory(type, val.trim());
      setVal("");
    }
  };

  const renderCategoryList = (type: TransactionType) => {
    const categoryList = type === "income" ? categories.income : categories.expense;
    const defaultColors = type === "income" ? DEFAULT_INCOME_COLORS : DEFAULT_EXPENSE_COLORS;
    const colorKey = type === "income" ? categoryColors.income : categoryColors.expense;
    const newCat = type === "income" ? newIncomeCat : newExpenseCat;
    const setNewCat = type === "income" ? setNewIncomeCat : setNewExpenseCat;
    const accentColor = type === "income" ? "#10b981" : "#ef4444";

    return (
      <Box>
        {/* Add Category Input */}
        <Paper
          sx={{
            p: 2,
            mb: 3,
            background: isDarkMode
              ? alpha(accentColor, 0.08)
              : alpha(accentColor, 0.04),
            border: `1px solid ${alpha(accentColor, 0.15)}`,
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            {type === "income" ? "Adicionar Categoria de Receita" : "Adicionar Categoria de Despesa"}
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Nome da categoria..."
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCat(type)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <IconButton
              onClick={() => handleAddCat(type)}
              sx={{
                bgcolor: accentColor,
                color: "white",
                borderRadius: 2,
                "&:hover": { bgcolor: alpha(accentColor, 0.8) },
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Paper>

        {/* Category List */}
        <Grid container spacing={2}>
          {categoryList.map((cat) => {
            const colors = colorKey?.[cat] || defaultColors;
            return (
              <Grid key={cat} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper
                  sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    transition: "all 0.2s ease",
                    border: `1px solid ${alpha(colors.primary, 0.2)}`,
                    background: isDarkMode
                      ? `linear-gradient(135deg, ${alpha(colors.primary, 0.1)} 0%, ${alpha(colors.secondary, 0.05)} 100%)`
                      : `linear-gradient(135deg, ${alpha(colors.primary, 0.06)} 0%, ${alpha(colors.secondary, 0.02)} 100%)`,
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: `0 8px 16px -4px ${alpha(colors.primary, 0.2)}`,
                    },
                  }}
                >
                  <ColorPicker
                    value={colors}
                    onChange={(newColors) => onUpdateCategoryColor(type, cat, newColors)}
                    size="small"
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      sx={{
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cat}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => onRemoveCategory(type, cat)}
                    sx={{
                      color: "text.secondary",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        color: "error.main",
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* Empty State */}
        {categoryList.length === 0 && (
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              bgcolor: alpha(accentColor, 0.02),
              border: `1px dashed ${alpha(accentColor, 0.2)}`,
            }}
          >
            <CategoryIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhuma categoria
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Adicione uma categoria usando o campo acima
            </Typography>
          </Paper>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 3 }}>
      {/* Header */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: "flex",
            }}
          >
            <CategoryIcon color="primary" />
          </Box>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            Categorias
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Gerencie as categorias de receitas e despesas
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            sx={{
              p: 2,
              background: `linear-gradient(135deg, ${alpha("#10b981", 0.1)} 0%, ${alpha("#10b981", 0.02)} 100%)`,
              border: `1px solid ${alpha("#10b981", 0.2)}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha("#10b981", 0.1),
                }}
              >
                <TrendingUpIcon sx={{ color: "#10b981", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Categorias de Receita
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="#10b981">
                  {categories.income.length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            sx={{
              p: 2,
              background: `linear-gradient(135deg, ${alpha("#ef4444", 0.1)} 0%, ${alpha("#ef4444", 0.02)} 100%)`,
              border: `1px solid ${alpha("#ef4444", 0.2)}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha("#ef4444", 0.1),
                }}
              >
                <TrendingDownIcon sx={{ color: "#ef4444", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Categorias de Despesa
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="#ef4444">
                  {categories.expense.length}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ p: isMobile ? 2 : 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minHeight: 48,
            },
          }}
        >
          <Tab
            icon={<TrendingUpIcon />}
            iconPosition="start"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Receitas
                <Chip
                  label={categories.income.length}
                  size="small"
                  sx={{
                    height: 20,
                    bgcolor: tabValue === 0 ? alpha("#10b981", 0.15) : "action.hover",
                    color: tabValue === 0 ? "#10b981" : "text.secondary",
                  }}
                />
              </Box>
            }
            sx={{
              color: tabValue === 0 ? "#10b981" : "text.secondary",
              "&.Mui-selected": {
                color: "#10b981",
              },
            }}
          />
          <Tab
            icon={<TrendingDownIcon />}
            iconPosition="start"
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Despesas
                <Chip
                  label={categories.expense.length}
                  size="small"
                  sx={{
                    height: 20,
                    bgcolor: tabValue === 1 ? alpha("#ef4444", 0.15) : "action.hover",
                    color: tabValue === 1 ? "#ef4444" : "text.secondary",
                  }}
                />
              </Box>
            }
            sx={{
              color: tabValue === 1 ? "#ef4444" : "text.secondary",
              "&.Mui-selected": {
                color: "#ef4444",
              },
            }}
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {renderCategoryList("income")}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {renderCategoryList("expense")}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default CategoriesView;

