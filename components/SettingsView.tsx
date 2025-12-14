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
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  CreditCard as CreditCardIcon,
  LocalOffer as TagIcon,
} from "@mui/icons-material";
import { TransactionType } from "../types";

interface SettingsViewProps {
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  onAddCategory: (type: TransactionType, category: string) => void;
  onRemoveCategory: (type: TransactionType, category: string) => void;
  onAddPaymentMethod: (method: string) => void;
  onRemovePaymentMethod: (method: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  categories,
  paymentMethods,
  onAddCategory,
  onRemoveCategory,
  onAddPaymentMethod,
  onRemovePaymentMethod,
}) => {
  const [newIncomeCat, setNewIncomeCat] = useState("");
  const [newExpenseCat, setNewExpenseCat] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState("");

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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight="bold">
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your categories and payment methods.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Income Categories */}
        <Grid size={{ xs: 12, md: 6, xl: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}
            >
              <ArrowUpIcon color="success" />
              <Typography variant="h6" fontWeight={600}>
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

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {categories.income.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  color="success"
                  variant="outlined"
                  onDelete={() => onRemoveCategory("income", cat)}
                  deleteIcon={<DeleteIcon />}
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Expense Categories */}
        <Grid size={{ xs: 12, md: 6, xl: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}
            >
              <ArrowDownIcon color="secondary" />
              <Typography variant="h6" fontWeight={600}>
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

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {categories.expense.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  color="secondary"
                  variant="outlined"
                  onDelete={() => onRemoveCategory("expense", cat)}
                  deleteIcon={<DeleteIcon />}
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Payment Methods */}
        <Grid size={{ xs: 12, md: 12, xl: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}
            >
              <CreditCardIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
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

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {paymentMethods.map((method) => (
                <Chip
                  key={method}
                  label={method}
                  color="primary"
                  variant="outlined"
                  icon={<TagIcon />}
                  onDelete={() => onRemovePaymentMethod(method)}
                  deleteIcon={<DeleteIcon />}
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsView;
