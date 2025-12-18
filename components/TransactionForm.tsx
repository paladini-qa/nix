import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  Typography,
  Paper,
  IconButton,
  InputAdornment,
  Grid,
  useMediaQuery,
  useTheme,
  Slide,
  AppBar,
  Toolbar,
  Divider,
  ListSubheader,
  Alert,
  Collapse,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import {
  Close as CloseIcon,
  Repeat as RepeatIcon,
  CreditCard as CreditCardIcon,
  ArrowBack as ArrowBackIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import { Transaction, TransactionType } from "../types";

// Mobile slide transition
const SlideTransition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    transaction: Omit<Transaction, "id" | "createdAt">,
    editId?: string
  ) => void;
  categories: { income: string[]; expense: string[] };
  paymentMethods: string[];
  editTransaction?: Transaction | null;
  friends: string[];
  onAddFriend: (friend: string) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  paymentMethods,
  editTransaction,
  friends,
  onAddFriend,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"monthly" | "yearly">("monthly");
  const [hasInstallments, setHasInstallments] = useState(false);
  const [installments, setInstallments] = useState("2");
  const [isShared, setIsShared] = useState(false);
  const [sharedWith, setSharedWith] = useState("");
  const [newFriendName, setNewFriendName] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (editTransaction) {
      setDescription(editTransaction.description);
      setAmount(editTransaction.amount.toString());
      setType(editTransaction.type);
      setCategory(editTransaction.category);
      setPaymentMethod(editTransaction.paymentMethod);
      setDate(dayjs(editTransaction.date));
      setIsRecurring(editTransaction.isRecurring || false);
      setFrequency(editTransaction.frequency || "monthly");
      setHasInstallments(
        editTransaction.installments !== undefined &&
          editTransaction.installments > 1
      );
      setInstallments(editTransaction.installments?.toString() || "2");
      setIsShared(editTransaction.isShared || false);
      setSharedWith(editTransaction.sharedWith || "");
    } else {
      setDescription("");
      setAmount("");
      setType("expense");
      setCategory("");
      setPaymentMethod("");
      setDate(dayjs());
      setIsRecurring(false);
      setFrequency("monthly");
      setHasInstallments(false);
      setInstallments("2");
      setIsShared(false);
      setSharedWith("");
    }
    setNewFriendName("");
    setShowAddFriend(false);
    setValidationError(null);
  }, [editTransaction, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    
    if (!description || !amount || !category || !paymentMethod || !date) return;

    const installmentsValue = parseInt(installments);
    if (
      hasInstallments &&
      (isNaN(installmentsValue) || installmentsValue < 2)
    ) {
      setValidationError("Installments must be at least 2.");
      return;
    }

    // Validação: se isShared, precisa selecionar um amigo
    if (isShared && !sharedWith) {
      setValidationError("Please select a friend to share with.");
      return;
    }

    onSave(
      {
        description,
        amount: parseFloat(amount),
        type,
        category,
        paymentMethod,
        date: date.format("YYYY-MM-DD"),
        isRecurring,
        frequency: isRecurring ? frequency : undefined,
        installments: hasInstallments ? installmentsValue : undefined,
        currentInstallment: hasInstallments
          ? editTransaction?.currentInstallment || 1
          : undefined,
        isShared,
        sharedWith: isShared ? sharedWith : undefined,
      },
      editTransaction?.id
    );

    onClose();
  };

  const handleAddNewFriend = () => {
    const trimmedName = newFriendName.trim();
    if (trimmedName && !friends.includes(trimmedName)) {
      onAddFriend(trimmedName);
      setSharedWith(trimmedName);
      setNewFriendName("");
      setShowAddFriend(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={isMobile ? SlideTransition : undefined}
      PaperProps={{
        sx: { borderRadius: isMobile ? 0 : 3 },
      }}
    >
      {/* Mobile Header */}
      {isMobile ? (
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Toolbar>
            <IconButton edge="start" onClick={onClose} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
              {editTransaction ? "Edit Transaction" : "New Transaction"}
            </Typography>
            <Button
              type="submit"
              form="transaction-form"
              variant="contained"
              size="small"
            >
              Save
            </Button>
          </Toolbar>
        </AppBar>
      ) : (
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            {editTransaction ? "Edit Transaction" : "New Transaction"}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      )}

      <form id="transaction-form" onSubmit={handleSubmit}>
        <DialogContent
          dividers={!isMobile}
          sx={{ pt: isMobile ? 3 : undefined }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Validation Error Alert */}
            <Collapse in={!!validationError}>
              <Alert 
                severity="error" 
                onClose={() => setValidationError(null)}
                sx={{ mb: 1 }}
              >
                {validationError}
              </Alert>
            </Collapse>

            {/* Type Toggle */}
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, newType) => {
                if (newType) {
                  setType(newType);
                  setCategory("");
                }
              }}
              fullWidth
              sx={{
                "& .MuiToggleButton-root": {
                  py: 1.5,
                  fontWeight: 600,
                },
              }}
            >
              <ToggleButton
                value="income"
                sx={{
                  "&.Mui-selected": {
                    bgcolor: "success.main",
                    color: "white",
                    "&:hover": {
                      bgcolor: "success.dark",
                    },
                  },
                }}
              >
                Income
              </ToggleButton>
              <ToggleButton
                value="expense"
                sx={{
                  "&.Mui-selected": {
                    bgcolor: "error.main",
                    color: "white",
                    "&:hover": {
                      bgcolor: "error.dark",
                    },
                  },
                }}
              >
                Expense
              </ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label="Description"
              required
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Groceries"
            />

            <TextField
              label="Amount (R$)"
              type="number"
              required
              fullWidth
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              inputProps={{ min: 0.01, step: 0.01 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">R$</InputAdornment>
                ),
              }}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={category}
                    label="Category"
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories[type].map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    label="Payment Method"
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method} value={method}>
                        {method}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Date"
                  value={date}
                  onChange={(newValue) => setDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    bgcolor: isRecurring ? "primary.50" : "transparent",
                    borderColor: isRecurring ? "primary.main" : "divider",
                  }}
                  onClick={() => setIsRecurring(!isRecurring)}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <RepeatIcon
                      fontSize="small"
                      color={isRecurring ? "primary" : "action"}
                    />
                    <Typography variant="body2">Recurring?</Typography>
                  </Box>
                  <Switch checked={isRecurring} size="small" />
                </Paper>
              </Grid>
            </Grid>

            {/* Shared Expense Toggle */}
            {type === "expense" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    bgcolor: isShared ? "info.50" : "transparent",
                    borderColor: isShared ? "info.main" : "divider",
                  }}
                  onClick={() => {
                    setIsShared(!isShared);
                    if (isShared) {
                      setSharedWith("");
                    }
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <GroupIcon
                      fontSize="small"
                      color={isShared ? "info" : "action"}
                    />
                    <Box>
                      <Typography variant="body2">Shared? (50/50)</Typography>
                      {isShared && (
                        <Typography variant="caption" color="text.secondary">
                          Split equally with a friend - creates income for reimbursement
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Switch checked={isShared} size="small" color="info" />
                </Paper>

                {/* Friend Selection */}
                {isShared && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select Friend</InputLabel>
                      <Select
                        value={sharedWith}
                        label="Select Friend"
                        onChange={(e) => {
                          if (e.target.value === "__add_new__") {
                            setShowAddFriend(true);
                          } else {
                            setSharedWith(e.target.value);
                          }
                        }}
                      >
                        {friends.length > 0 && (
                          <ListSubheader>Friends</ListSubheader>
                        )}
                        {friends.map((friend) => (
                          <MenuItem key={friend} value={friend}>
                            {friend}
                          </MenuItem>
                        ))}
                        <Divider />
                        <MenuItem value="__add_new__">
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <PersonAddIcon fontSize="small" color="primary" />
                            <Typography color="primary">Add new friend...</Typography>
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>

                    {/* Add New Friend Form */}
                    {showAddFriend && (
                      <Paper
                        variant="outlined"
                        sx={{ p: 2, bgcolor: "action.hover" }}
                      >
                        <Typography variant="subtitle2" gutterBottom>
                          Add New Friend
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <TextField
                            size="small"
                            placeholder="Friend's name"
                            value={newFriendName}
                            onChange={(e) => setNewFriendName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddNewFriend();
                              }
                            }}
                            fullWidth
                            autoFocus
                          />
                          <Button
                            variant="contained"
                            size="small"
                            onClick={handleAddNewFriend}
                            disabled={!newFriendName.trim()}
                          >
                            Add
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setShowAddFriend(false);
                              setNewFriendName("");
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Paper>
                    )}

                    {/* Preview of income that will be created */}
                    {sharedWith && amount && (
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: "success.50",
                          borderColor: "success.main",
                          border: 1,
                        }}
                      >
                        <Typography variant="body2" color="success.dark" fontWeight={500}>
                          Will create income:
                        </Typography>
                        <Typography variant="body2" color="success.dark">
                          "{description || "Transaction"} - {sharedWith}"
                        </Typography>
                        <Typography variant="h6" fontWeight={600} color="success.dark">
                          +{new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(parseFloat(amount) / 2)}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {isRecurring && (
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={frequency}
                  label="Frequency"
                  onChange={(e) =>
                    setFrequency(e.target.value as "monthly" | "yearly")
                  }
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            )}

            {type === "expense" && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      bgcolor: hasInstallments ? "primary.50" : "transparent",
                      borderColor: hasInstallments ? "primary.main" : "divider",
                    }}
                    onClick={() => setHasInstallments(!hasInstallments)}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CreditCardIcon
                        fontSize="small"
                        color={hasInstallments ? "primary" : "action"}
                      />
                      <Typography variant="body2">Split?</Typography>
                    </Box>
                    <Switch checked={hasInstallments} size="small" />
                  </Paper>
                </Grid>
                {hasInstallments && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="# of Installments"
                      type="number"
                      fullWidth
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                      inputProps={{ min: 2, max: 48 }}
                    />
                  </Grid>
                )}
              </Grid>
            )}

            {type === "expense" &&
              hasInstallments &&
              amount &&
              parseInt(installments) >= 2 && (
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "warning.50",
                    borderColor: "warning.main",
                    border: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" color="warning.dark">
                      {installments}x of
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      color="warning.dark"
                    >
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(parseFloat(amount) / parseInt(installments))}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="warning.main">
                    Total:{" "}
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(parseFloat(amount))}
                  </Typography>
                </Paper>
              )}
          </Box>
        </DialogContent>

        {/* Desktop Actions */}
        {!isMobile && (
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="large">
              Save Transaction
            </Button>
          </DialogActions>
        )}
      </form>
    </Dialog>
  );
};

export default TransactionForm;
