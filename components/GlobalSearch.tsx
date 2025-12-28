import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  useTheme,
  alpha,
  InputAdornment,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Dashboard as DashboardIcon,
  AccountBalanceWallet as WalletIcon,
  Settings as SettingsIcon,
  AutoAwesome as SparklesIcon,
  Repeat as RepeatIcon,
  CreditCard as CreditCardIcon,
  People as PeopleIcon,
  PieChart as BudgetIcon,
  Flag as GoalIcon,
  AccountBalance as AccountIcon,
  Analytics as AnalyticsIcon,
  ArrowForward as ArrowIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { Transaction } from "../types";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onNavigate: (view: string) => void;
  onSelectTransaction: (transaction: Transaction) => void;
}

type ViewId =
  | "dashboard"
  | "transactions"
  | "splits"
  | "shared"
  | "recurring"
  | "budgets"
  | "goals"
  | "accounts"
  | "analytics"
  | "nixai"
  | "settings";

interface NavigationItem {
  id: ViewId;
  label: string;
  icon: React.ReactNode;
  keywords: string[];
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  open,
  onClose,
  transactions,
  onNavigate,
  onSelectTransaction,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Navigation items
  const navigationItems: NavigationItem[] = useMemo(
    () => [
      { id: "dashboard", label: t("nav.dashboard"), icon: <DashboardIcon />, keywords: ["home", "inicio", "painel"] },
      { id: "transactions", label: t("nav.transactions"), icon: <WalletIcon />, keywords: ["transacao", "pagamento", "gasto"] },
      { id: "splits", label: t("nav.splits"), icon: <CreditCardIcon />, keywords: ["parcela", "credito", "cartao"] },
      { id: "shared", label: t("nav.shared"), icon: <PeopleIcon />, keywords: ["compartilhado", "amigo", "dividir"] },
      { id: "recurring", label: t("nav.recurring"), icon: <RepeatIcon />, keywords: ["recorrente", "mensal", "fixo"] },
      { id: "budgets", label: t("nav.budgets"), icon: <BudgetIcon />, keywords: ["orcamento", "limite", "budget"] },
      { id: "goals", label: t("nav.goals"), icon: <GoalIcon />, keywords: ["meta", "objetivo", "economia"] },
      { id: "accounts", label: t("nav.accounts"), icon: <AccountIcon />, keywords: ["conta", "banco", "carteira"] },
      { id: "analytics", label: "Analytics", icon: <AnalyticsIcon />, keywords: ["grafico", "relatorio", "estatistica"] },
      { id: "nixai", label: t("nav.nixai"), icon: <SparklesIcon />, keywords: ["ai", "assistente", "inteligencia"] },
      { id: "settings", label: t("nav.settings"), icon: <SettingsIcon />, keywords: ["configuracao", "preferencia"] },
    ],
    [t]
  );

