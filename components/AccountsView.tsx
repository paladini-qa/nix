import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Tooltip,
  Fab,
  Card,
  CardContent,
  Avatar,
  Chip,
  Switch,
  FormControlLabel,
  alpha,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as BankIcon,
  Savings as SavingsIcon,
  CreditCard as CreditCardIcon,
  Wallet as WalletIcon,
  TrendingUp as InvestmentIcon,
  MoreHoriz as OtherIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
} from "@mui/icons-material";
import {
  Account,
  AccountType,
  AccountWithBalance,
  Transaction,
} from "../types";
import { accountService } from "../services/api";
import { useNotification, useConfirmDialog } from "../contexts";

interface AccountsViewProps {
  userId: string;
  transactions: Transaction[];
}

const ACCOUNT_ICONS: Record<AccountType, React.ReactNode> = {
  checking: <BankIcon />,
  savings: <SavingsIcon />,
  credit_card: <CreditCardIcon />,
  cash: <WalletIcon />,
  investment: <InvestmentIcon />,
  other: <OtherIcon />,
};

const ACCOUNT_COLORS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

const AccountsView: React.FC<AccountsViewProps> = ({
  userId,
  transactions,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showSuccess, showError } = useNotification();
  const { confirmDelete } = useConfirmDialog();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<AccountType>("checking");
  const [formBalance, setFormBalance] = useState("");
  const [formColor, setFormColor] = useState(ACCOUNT_COLORS[0]);

  const accountTypes = accountService.getAccountTypes();

  // Fetch accounts
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      showError("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  // Calculate balances
  const accountsWithBalance = useMemo((): AccountWithBalance[] => {
    return accountService.calculateBalances(accounts, transactions);
  }, [accounts, transactions]);

  // Filter by active status
  const displayedAccounts = useMemo(() => {
    return accountsWithBalance.filter((a) => showArchived || a.isActive);
  }, [accountsWithBalance, showArchived]);

  const activeAccounts = displayedAccounts.filter((a) => a.isActive);
  const archivedAccounts = displayedAccounts.filter((a) => !a.isActive);

  // Summary
  const summary = useMemo(() => {
    const active = accountsWithBalance.filter((a) => a.isActive);
    const totalBalance = active.reduce((sum, a) => sum + a.currentBalance, 0);
    const positiveBalance = active
      .filter((a) => a.currentBalance >= 0)
      .reduce((sum, a) => sum + a.currentBalance, 0);
    const negativeBalance = active
      .filter((a) => a.currentBalance < 0)
      .reduce((sum, a) => sum + a.currentBalance, 0);

    return {
      totalBalance,
      positiveBalance,
      negativeBalance,
      count: active.length,
    };
  }, [accountsWithBalance]);

  const handleOpenForm = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormName(account.name);
      setFormType(account.type);
      setFormBalance(account.initialBalance.toString());
      setFormColor(account.color);
    } else {
      setEditingAccount(null);
      setFormName("");
      setFormType("checking");
      setFormBalance("0");
      setFormColor(
        ACCOUNT_COLORS[Math.floor(Math.random() * ACCOUNT_COLORS.length)]
      );
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAccount(null);
  };

  const handleSave = async () => {
    if (!formName) return;

    try {
      if (editingAccount) {
        await accountService.update(editingAccount.id, {
          name: formName,
          type: formType,
          initialBalance: parseFloat(formBalance || "0"),
          color: formColor,
        });
        showSuccess("Account updated successfully");
      } else {
        await accountService.create(userId, {
          name: formName,
          type: formType,
          initialBalance: parseFloat(formBalance || "0"),
          color: formColor,
          icon: formType,
        });
        showSuccess("Account created successfully");
      }
      handleCloseForm();
      fetchAccounts();
    } catch (err: any) {
      console.error("Error saving account:", err);
      showError(err.message || "Failed to save account");
    }
  };

  const handleDelete = async (account: Account) => {
    const confirmed = await confirmDelete(account.name);
    if (!confirmed) return;

    try {
      await accountService.delete(account.id);
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
      showSuccess("Account deleted");
    } catch (err) {
      console.error("Error deleting account:", err);
      showError("Failed to delete account");
    }
  };

  const handleToggleArchive = async (account: Account) => {
    try {
      if (account.isActive) {
        await accountService.archive(account.id);
        showSuccess(`${account.name} archived`);
      } else {
        await accountService.unarchive(account.id);
        showSuccess(`${account.name} restored`);
      }
      fetchAccounts();
    } catch (err) {
      console.error("Error toggling archive:", err);
      showError("Failed to update account");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getTypeLabel = (type: AccountType) => {
    return accountTypes.find((t) => t.value === type)?.label || type;
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 2 : 3 }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your bank accounts and wallets
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="body2">Show archived</Typography>}
          />
          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenForm()}
            >
              New Account
            </Button>
          )}
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={isMobile ? 1.5 : 2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: theme.palette.mode === "dark"
                ? `0 6px 24px -6px ${alpha(summary.totalBalance >= 0 ? "#059669" : "#DC2626", 0.2)}`
                : `0 6px 24px -6px ${alpha(summary.totalBalance >= 0 ? "#059669" : "#DC2626", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: summary.totalBalance >= 0
                  ? "linear-gradient(135deg, rgba(5, 150, 105, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%)"
                  : "linear-gradient(135deg, rgba(220, 38, 38, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <CardContent sx={{ position: "relative", zIndex: 1, p: isMobile ? 1.5 : 2, textAlign: "center", "&:last-child": { pb: isMobile ? 1.5 : 2 } }}>
              <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: isMobile ? 9 : 10, fontWeight: 600 }}>
                Total Balance
              </Typography>
              <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: summary.totalBalance >= 0 ? "#059669" : "#DC2626", letterSpacing: "-0.02em" }}>
                {formatCurrency(summary.totalBalance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: `0 6px 24px -6px ${alpha("#059669", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <CardContent sx={{ position: "relative", zIndex: 1, p: isMobile ? 1.5 : 2, textAlign: "center", "&:last-child": { pb: isMobile ? 1.5 : 2 } }}>
              <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: isMobile ? 9 : 10, fontWeight: 600 }}>
                Assets
              </Typography>
              <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: "#059669", letterSpacing: "-0.02em" }}>
                {formatCurrency(summary.positiveBalance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: `0 6px 24px -6px ${alpha("#DC2626", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <CardContent sx={{ position: "relative", zIndex: 1, p: isMobile ? 1.5 : 2, textAlign: "center", "&:last-child": { pb: isMobile ? 1.5 : 2 } }}>
              <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: isMobile ? 9 : 10, fontWeight: 600 }}>
                Liabilities
              </Typography>
              <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: "#DC2626", letterSpacing: "-0.02em" }}>
                {formatCurrency(Math.abs(summary.negativeBalance))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              position: "relative",
              overflow: "hidden",
              background: theme.palette.mode === "dark"
                ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha("#FFFFFF", 0.6)} 100%)`,
              backdropFilter: "blur(16px)",
              border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
              boxShadow: `0 6px 24px -6px ${alpha("#6366f1", 0.15)}`,
              borderRadius: "16px",
              transition: "all 0.2s ease-in-out",
              "&:hover": { transform: "translateY(-2px)" },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)",
                pointerEvents: "none",
              },
            }}
          >
            <CardContent sx={{ position: "relative", zIndex: 1, p: isMobile ? 1.5 : 2, textAlign: "center", "&:last-child": { pb: isMobile ? 1.5 : 2 } }}>
              <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: "0.08em", fontSize: isMobile ? 9 : 10, fontWeight: 600 }}>
                Active Accounts
              </Typography>
              <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 700, color: "text.primary", letterSpacing: "-0.02em" }}>
                {summary.count}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Accounts List */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <Typography color="text.secondary">Loading accounts...</Typography>
        </Box>
      ) : displayedAccounts.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",
            background: theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
              : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
            backdropFilter: "blur(16px)",
            border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
            borderRadius: "20px",
          }}
        >
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
                background: theme.palette.mode === "dark"
                  ? alpha("#6366f1", 0.15)
                  : alpha("#6366f1", 0.1),
                border: `1px solid ${alpha("#6366f1", 0.2)}`,
              }}
            >
              <BankIcon sx={{ fontSize: 32, color: "#6366f1" }} />
            </Box>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              No accounts yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add your bank accounts and wallets to track balances
            </Typography>
            <Button variant="contained" onClick={() => handleOpenForm()}>
              Add Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Accounts */}
          {activeAccounts.length > 0 && (
            <Grid container spacing={2}>
              {activeAccounts.map((account) => (
                <Grid key={account.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Card
                    elevation={0}
                    sx={{
                      position: "relative",
                      overflow: "hidden",
                      background: theme.palette.mode === "dark"
                        ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`
                        : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.85)} 0%, ${alpha("#FFFFFF", 0.65)} 100%)`,
                      backdropFilter: "blur(16px)",
                      border: `1px solid ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#000000", 0.06)}`,
                      borderLeft: `3px solid ${account.color}`,
                      borderRadius: "16px",
                      boxShadow: theme.palette.mode === "dark"
                        ? `0 6px 24px -6px ${alpha(account.color, 0.2)}`
                        : `0 6px 24px -6px ${alpha(account.color, 0.15)}`,
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: theme.palette.mode === "dark"
                          ? `0 10px 32px -6px ${alpha(account.color, 0.3)}`
                          : `0 10px 32px -6px ${alpha(account.color, 0.25)}`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.mode === "dark"
                                ? alpha(account.color, 0.2)
                                : alpha(account.color, 0.15),
                              color: account.color,
                              width: 44,
                              height: 44,
                              border: `1px solid ${alpha(account.color, 0.2)}`,
                            }}
                          >
                            {ACCOUNT_ICONS[account.type]}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {account.name}
                            </Typography>
                            <Chip
                              label={getTypeLabel(account.type)}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                height: 20, 
                                fontSize: 11,
                                borderColor: alpha(account.color, 0.3),
                                color: account.color,
                              }}
                            />
                          </Box>
                        </Box>
                        <Box>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenForm(account)}
                              sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.15) }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Archive">
                            <IconButton
                              size="small"
                              onClick={() => handleToggleArchive(account)}
                              sx={{ 
                                ml: 0.5,
                                bgcolor: alpha(theme.palette.warning.main, 0.08),
                                "&:hover": { bgcolor: alpha(theme.palette.warning.main, 0.15) }
                              }}
                            >
                              <ArchiveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(account)}
                              sx={{ 
                                ml: 0.5,
                                bgcolor: alpha(theme.palette.error.main, 0.08),
                                "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.15) }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.05em", fontWeight: 500 }}>
                          Current Balance
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            color: account.currentBalance >= 0 ? "#059669" : "#DC2626",
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {formatCurrency(account.currentBalance)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Archived Accounts */}
          {showArchived && archivedAccounts.length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <ArchiveIcon fontSize="small" />
                Archived Accounts ({archivedAccounts.length})
              </Typography>
              <Grid container spacing={2}>
                {archivedAccounts.map((account) => (
                  <Grid key={account.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card
                      elevation={0}
                      sx={{
                        position: "relative",
                        overflow: "hidden",
                        opacity: 0.7,
                        background: theme.palette.mode === "dark"
                          ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.5)} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`
                          : `linear-gradient(135deg, ${alpha("#FFFFFF", 0.6)} 0%, ${alpha("#FFFFFF", 0.4)} 100%)`,
                        backdropFilter: "blur(12px)",
                        border: `1px dashed ${theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.1) : alpha("#000000", 0.1)}`,
                        borderRadius: "14px",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": { opacity: 0.9 },
                      }}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: alpha("#64748B", 0.15),
                                color: "#64748B",
                                width: 40,
                                height: 40,
                              }}
                            >
                              {ACCOUNT_ICONS[account.type]}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {account.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {formatCurrency(account.currentBalance)}
                              </Typography>
                            </Box>
                          </Box>
                          <Box>
                            <Tooltip title="Restore">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleToggleArchive(account)}
                              >
                                <UnarchiveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(account)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={() => handleOpenForm()}
          sx={{
            position: "fixed",
            bottom: 80,
            right: 16,
            zIndex: 1100,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Form Dialog */}
      <Dialog
        open={isFormOpen}
        onClose={handleCloseForm}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "20px" } }}
      >
        <DialogTitle>
          {editingAccount ? "Edit Account" : "New Account"}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
          >
            <TextField
              label="Account Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g., My Bank Account"
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={formType}
                label="Account Type"
                onChange={(e) => setFormType(e.target.value as AccountType)}
              >
                {accountTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {ACCOUNT_ICONS[type.value]}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Initial Balance"
              type="number"
              value={formBalance}
              onChange={(e) => setFormBalance(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">R$</InputAdornment>
                ),
              }}
              inputProps={{ step: 0.01 }}
              fullWidth
              helperText="Use negative values for credit card debt"
            />

            {/* Color Picker */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 1, display: "block" }}
              >
                Color
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {ACCOUNT_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setFormColor(color)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: color,
                      cursor: "pointer",
                      border: formColor === color ? 3 : 0,
                      borderColor: "common.white",
                      outline:
                        formColor === color ? `2px solid ${color}` : "none",
                      transition: "transform 0.2s",
                      "&:hover": { transform: "scale(1.1)" },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={handleCloseForm} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!formName}>
            {editingAccount ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountsView;




