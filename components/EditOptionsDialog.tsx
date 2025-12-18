import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Edit as EditIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  AllInclusive as AllIcon,
  Repeat as RepeatIcon,
  CreditCard as CreditCardIcon,
} from "@mui/icons-material";
import { Transaction } from "../types";

export type EditOption = "single" | "all_future" | "all";

interface EditOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: EditOption) => void;
  transaction: Transaction | null;
}

const EditOptionsDialog: React.FC<EditOptionsDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
  transaction,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!transaction) return null;

  const isRecurring = transaction.isRecurring;
  const isInstallment = transaction.installments && transaction.installments > 1;
  
  const typeLabel = isRecurring ? "recurring transaction" : "installment";
  const typeIcon = isRecurring ? <RepeatIcon color="primary" /> : <CreditCardIcon color="warning" />;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {typeIcon}
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Edit {isRecurring ? "Recurring" : "Installment"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {transaction.description}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 2, pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          How would you like to apply this edit?
        </Typography>

        <List disablePadding>
          <ListItemButton
            onClick={() => onSelect("single")}
            sx={{
              borderRadius: 2,
              mb: 1,
              border: 1,
              borderColor: "divider",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "primary.50",
              },
            }}
          >
            <ListItemIcon>
              <TodayIcon color="info" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography fontWeight={500}>
                  Only this {isRecurring ? "occurrence" : "installment"}
                </Typography>
              }
              secondary={
                isRecurring
                  ? "Edit only this specific month's occurrence"
                  : `Edit only installment ${transaction.currentInstallment || 1}/${transaction.installments}`
              }
            />
          </ListItemButton>

          <ListItemButton
            onClick={() => onSelect("all_future")}
            sx={{
              borderRadius: 2,
              mb: 1,
              border: 1,
              borderColor: "divider",
              "&:hover": {
                borderColor: "warning.main",
                bgcolor: "warning.50",
              },
            }}
          >
            <ListItemIcon>
              <DateRangeIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography fontWeight={500}>
                  This and all future {isRecurring ? "occurrences" : "installments"}
                </Typography>
              }
              secondary={
                isRecurring
                  ? "Changes will apply from this month onwards"
                  : `Edit from installment ${transaction.currentInstallment || 1} to ${transaction.installments}`
              }
            />
          </ListItemButton>

          <ListItemButton
            onClick={() => onSelect("all")}
            sx={{
              borderRadius: 2,
              border: 1,
              borderColor: "divider",
              "&:hover": {
                borderColor: "error.main",
                bgcolor: "error.50",
              },
            }}
          >
            <ListItemIcon>
              <AllIcon color="error" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography fontWeight={500}>
                  All {isRecurring ? "occurrences" : "installments"}
                </Typography>
              }
              secondary={
                isRecurring
                  ? "Edit all past and future occurrences"
                  : `Edit all ${transaction.installments} installments`
              }
            />
          </ListItemButton>
        </List>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" fullWidth={isMobile}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditOptionsDialog;