  // Filter navigation items
  const filteredNavItems = useMemo(() => {
    if (!query.trim()) return navigationItems.slice(0, 5);

    const q = query.toLowerCase();
    return navigationItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
    );
  }, [query, navigationItems]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase();
    return transactions
      .filter(
        (tx) =>
          tx.description.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          tx.paymentMethod.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, transactions]);

  // All results
  const allResults = useMemo(() => {
    const navResults = filteredNavItems.map((item) => ({
      type: "nav" as const,
      item,
    }));
    const txResults = filteredTransactions.map((tx) => ({
      type: "transaction" as const,
      item: tx,
    }));
    return [...navResults, ...txResults];
  }, [filteredNavItems, filteredTransactions]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [allResults.length]);

  // Reset query when dialog opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && allResults[selectedIndex]) {
        e.preventDefault();
        const result = allResults[selectedIndex];
        if (result.type === "nav") {
          onNavigate(result.item.id);
          onClose();
        } else {
          onSelectTransaction(result.item);
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [allResults, selectedIndex, onNavigate, onSelectTransaction, onClose]
  );

  const handleSelect = (index: number) => {
    const result = allResults[index];
    if (result.type === "nav") {
      onNavigate(result.item.id);
    } else {
      onSelectTransaction(result.item);
    }
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "20px",
          bgcolor: isDarkMode ? "grey.900" : "background.paper",
          backgroundImage: "none",
          overflow: "hidden",
          mt: -10,
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: alpha("#000", 0.5),
            backdropFilter: "blur(4px)",
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Search Input */}
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <TextField
            autoFocus
            fullWidth
            placeholder="Buscar transações, navegar para..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "primary.main" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Chip
                    label="ESC"
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: 11,
                      bgcolor: alpha(theme.palette.text.primary, 0.08),
                    }}
                  />
                </InputAdornment>
              ),
              sx: { fontSize: 18 },
            }}
          />
        </Box>

        {/* Results */}
        <Box sx={{ maxHeight: 400, overflow: "auto" }}>
          {/* Navigation Results */}
          {filteredNavItems.length > 0 && (
            <>
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  py: 1,
                  display: "block",
                  color: "text.secondary",
                  fontWeight: 600,
                  letterSpacing: 0.5,
                }}
              >
                NAVEGAÇÃO
              </Typography>
              <List dense disablePadding>
                {filteredNavItems.map((item, index) => {
                  const globalIndex = index;
                  const isSelected = selectedIndex === globalIndex;

                  return (
                    <ListItem key={item.id} disablePadding>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => handleSelect(globalIndex)}
                        sx={{
                          py: 1.5,
                          px: 2,
                          "&.Mui-selected": {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                          },
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 40,
                            color: isSelected ? "primary.main" : "text.secondary",
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontWeight: isSelected ? 600 : 500,
                          }}
                        />
                        {isSelected && (
                          <ArrowIcon
                            sx={{ color: "primary.main", fontSize: 18 }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}

          {/* Transaction Results */}
          {filteredTransactions.length > 0 && (
            <>
              <Divider />
              <Typography
                variant="caption"
                sx={{
                  px: 2,
                  py: 1,
                  display: "block",
                  color: "text.secondary",
                  fontWeight: 600,
                  letterSpacing: 0.5,
                }}
              >
                TRANSAÇÕES
              </Typography>
              <List dense disablePadding>
                {filteredTransactions.map((tx, index) => {
                  const globalIndex = filteredNavItems.length + index;
                  const isSelected = selectedIndex === globalIndex;

                  return (
                    <ListItem key={tx.id} disablePadding>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => handleSelect(globalIndex)}
                        sx={{
                          py: 1.5,
                          px: 2,
                          "&.Mui-selected": {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                          },
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 40,
                            color:
                              tx.type === "income" ? "success.main" : "error.main",
                          }}
                        >
                          {tx.type === "income" ? <IncomeIcon /> : <ExpenseIcon />}
                        </ListItemIcon>
                        <ListItemText
                          primary={tx.description}
                          secondary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mt: 0.25,
                              }}
                            >
                              <Chip
                                label={tx.category}
                                size="small"
                                sx={{ height: 20, fontSize: 10 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {new Date(tx.date).toLocaleDateString("pt-BR")}
                              </Typography>
                            </Box>
                          }
                          primaryTypographyProps={{
                            fontWeight: isSelected ? 600 : 500,
                            noWrap: true,
                          }}
                        />
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={tx.type === "income" ? "success.main" : "error.main"}
                        >
                          {tx.type === "expense" ? "-" : "+"}
                          {formatCurrency(tx.amount || 0)}
                        </Typography>
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}

          {/* Empty State */}
          {allResults.length === 0 && query.trim() && (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography color="text.secondary">
                Nenhum resultado encontrado para "{query}"
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer Hints */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: "flex",
            gap: 2,
            justifyContent: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Chip label="↑↓" size="small" sx={{ height: 20, fontSize: 10 }} />
            <Typography variant="caption" color="text.secondary">
              navegar
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Chip label="↵" size="small" sx={{ height: 20, fontSize: 10 }} />
            <Typography variant="caption" color="text.secondary">
              selecionar
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Chip label="ESC" size="small" sx={{ height: 20, fontSize: 10 }} />
            <Typography variant="caption" color="text.secondary">
              fechar
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;



