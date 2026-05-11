import React, { useState, useRef } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Grid,
  alpha,
  useTheme,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  ImageNotSupported as NoImageIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import {
  searchImages,
  isImageSearchConfigured,
  ImageSearchResult,
} from "../../services/imageSearchService";

interface PaymentMethodImagePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  methodName?: string;
  currentUrl?: string;
}

const PaymentMethodImagePicker: React.FC<PaymentMethodImagePickerProps> = ({
  open,
  onClose,
  onSelect,
  methodName = "",
  currentUrl,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [tab, setTab] = useState<0 | 1>(isImageSearchConfigured() ? 0 : 1);
  const [query, setQuery] = useState(methodName);
  const [results, setResults] = useState<ImageSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(currentUrl ?? null);
  const [directUrl, setDirectUrl] = useState(currentUrl ?? "");
  const [previewError, setPreviewError] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const imgs = await searchImages(query.trim());
      setResults(imgs);
      if (imgs.length === 0) setError("Nenhuma imagem encontrada. Tente outro termo.");
    } catch (e: any) {
      setError(e.message ?? "Erro ao buscar imagens.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    const url = tab === 0 ? selected : directUrl.trim();
    if (url) onSelect(url);
    onClose();
  };

  const handleRemove = () => {
    onSelect("");
    onClose();
  };

  const canConfirm = tab === 0 ? Boolean(selected) : Boolean(directUrl.trim());

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: "20px", maxHeight: "90vh" } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Imagem do método de pagamento
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2, "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}
        >
          {isImageSearchConfigured() && (
            <Tab label="Buscar no Google Images" value={0} />
          )}
          <Tab label="Inserir URL direta" value={1} />
        </Tabs>

        {/* ── SEARCH TAB ── */}
        {tab === 0 && isImageSearchConfigured() && (
          <Box>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={`Ex: "${methodName || "Nubank"} logo"`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                inputRef={inputRef}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                sx={{ borderRadius: "10px", px: 3, textTransform: "none", whiteSpace: "nowrap" }}
              >
                {loading ? <CircularProgress size={18} color="inherit" /> : "Buscar"}
              </Button>
            </Box>

            {error && (
              <Typography color="error" sx={{ fontSize: 13, mb: 1.5 }}>
                {error}
              </Typography>
            )}

            {results.length > 0 && (
              <Grid container spacing={1.5} sx={{ maxHeight: 380, overflowY: "auto", pr: 0.5 }}>
                {results.map((img, i) => {
                  const isSelected = selected === img.url;
                  return (
                    <Grid key={i} size={{ xs: 6, sm: 4, md: 3 }}>
                      <Box
                        onClick={() => setSelected(isSelected ? null : img.url)}
                        sx={{
                          position: "relative",
                          borderRadius: "12px",
                          overflow: "hidden",
                          cursor: "pointer",
                          border: `2px solid ${isSelected ? theme.palette.primary.main : "transparent"}`,
                          transition: "all 0.15s ease",
                          "&:hover": { border: `2px solid ${alpha(theme.palette.primary.main, 0.5)}` },
                          aspectRatio: "1",
                          bgcolor: isDark ? alpha("#fff", 0.04) : alpha("#000", 0.04),
                        }}
                      >
                        <Box
                          component="img"
                          src={img.thumbnailUrl}
                          alt={img.title}
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        {isSelected && (
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              bgcolor: alpha(theme.palette.primary.main, 0.2),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CheckCircleIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                          </Box>
                        )}
                        <Tooltip title={img.source} placement="bottom">
                          <Typography
                            sx={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              bgcolor: alpha("#000", 0.55),
                              color: "#fff",
                              fontSize: 10,
                              px: 0.75,
                              py: 0.25,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {img.source}
                          </Typography>
                        </Tooltip>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {!loading && results.length === 0 && !error && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  py: 6,
                  color: "text.disabled",
                  gap: 1,
                }}
              >
                <SearchIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                <Typography sx={{ fontSize: 13 }}>
                  Busque pelo nome do banco ou bandeira para encontrar o logo
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* ── URL TAB ── */}
        {tab === 1 && (
          <Box>
            {!isImageSearchConfigured() && (
              <Box
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: "12px",
                  bgcolor: isDark ? alpha(theme.palette.warning.main, 0.08) : alpha(theme.palette.warning.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                }}
              >
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "warning.main", mb: 0.5 }}>
                  Busca via Google não configurada
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  Defina <code>VITE_GOOGLE_CSE_API_KEY</code> e <code>VITE_GOOGLE_CSE_CX</code> no{" "}
                  <code>.env</code> para habilitar a busca. Por enquanto, cole a URL da imagem abaixo.
                </Typography>
              </Box>
            )}

            <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1.5 }}>
              Abra o Google Images, clique com botão direito na imagem desejada → "Copiar endereço da imagem" e cole abaixo.
            </Typography>

            <TextField
              fullWidth
              size="small"
              placeholder="https://..."
              value={directUrl}
              onChange={(e) => { setDirectUrl(e.target.value); setPreviewError(false); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />

            {directUrl.trim() && (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: "16px",
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: isDark ? alpha("#fff", 0.04) : alpha("#000", 0.02),
                  }}
                >
                  {previewError ? (
                    <NoImageIcon sx={{ fontSize: 36, color: "text.disabled" }} />
                  ) : (
                    <Box
                      component="img"
                      src={directUrl.trim()}
                      alt="preview"
                      sx={{ width: "100%", height: "100%", objectFit: "contain" }}
                      onError={() => setPreviewError(true)}
                    />
                  )}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        {currentUrl && (
          <Button
            color="error"
            onClick={handleRemove}
            sx={{ borderRadius: "10px", textTransform: "none", mr: "auto" }}
          >
            Remover imagem
          </Button>
        )}
        <Button onClick={onClose} sx={{ borderRadius: "10px", textTransform: "none" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!canConfirm}
          sx={{ borderRadius: "10px", textTransform: "none" }}
        >
          Usar esta imagem
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentMethodImagePicker;
