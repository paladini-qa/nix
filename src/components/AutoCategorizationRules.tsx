import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  useTheme,
  alpha,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AutoFixHigh as AutoFixIcon,
} from "@mui/icons-material";
import NixButton from "./radix/Button";
import {
  getRules,
  addRule,
  deleteRule,
  AutoCategorizationRule,
} from "../services/autoCategorizationService";
import { useNotification } from "../contexts";

interface AutoCategorizationRulesProps {
  categories: { income: string[]; expense: string[] };
}

const AutoCategorizationRules: React.FC<AutoCategorizationRulesProps> = ({ categories }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { showSuccess } = useNotification();

  const [rules, setRules] = useState<AutoCategorizationRule[]>(() => getRules());
  const [pattern, setPattern] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");

  const handleAdd = useCallback(() => {
    if (!pattern.trim() || !category) return;
    const newRule = addRule({ pattern: pattern.trim(), category, type });
    setRules((prev) => [...prev, newRule]);
    setPattern("");
    setCategory("");
    showSuccess(`Regra adicionada: "${pattern}" → ${category}`);
  }, [pattern, category, type, showSuccess]);

  const handleDelete = useCallback((id: string) => {
    deleteRule(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const availableCategories = categories[type];

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "10px",
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.2 : 0.1),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AutoFixIcon sx={{ fontSize: 17, color: "primary.main" }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>
            Regras de Auto-Categorização
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Categorize transações automaticamente pela descrição
          </Typography>
        </Box>
      </Box>

      {/* Nova Regra */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: "16px",
          border: `1px solid ${isDark ? alpha("#FFFFFF", 0.07) : alpha("#000000", 0.06)}`,
          mb: 2,
        }}
      >
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, display: "block", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Nova Regra
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>Tipo</InputLabel>
            <Select value={type} label="Tipo" onChange={(e) => { setType(e.target.value as "income" | "expense"); setCategory(""); }}>
              <MenuItem value="expense">Despesa</MenuItem>
              <MenuItem value="income">Receita</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Contém na descrição"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="ex: Netflix, Uber..."
            sx={{ flex: 1, minWidth: 160 }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Categoria</InputLabel>
            <Select value={category} label="Categoria" onChange={(e) => setCategory(e.target.value)}>
              {availableCategories.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <NixButton
            size="small"
            variant="solid"
            color="purple"
            onClick={handleAdd}
            disabled={!pattern.trim() || !category}
          >
            <AddIcon /> Adicionar
          </NixButton>
        </Box>
      </Paper>

      {/* Lista de Regras */}
      {rules.length === 0 ? (
        <Typography variant="body2" color="text.disabled" sx={{ textAlign: "center", py: 2 }}>
          Nenhuma regra configurada.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          {rules.map((rule) => (
            <Box
              key={rule.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.25,
                borderRadius: "12px",
                border: `1px solid ${isDark ? alpha("#FFFFFF", 0.06) : alpha("#000000", 0.05)}`,
                bgcolor: isDark ? alpha("#FFFFFF", 0.02) : alpha("#FAFAFA", 0.8),
              }}
            >
              <Chip
                label={rule.type === "expense" ? "Despesa" : "Receita"}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  bgcolor: alpha(rule.type === "expense" ? "#DC2626" : "#059669", 0.1),
                  color: rule.type === "expense" ? "#DC2626" : "#059669",
                  border: "none",
                }}
              />
              <Typography variant="body2" sx={{ flex: 1, fontFamily: "monospace", fontSize: 12 }}>
                "{rule.pattern}"
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mx: 0.5 }}>→</Typography>
              <Chip
                label={rule.category}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                  border: "none",
                }}
              />
              <Tooltip title="Remover regra">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(rule.id)}
                  sx={{ p: 0.25 }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AutoCategorizationRules;
