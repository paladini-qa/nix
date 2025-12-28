import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  useMediaQuery,
  useTheme,
  Tooltip,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as TagIcon,
} from "@mui/icons-material";
import { Tag, TagWithCount } from "../types";
import { tagService } from "../services/api";
import { useNotification, useConfirmDialog } from "../contexts";

interface TagsManagerProps {
  userId: string;
}

const TAG_COLORS = [
  "#6366f1", "#ec4899", "#10b981", "#f59e0b",
  "#8b5cf6", "#06b6d4", "#ef4444", "#84cc16",
  "#14b8a6", "#f97316", "#a855f7", "#22c55e",
];

const TagsManager: React.FC<TagsManagerProps> = ({ userId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showSuccess, showError } = useNotification();
  const { confirmDelete } = useConfirmDialog();

  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(TAG_COLORS[0]);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const data = await tagService.getAllWithCount();
      setTags(data);
    } catch (err) {
      console.error("Error fetching tags:", err);
      showError("Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setFormName(tag.name);
      setFormColor(tag.color);
    } else {
      setEditingTag(null);
      setFormName("");
      setFormColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTag(null);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;

    try {
      if (editingTag) {
        await tagService.update(editingTag.id, {
          name: formName.trim(),
          color: formColor,
        });
        showSuccess("Tag updated");
      } else {
        await tagService.create(userId, {
          name: formName.trim(),
          color: formColor,
        });
        showSuccess("Tag created");
      }
      handleCloseForm();
      fetchTags();
    } catch (err: any) {
      console.error("Error saving tag:", err);
      if (err.code === "23505") {
        showError("A tag with this name already exists");
      } else {
        showError(err.message || "Failed to save tag");
      }
    }
  };

  const handleDelete = async (tag: TagWithCount) => {
    const message = tag.transactionCount > 0
      ? `This tag is used in ${tag.transactionCount} transaction(s). Delete anyway?`
      : `Delete tag "${tag.name}"?`;
    
    const confirmed = await confirmDelete(tag.name);
    if (!confirmed) return;

    try {
      await tagService.delete(tag.id);
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
      showSuccess("Tag deleted");
    } catch (err) {
      console.error("Error deleting tag:", err);
      showError("Failed to delete tag");
    }
  };

  return (
    <Paper sx={{ p: isMobile ? 2 : 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <TagIcon color="primary" />
          <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={600}>
            Tags
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
        >
          New Tag
        </Button>
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading tags...</Typography>
      ) : tags.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <TagIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No tags yet. Create tags to organize your transactions.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {tags.map((tag) => (
            <Chip
              key={tag.id}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {tag.name}
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ opacity: 0.7, ml: 0.5 }}
                  >
                    ({tag.transactionCount})
                  </Typography>
                </Box>
              }
              sx={{
                bgcolor: tag.color,
                color: "white",
                fontWeight: 500,
                "& .MuiChip-deleteIcon": {
                  color: "rgba(255,255,255,0.7)",
                  "&:hover": {
                    color: "white",
                  },
                },
              }}
              onClick={() => handleOpenForm(tag)}
              onDelete={() => handleDelete(tag)}
            />
          ))}
        </Box>
      )}

      {/* Form Dialog */}
      <Dialog
        open={isFormOpen}
        onClose={handleCloseForm}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "20px" } }}
      >
        <DialogTitle>{editingTag ? "Edit Tag" : "New Tag"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            <TextField
              label="Tag Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g., Urgent, Personal"
              fullWidth
              required
              autoFocus
            />

            {/* Color Picker */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                Color
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {TAG_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setFormColor(color)}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      bgcolor: color,
                      cursor: "pointer",
                      border: formColor === color ? 3 : 0,
                      borderColor: "common.white",
                      outline: formColor === color ? `2px solid ${color}` : "none",
                      transition: "transform 0.2s",
                      "&:hover": { transform: "scale(1.15)" },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Preview */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                Preview
              </Typography>
              <Chip
                label={formName || "Tag Name"}
                sx={{
                  bgcolor: formColor,
                  color: "white",
                  fontWeight: 500,
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={handleCloseForm} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!formName.trim()}>
            {editingTag ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TagsManager;





