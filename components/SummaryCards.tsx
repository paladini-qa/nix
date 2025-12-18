import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalanceWallet as WalletIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import { FinancialSummary, Transaction } from "../types";

interface SummaryCardsProps {
  summary: FinancialSummary;
  transactions?: Transaction[];
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, transactions = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Calculate shared expenses (50/50 split)
  const sharedExpenses = transactions.filter(
    (t) => t.type === "expense" && t.isShared
  );
  const totalShared = sharedExpenses.reduce((sum, t) => sum + t.amount, 0);
  const friendOwes = totalShared / 2;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyFull = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const isPositiveBalance = summary.balance >= 0;

  return (
    <Grid container spacing={isMobile ? 1.5 : 2}>
      {/* Balance Card */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card
          sx={{
            height: "100%",
            background: isPositiveBalance
              ? "linear-gradient(135deg, #10b981 0%, #047857 100%)"
              : "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <CardContent
            sx={{ position: "relative", zIndex: 1, p: isMobile ? 2 : 3 }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box>
                <Typography
                  variant="overline"
                  sx={{
                    opacity: 0.9,
                    letterSpacing: 1,
                    fontSize: isMobile ? 10 : 12,
                  }}
                >
                  Balance
                </Typography>
                <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
                  {isMobile
                    ? formatCurrency(summary.balance)
                    : formatCurrencyFull(summary.balance)}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: isMobile ? 1 : 1.5,
                  bgcolor: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  backdropFilter: "blur(10px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <WalletIcon fontSize={isMobile ? "small" : "medium"} />
              </Box>
            </Box>
          </CardContent>
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 60,
              opacity: 0.2,
            }}
          >
            <svg
              viewBox="0 0 300 100"
              preserveAspectRatio="none"
              style={{ width: "100%", height: "100%" }}
            >
              <path
                d="M0,80 C30,90 60,40 100,60 C140,80 170,20 220,40 C250,50 280,30 300,50 L300,100 L0,100 Z"
                fill="currentColor"
              />
            </svg>
          </Box>
        </Card>
      </Grid>

      {/* Income Card */}
      <Grid size={{ xs: 6, sm: 6, lg: 4 }}>
        <Card
          sx={{
            height: "100%",
            background: "linear-gradient(135deg, #10b981 0%, #0d9488 100%)",
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <CardContent
            sx={{ position: "relative", zIndex: 1, p: isMobile ? 2 : 3 }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="overline"
                  sx={{
                    opacity: 0.9,
                    letterSpacing: 1,
                    fontSize: isMobile ? 10 : 12,
                  }}
                >
                  Income
                </Typography>
                <Typography
                  variant={isMobile ? "h6" : "h4"}
                  fontWeight="bold"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isMobile
                    ? formatCurrency(summary.totalIncome)
                    : formatCurrencyFull(summary.totalIncome)}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: isMobile ? 1 : 1.5,
                  bgcolor: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  backdropFilter: "blur(10px)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUpIcon fontSize={isMobile ? "small" : "medium"} />
              </Box>
            </Box>
          </CardContent>
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 60,
              opacity: 0.2,
            }}
          >
            <svg
              viewBox="0 0 300 100"
              preserveAspectRatio="none"
              style={{ width: "100%", height: "100%" }}
            >
              <path
                d="M0,80 C30,90 60,40 100,60 C140,80 170,20 220,40 C250,50 280,30 300,50 L300,100 L0,100 Z"
                fill="currentColor"
              />
            </svg>
          </Box>
        </Card>
      </Grid>

      {/* Expense Card */}
      <Grid size={{ xs: 6, sm: 6, lg: friendOwes > 0 ? 3 : 4 }}>
        <Card
          sx={{
            height: "100%",
            background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <CardContent
            sx={{ position: "relative", zIndex: 1, p: isMobile ? 2 : 3 }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="overline"
                  sx={{
                    opacity: 0.9,
                    letterSpacing: 1,
                    fontSize: isMobile ? 10 : 12,
                  }}
                >
                  Expenses
                </Typography>
                <Typography
                  variant={isMobile ? "h6" : "h4"}
                  fontWeight="bold"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isMobile
                    ? formatCurrency(summary.totalExpense)
                    : formatCurrencyFull(summary.totalExpense)}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: isMobile ? 1 : 1.5,
                  bgcolor: "rgba(255,255,255,0.2)",
                  borderRadius: "50%",
                  backdropFilter: "blur(10px)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingDownIcon fontSize={isMobile ? "small" : "medium"} />
              </Box>
            </Box>
          </CardContent>
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 60,
              opacity: 0.2,
            }}
          >
            <svg
              viewBox="0 0 300 100"
              preserveAspectRatio="none"
              style={{ width: "100%", height: "100%" }}
            >
              <path
                d="M0,80 C30,90 60,40 100,60 C140,80 170,20 220,40 C250,50 280,30 300,50 L300,100 L0,100 Z"
                fill="currentColor"
              />
            </svg>
          </Box>
        </Card>
      </Grid>

      {/* Shared Expenses Card - Only show if there are shared expenses */}
      {friendOwes > 0 && (
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
              color: "white",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <CardContent
              sx={{ position: "relative", zIndex: 1, p: isMobile ? 2 : 3 }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      opacity: 0.9,
                      letterSpacing: 1,
                      fontSize: isMobile ? 10 : 12,
                    }}
                  >
                    Friend Owes You
                  </Typography>
                  <Typography
                    variant={isMobile ? "h6" : "h4"}
                    fontWeight="bold"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isMobile
                      ? formatCurrency(friendOwes)
                      : formatCurrencyFull(friendOwes)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.8, display: "block", mt: 0.5 }}
                  >
                    {sharedExpenses.length} shared expense{sharedExpenses.length !== 1 ? "s" : ""}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: isMobile ? 1 : 1.5,
                    bgcolor: "rgba(255,255,255,0.2)",
                    borderRadius: "50%",
                    backdropFilter: "blur(10px)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <GroupIcon fontSize={isMobile ? "small" : "medium"} />
                </Box>
              </Box>
            </CardContent>
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 60,
                opacity: 0.2,
              }}
            >
              <svg
                viewBox="0 0 300 100"
                preserveAspectRatio="none"
                style={{ width: "100%", height: "100%" }}
              >
                <path
                  d="M0,80 C30,90 60,40 100,60 C140,80 170,20 220,40 C250,50 280,30 300,50 L300,100 L0,100 Z"
                  fill="currentColor"
                />
              </svg>
            </Box>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

export default SummaryCards;
