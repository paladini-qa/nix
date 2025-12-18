import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Chip,
  useMediaQuery,
  useTheme,
  Fade,
  IconButton,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Close as CloseIcon,
  AccountBalanceWallet as WalletIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  AutoAwesome as SparklesIcon,
  ArrowForward as ArrowForwardIcon,
  Celebration as CelebrationIcon,
} from "@mui/icons-material";
import { useLocalStorage } from "../hooks";

interface OnboardingProps {
  userEmail: string;
  displayName: string;
  transactionCount: number;
  onComplete: () => void;
  onCreateTransaction: () => void;
  onNavigate: (view: string) => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: () => void;
  actionLabel?: string;
  isCompleted: boolean;
}

const Onboarding: React.FC<OnboardingProps> = ({
  userEmail,
  displayName,
  transactionCount,
  onComplete,
  onCreateTransaction,
  onNavigate,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const [hasSeenOnboarding, setHasSeenOnboarding] = useLocalStorage(
    `nix_onboarding_${userEmail}`,
    false
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useLocalStorage<string[]>(
    `nix_onboarding_steps_${userEmail}`,
    []
  );

  // Show onboarding for new users
  useEffect(() => {
    if (!hasSeenOnboarding && transactionCount === 0) {
      setIsOpen(true);
    }
  }, [hasSeenOnboarding, transactionCount]);

  const handleComplete = () => {
    setHasSeenOnboarding(true);
    setIsOpen(false);
    onComplete();
  };

  const handleSkip = () => {
    setHasSeenOnboarding(true);
    setIsOpen(false);
  };

  const markStepCompleted = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: "transaction",
      title: "Create your first transaction",
      description: "Start tracking your finances by adding your first income or expense.",
      icon: <WalletIcon />,
      action: () => {
        onCreateTransaction();
        markStepCompleted("transaction");
        handleComplete();
      },
      actionLabel: "Add Transaction",
      isCompleted: transactionCount > 0 || completedSteps.includes("transaction"),
    },
    {
      id: "categories",
      title: "Customize your categories",
      description: "Set up categories that match your spending habits.",
      icon: <CategoryIcon />,
      action: () => {
        onNavigate("settings");
        markStepCompleted("categories");
        handleComplete();
      },
      actionLabel: "Go to Settings",
      isCompleted: completedSteps.includes("categories"),
    },
    {
      id: "goals",
      title: "Set a financial goal",
      description: "Define savings goals to stay motivated and track progress.",
      icon: <TrendingUpIcon />,
      action: () => {
        // Navigate to goals when implemented
        markStepCompleted("goals");
        setActiveStep(activeStep + 1);
      },
      actionLabel: "Learn More",
      isCompleted: completedSteps.includes("goals"),
    },
    {
      id: "ai",
      title: "Meet NixAI",
      description: "Get personalized financial insights powered by AI.",
      icon: <SparklesIcon />,
      action: () => {
        onNavigate("nixai");
        markStepCompleted("ai");
        handleComplete();
      },
      actionLabel: "Try NixAI",
      isCompleted: completedSteps.includes("ai"),
    },
  ];

  const completedCount = steps.filter((s) => s.isCompleted).length;
  const allCompleted = completedCount === steps.length;

  return (
    <Dialog
      open={isOpen}
      onClose={handleSkip}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { borderRadius: isMobile ? 0 : 4 },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Welcome{displayName ? `, ${displayName}` : ""}! 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Let's get you started with Nix
          </Typography>
        </Box>
        <IconButton onClick={handleSkip} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Progress indicator */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Getting Started Progress
            </Typography>
            <Chip
              label={`${completedCount}/${steps.length}`}
              size="small"
              color={allCompleted ? "success" : "primary"}
              variant="outlined"
            />
          </Box>
          <Box
            sx={{
              height: 6,
              bgcolor: "action.hover",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: "100%",
                width: `${(completedCount / steps.length) * 100}%`,
                bgcolor: allCompleted ? "success.main" : "primary.main",
                borderRadius: 3,
                transition: "width 0.3s ease",
              }}
            />
          </Box>
        </Box>

        {allCompleted ? (
          <Fade in>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CelebrationIcon
                sx={{ fontSize: 64, color: "success.main", mb: 2 }}
              />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                You're all set!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                You've completed the getting started guide. Enjoy managing your
                finances with Nix!
              </Typography>
              <Button
                variant="contained"
                onClick={handleComplete}
                endIcon={<ArrowForwardIcon />}
              >
                Start Using Nix
              </Button>
            </Box>
          </Fade>
        ) : (
          <List sx={{ py: 0 }}>
            {steps.map((step, index) => (
              <ListItem
                key={step.id}
                sx={{
                  px: 2,
                  py: 1.5,
                  mb: 1,
                  borderRadius: 2,
                  bgcolor: step.isCompleted
                    ? "success.50"
                    : index === activeStep
                    ? "primary.50"
                    : "transparent",
                  border: 1,
                  borderColor: step.isCompleted
                    ? "success.main"
                    : index === activeStep
                    ? "primary.main"
                    : "divider",
                  cursor: step.isCompleted ? "default" : "pointer",
                  opacity: step.isCompleted ? 0.8 : 1,
                }}
                onClick={() => !step.isCompleted && setActiveStep(index)}
              >
                <ListItemIcon>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: step.isCompleted
                        ? "success.main"
                        : index === activeStep
                        ? "primary.main"
                        : "action.hover",
                      color: step.isCompleted || index === activeStep
                        ? "white"
                        : "text.secondary",
                    }}
                  >
                    {step.isCompleted ? <CheckCircleIcon /> : step.icon}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      sx={{
                        textDecoration: step.isCompleted ? "line-through" : "none",
                        color: step.isCompleted ? "text.secondary" : "text.primary",
                      }}
                    >
                      {step.title}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
                    </Typography>
                  }
                />
                {!step.isCompleted && step.action && index === activeStep && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      step.action?.();
                    }}
                  >
                    {step.actionLabel}
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button onClick={handleSkip} color="inherit">
          Skip for now
        </Button>
        {!allCompleted && (
          <Button
            variant="outlined"
            onClick={() => {
              const currentStep = steps[activeStep];
              if (currentStep.action) {
                currentStep.action();
              }
            }}
          >
            {steps[activeStep]?.actionLabel || "Next"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default Onboarding;

