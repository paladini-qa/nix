import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Avatar,
  useMediaQuery,
  useTheme,
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
      // Build conversation history for context
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
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <Box sx={{ mb: isMobile ? 2 : 3 }}>
        <Typography
          variant={isMobile ? "h6" : "h5"}
          sx={{
            fontWeight: "bold",
            color: "text.primary",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <SparklesIcon
            color="primary"
            fontSize={isMobile ? "small" : "medium"}
          />
          NixAI
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isMobile
            ? "AI financial assistant"
            : "Your personal AI financial assistant"}
        </Typography>
      </Box>

      {/* Chat Container */}
      <Paper
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: 1,
          borderColor: "divider",
          minHeight: { xs: "calc(100vh - 280px)", lg: "calc(100vh - 200px)" },
        }}
      >
        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 2,
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
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor:
                    message.role === "assistant" ? "primary.main" : "grey.500",
                }}
              >
                {message.role === "assistant" ? (
                  <SparklesIcon fontSize="small" />
                ) : (
                  <PersonIcon fontSize="small" />
                )}
              </Avatar>
              <Paper
                sx={{
                  p: isMobile ? 1.5 : 2,
                  maxWidth: isMobile ? "85%" : "75%",
                  bgcolor:
                    message.role === "user"
                      ? "primary.main"
                      : "background.default",
                  color: message.role === "user" ? "white" : "text.primary",
                  borderRadius: 2,
                  "& p": { m: 0, mb: 1, fontSize: isMobile ? 14 : 16 },
                  "& p:last-child": { mb: 0 },
                  "& ul, & ol": { m: 0, pl: 2.5 },
                  "& li": { mb: 0.5, fontSize: isMobile ? 14 : 16 },
                  "& strong": {
                    fontWeight: 600,
                  },
                }}
              >
                {message.role === "assistant" ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  <Typography variant="body2">{message.content}</Typography>
                )}
              </Paper>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "primary.main",
                }}
              >
                <SparklesIcon fontSize="small" />
              </Avatar>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "background.default",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Thinking...
                </Typography>
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask about your finances..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              color="primary"
              sx={{
                bgcolor: "primary.main",
                color: "white",
                "&:hover": {
                  bgcolor: "primary.dark",
                },
                "&.Mui-disabled": {
                  bgcolor: "action.disabledBackground",
                  color: "action.disabled",
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            Press Enter to send, Shift+Enter for new line
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default NixAIView;
