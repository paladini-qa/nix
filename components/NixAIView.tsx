import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Avatar,
  useMediaQuery,
  useTheme,
  InputAdornment,
} from "@mui/material";
import {
  Send as SendIcon,
  AutoAwesome as SparklesIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import { Transaction } from "../types";
import { chatWithNixAI } from "../services/geminiService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface NixAIViewProps {
  transactions: Transaction[];
}

const NixAIView: React.FC<NixAIViewProps> = ({ transactions }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm **NixAI**, your personal financial assistant. 🤖💰\n\nI have access to all your transactions and can help you with:\n\n- **Analyzing spending patterns**\n- **Providing budget recommendations**\n- **Answering questions about your finances**\n- **Identifying areas to save money**\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await chatWithNixAI(
        inputValue.trim(),
        transactions,
        conversationHistory
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: isMobile ? "calc(100vh - 180px)" : "calc(100vh - 64px)",
        position: "relative",
        mx: isMobile ? -2 : -4,
        mt: isMobile ? -2 : -4,
      }}
    >
      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: isMobile ? 2 : 4,
          pt: isMobile ? 2 : 4,
          pb: 12,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: "flex",
              gap: 1.5,
              flexDirection: message.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-start",
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor:
                  message.role === "assistant" ? "primary.main" : "grey.600",
                flexShrink: 0,
              }}
            >
              {message.role === "assistant" ? (
                <SparklesIcon sx={{ fontSize: 18 }} />
              ) : (
                <PersonIcon sx={{ fontSize: 18 }} />
              )}
            </Avatar>
            <Box
              sx={{
                maxWidth: isMobile ? "80%" : "70%",
                p: isMobile ? 1.5 : 2,
                borderRadius: 3,
                bgcolor:
                  message.role === "user"
                    ? "primary.main"
                    : (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.04)",
                color: message.role === "user" ? "white" : "text.primary",
                "& p": {
                  m: 0,
                  mb: 1,
                  fontSize: isMobile ? 14 : 15,
                  lineHeight: 1.6,
                },
                "& p:last-child": { mb: 0 },
                "& ul, & ol": { m: 0, pl: 2.5, mb: 1 },
                "& ul:last-child, & ol:last-child": { mb: 0 },
                "& li": { mb: 0.5, fontSize: isMobile ? 14 : 15 },
                "& strong": { fontWeight: 600 },
                "& code": {
                  bgcolor:
                    message.role === "user"
                      ? "rgba(255,255,255,0.2)"
                      : "action.hover",
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1,
                  fontSize: 13,
                },
              }}
            >
              {message.role === "assistant" ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                <Typography sx={{ fontSize: isMobile ? 14 : 15 }}>
                  {message.content}
                </Typography>
              )}
            </Box>
          </Box>
        ))}

        {isLoading && (
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              alignItems: "flex-start",
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "primary.main",
                flexShrink: 0,
              }}
            >
              <SparklesIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <CircularProgress size={16} color="primary" />
              <Typography variant="body2" color="text.secondary">
                Thinking...
              </Typography>
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Gradient overlay for blur effect */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(to top, rgba(15, 23, 42, 1) 0%, rgba(15, 23, 42, 0.95) 40%, rgba(15, 23, 42, 0) 100%)"
              : "linear-gradient(to top, rgba(248, 250, 252, 1) 0%, rgba(248, 250, 252, 0.95) 40%, rgba(248, 250, 252, 0) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Input Area */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          px: isMobile ? 2 : 4,
          pb: isMobile ? 2 : 3,
          pt: 2,
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            maxWidth: 800,
            mx: "auto",
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Ask about your finances..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    color="primary"
                    sx={{
                      bgcolor: inputValue.trim() ? "primary.main" : "transparent",
                      color: inputValue.trim() ? "white" : "text.disabled",
                      "&:hover": {
                        bgcolor: inputValue.trim() ? "primary.dark" : "transparent",
                      },
                      "&.Mui-disabled": {
                        bgcolor: "transparent",
                        color: "text.disabled",
                      },
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 3,
                bgcolor: "background.paper",
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 4px 20px rgba(0,0,0,0.4)"
                    : "0 4px 20px rgba(0,0,0,0.1)",
                "& fieldset": {
                  borderColor: "divider",
                },
                "&:hover fieldset": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                },
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default NixAIView;

