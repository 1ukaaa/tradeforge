// frontend/src/components/ShareDialog.js
import {
  alpha,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import {
  createShareLink,
  deleteShareLink,
  fetchShareLinks,
} from "../services/shareClient";

// Icons
import AddLinkIcon from "@mui/icons-material/AddLink";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const ShareDialog = ({ open, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [createError, setCreateError] = useState("");

  // Newly created link (to show the URL once)
  const [justCreated, setJustCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchShareLinks();
      setLinks(data);
    } catch (err) {
      console.error("Erreur chargement liens:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadLinks();
      setShowCreateForm(false);
      setJustCreated(null);
      setCopied(false);
    }
  }, [open, loadLinks]);

  const handleCreate = async () => {
    if (!newPin || newPin.length < 4) {
      setCreateError("Le PIN doit faire au moins 4 caractères.");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const link = await createShareLink({
        pin: newPin,
        label: newLabel || "Mon Journal",
      });
      setJustCreated(link);
      setShowCreateForm(false);
      setNewPin("");
      setNewLabel("");
      loadLinks();
    } catch (err) {
      setCreateError(err.message || "Erreur lors de la création.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteShareLink(id);
      loadLinks();
      if (justCreated && links.find((l) => l.id === id)) {
        setJustCreated(null);
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  const getShareUrl = (token) => {
    return `${window.location.origin}/shared/${token}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const activeLinks = links.filter((l) => l.is_active);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          backgroundImage: "none",
          bgcolor: "background.paper",
          boxShadow: theme.shadows[12],
        },
      }}
    >
      <DialogTitle
        sx={{
          pt: 4,
          px: 4,
          pb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            bgcolor: isDark
              ? alpha(theme.palette.primary.main, 0.12)
              : alpha(theme.palette.primary.main, 0.08),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LinkIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700} letterSpacing="-0.02em">
            Partager le Journal
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Créez un lien protégé par PIN pour partager en lecture seule
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 4, pb: 2 }}>
        {/* Just Created Banner */}
        {justCreated && (
          <Alert
            severity="success"
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Tooltip title={copied ? "Copié !" : "Copier le lien"}>
                <IconButton
                  color="inherit"
                  size="small"
                  onClick={() => copyToClipboard(getShareUrl(justCreated.token))}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            }
          >
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Lien créé avec succès !
            </Typography>
            <Typography
              variant="caption"
              sx={{
                wordBreak: "break-all",
                fontFamily: "monospace",
                fontSize: "0.78rem",
              }}
            >
              {getShareUrl(justCreated.token)}
            </Typography>
          </Alert>
        )}

        {/* Create form */}
        {showCreateForm ? (
          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark
                ? alpha("#fff", 0.02)
                : alpha("#000", 0.01),
              mb: 3,
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={700}
              mb={2}
              color="text.primary"
            >
              Nouveau lien de partage
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Nom du lien"
                placeholder="ex: Mon Journal Trading"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
              />
              <TextField
                fullWidth
                label="Code PIN (4+ caractères)"
                type={showPin ? "text" : "password"}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                size="small"
                inputProps={{ maxLength: 20, autoComplete: "new-password" }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPin(!showPin)}
                        edge="end"
                      >
                        {showPin ? (
                          <VisibilityOffIcon fontSize="small" />
                        ) : (
                          <VisibilityIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
              />
              {createError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {createError}
                </Alert>
              )}
              <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewPin("");
                    setNewLabel("");
                    setCreateError("");
                  }}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Annuler
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  disabled={creating || newPin.length < 4}
                  disableElevation
                  onClick={handleCreate}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    bgcolor: "text.primary",
                    color: "background.paper",
                    "&:hover": { bgcolor: "text.secondary" },
                  }}
                >
                  {creating ? (
                    <CircularProgress size={18} sx={{ color: "inherit" }} />
                  ) : (
                    "Créer"
                  )}
                </Button>
              </Stack>
            </Stack>
          </Box>
        ) : (
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddLinkIcon />}
            onClick={() => setShowCreateForm(true)}
            sx={{
              mb: 3,
              py: 1.5,
              borderRadius: 2.5,
              borderStyle: "dashed",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              borderColor: "divider",
              color: "text.secondary",
              "&:hover": {
                borderColor: "text.primary",
                bgcolor: isDark
                  ? alpha("#fff", 0.03)
                  : alpha("#000", 0.02),
              },
            }}
          >
            Créer un nouveau lien
          </Button>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Existing links */}
        <Typography
          variant="caption"
          fontWeight={600}
          color="text.secondary"
          textTransform="uppercase"
          letterSpacing={1}
        >
          Liens existants ({activeLinks.length})
        </Typography>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 4,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : activeLinks.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <LinkOffIcon
              sx={{ fontSize: 32, color: "text.disabled", mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              Aucun lien de partage actif
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {activeLinks.map((link) => (
              <Box
                key={link.id}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: isDark
                    ? alpha("#fff", 0.02)
                    : alpha("#000", 0.01),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "background-color 0.15s",
                  "&:hover": {
                    bgcolor: isDark
                      ? alpha("#fff", 0.04)
                      : alpha("#000", 0.02),
                  },
                }}
              >
                <Stack spacing={0.5}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="text.primary"
                    >
                      {link.label || "Sans nom"}
                    </Typography>
                    <Chip
                      label="Actif"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        bgcolor: alpha(theme.palette.success.main, 0.12),
                        color: "success.main",
                      }}
                    />
                  </Stack>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ fontFamily: "monospace", fontSize: "0.72rem" }}
                  >
                    {getShareUrl(link.token).replace(
                      window.location.origin,
                      "..."
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Créé le{" "}
                    {new Date(link.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {link.last_accessed_at &&
                      ` · Accédé le ${new Date(
                        link.last_accessed_at
                      ).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}`}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title={copied ? "Copié !" : "Copier le lien"}>
                    <IconButton
                      size="small"
                      onClick={() =>
                        copyToClipboard(getShareUrl(link.token))
                      }
                      sx={{ color: "text.secondary" }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(link.id)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 4, pt: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ fontWeight: 600, textTransform: "none" }}
        >
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;
