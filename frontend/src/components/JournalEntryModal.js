import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useEffect, useState } from "react";

// Icons
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TagIcon from "@mui/icons-material/Tag";
import TimerIcon from "@mui/icons-material/Timer";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

// Services & Utils
import { fetchBrokerPositions, fetchBrokerSummary } from "../services/brokerClient";
import { deleteJournalEntry, updateJournalEntry } from "../services/journalClient";
import { getCurrencySymbol } from "../utils/accountUtils";
import { formatDate, getEntryTitle, isValidDate } from "../utils/journalUtils";
import { formatTimeframesForDisplay, normalizeTimeframes, stringifyTimeframes } from "../utils/timeframeUtils";
import EditEntryForm from "./EditEntryForm";

// --- Sub-Components ---

// Un petit composant pour les lignes de détails (Account, Symbol...)
const DataRow = ({ icon, label, value, highlight = false }) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1.2, borderBottom: '1px dashed', borderColor: 'divider' }}>
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ color: 'text.secondary' }}>
      {icon}
      <Typography variant="caption" fontWeight={600} sx={{ letterSpacing: '0.05em' }}>{label.toUpperCase()}</Typography>
    </Stack>
    <Typography variant="body2" fontWeight={highlight ? 700 : 500} color={highlight ? 'text.primary' : 'text.secondary'}>
      {value || "-"}
    </Typography>
  </Stack>
);

// --- Main Component ---

const JournalEntryModal = ({ entry, open, onClose, onUpdate, onDelete }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isDark = theme.palette.mode === "dark";

  // States
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mutationState, setMutationState] = useState({ loading: false, error: "" });
  const [previewImageSrc, setPreviewImageSrc] = useState(null);
  
  // Data
  const [accountOptions, setAccountOptions] = useState([]);
  const [brokerTrades, setBrokerTrades] = useState([]);

  // Init Data
  useEffect(() => {
    if (entry) {
      const safeMetadata = entry.metadata || {};
      const displayDate = safeMetadata.date || entry.createdAt;
      
      const toInputDate = (d) => {
          try {
              const date = new Date(d);
              if (!isValidDate(date)) return "";
              const offset = date.getTimezoneOffset() * 60000;
              return new Date(date.getTime() - offset).toISOString().slice(0, 16);
          } catch { return ""; }
      };

      setEditedEntry({
        ...JSON.parse(JSON.stringify(entry)),
        metadata: {
          ...safeMetadata,
          timeframe: normalizeTimeframes(safeMetadata.timeframe),
          date: toInputDate(displayDate)
        },
      });
    } else {
      setEditedEntry(null);
    }
  }, [entry]);

  // Load Broker Data (for Edit Mode)
  useEffect(() => {
    let isMounted = true;
    if (open) {
      const load = async () => {
        try {
          const [summary, positions] = await Promise.all([fetchBrokerSummary(), fetchBrokerPositions()]);
          if (isMounted) {
            setAccountOptions(summary.accounts || []);
            setBrokerTrades(positions || []);
          }
        } catch (e) { console.error(e); }
      };
      load();
    }
    return () => { isMounted = false; };
  }, [open]);

  // Actions
  const handleClose = () => { setIsEditing(false); setMutationState({ loading: false, error: "" }); onClose(); };

  const handleUpdate = async () => {
    if (!editedEntry) return;
    setMutationState({ loading: true, error: "" });
    try {
      const localDate = new Date(editedEntry.metadata.date);
      const isoDate = isValidDate(localDate) ? localDate.toISOString() : new Date().toISOString();
      const entryToSave = {
        ...editedEntry,
        metadata: {
          ...editedEntry.metadata,
          timeframe: stringifyTimeframes(editedEntry.metadata.timeframe),
          date: isoDate,
        },
      };
      const updated = await updateJournalEntry(entryToSave);
      onUpdate(updated);
      setIsEditing(false);
      setMutationState({ loading: false, error: "" });
    } catch (err) { setMutationState({ loading: false, error: err.message }); }
  };

  const handleDelete = async () => {
    setMutationState({ loading: true, error: "" });
    try {
      await deleteJournalEntry(entry.id);
      onDelete(entry.id);
      setShowDeleteConfirm(false);
      handleClose();
    } catch (err) { setMutationState({ loading: false, error: err.message }); }
  };

  const handleImageDelete = (idx) => {
    setEditedEntry(prev => ({ ...prev, metadata: { ...prev.metadata, images: (prev.metadata.images || []).filter((_, i) => i !== idx) } }));
  };
  
  const handlePaste = (e) => {
    if (!isEditing) return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (ev) => setEditedEntry(p => ({ ...p, metadata: { ...p.metadata, images: [...(p.metadata.images || []), { src: ev.target.result }] } }));
        reader.readAsDataURL(file);
        e.preventDefault();
        break;
      }
    }
  };

  if (!entry) return null;
  const displayEntry = isEditing ? editedEntry : entry;
  if (!displayEntry) return null;

  // READ VIEW VARS
  const meta = displayEntry.metadata || {};
  const isTrade = displayEntry.type === 'trade';
  const pnlVal = Number(meta.pnlAmount);
  const isWin = pnlVal > 0;
  const isLoss = pnlVal < 0;
  const pnlColor = isWin ? theme.palette.success.main : isLoss ? theme.palette.error.main : theme.palette.text.primary;
  
  // Design "Split View" Logic
  const images = meta.images || [];

  return (
    <>
      <Dialog 
        fullWidth 
        maxWidth="xl" // Large pour bien profiter du split view
        open={open} 
        onClose={handleClose}
        fullScreen={fullScreen}
        onPaste={handlePaste}
        PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3, bgcolor: theme.palette.background.paper, overflow: "hidden" } }}
      >
        {/* === HEADER (Commun) === */}
        <DialogTitle sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.default, 0.5)
        }}>
            <Stack direction="row" alignItems="center" spacing={2}>
                 {/* Type Badge */}
                 <Chip 
                    label={meta.direction || displayEntry.type.toUpperCase()} 
                    size="small" 
                    sx={{ 
                       fontWeight: 800, 
                       borderRadius: 1,
                       bgcolor: meta.direction === 'LONG' ? alpha(theme.palette.success.main, 0.1) : meta.direction === 'SHORT' ? alpha(theme.palette.error.main, 0.1) : 'action.selected',
                       color: meta.direction === 'LONG' ? 'success.main' : meta.direction === 'SHORT' ? 'error.main' : 'text.primary'
                    }} 
                 />
                 <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                    {getEntryTitle(displayEntry)}
                 </Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
                {!isEditing && (
                    <>
                    <IconButton size="small" onClick={() => setIsEditing(true)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setShowDeleteConfirm(true)} color="error"><DeleteOutlineIcon fontSize="small" /></IconButton>
                    </>
                )}
                <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
            </Stack>
        </DialogTitle>


        {/* =========================================================
            CONTENT
           ========================================================= */}
        {isEditing ? (
             <DialogContent sx={{ p: 0 }}>
               <Box sx={{ p: 3 }}>
                  <EditEntryForm 
                    entry={editedEntry}
                    accountOptions={accountOptions}
                    brokerTrades={brokerTrades}
                    onDataChange={setEditedEntry}
                    onImageDelete={handleImageDelete}
                  />
               </Box>
               <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Button onClick={() => setIsEditing(false)} color="inherit">Annuler</Button>
                  <Button onClick={handleUpdate} variant="contained" disabled={mutationState.loading}>
                    {mutationState.loading ? "Sauvegarde..." : "Enregistrer"}
                  </Button>
               </DialogActions>
             </DialogContent>
        ) : (
          <DialogContent sx={{ p: 0, height: '100%' }}>
            <Grid container sx={{ height: '100%' }}>
                
                {/* === LEFT PANEL: NARRATIVE (65%) === */}
                <Grid item xs={12} md={8} sx={{ p: 4, overflowY: 'auto', borderRight: { md: `1px solid ${theme.palette.divider}` } }}>
                    
                    {/* Meta Header */}
                    <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
                         <Chip 
                            icon={<CalendarTodayIcon sx={{ fontSize: '14px !important' }} />}
                            label={formatDate(meta.date || displayEntry.createdAt)} 
                            size="small" 
                            variant="outlined"
                         />
                         {meta.tags && meta.tags.map(tag => (
                            <Chip key={tag} icon={<TagIcon sx={{ fontSize: '14px !important' }} />} label={tag} size="small" variant="outlined" />
                         ))}
                    </Stack>
                    
                    {/* The Content */}
                    <Typography 
                        variant="body1" 
                        sx={{ 
                            whiteSpace: 'pre-wrap', 
                            lineHeight: 1.8, 
                            fontSize: '1rem',
                            color: 'text.primary',
                            fontFamily: theme.typography.fontFamily
                        }}
                    >
                        {displayEntry.content || "Aucune analyse rédigée."}
                    </Typography>

                </Grid>


                {/* === RIGHT PANEL: FACTS & DATA (35%) === */}
                <Grid item xs={12} md={4} sx={{ bgcolor: alpha(theme.palette.background.default, 0.4), display: 'flex', flexDirection: 'column' }}>
                    
                    {/* 1. FINANCIAL CARD (Top) */}
                    {isTrade && (
                        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                            <Paper 
                                elevation={0}
                                sx={{ 
                                    p: 2.5, 
                                    borderRadius: 3, 
                                    background: isWin 
                                        ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)` 
                                        : isLoss
                                            ? `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`
                                            : theme.palette.action.disabledBackground,
                                    color: 'white',
                                    boxShadow: theme.shadows[4],
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Decorative Icon BG */}
                                <Box sx={{ position: 'absolute', right: -10, top: -10, opacity: 0.2, transform: 'rotate(-10deg)' }}>
                                    {isWin ? <TrendingUpIcon sx={{ fontSize: 100 }} /> : <TrendingDownIcon sx={{ fontSize: 100 }} />}
                                </Box>

                                <Typography variant="caption" fontWeight={600} sx={{ opacity: 0.9 }}>RÉSULTAT NET</Typography>
                                <Stack direction="row" alignItems="baseline" spacing={1}>
                                    <Typography variant="h4" fontWeight={800}>
                                        {pnlVal >= 0 ? "+" : ""}{pnlVal} {getCurrencySymbol(meta.pnlCurrency)}
                                    </Typography>
                                </Stack>
                                {meta.pnlPercent && (
                                    <Typography variant="body2" fontWeight={600} sx={{ opacity: 0.9, mt: 0.5 }}>
                                        {meta.pnlPercent}% du capital
                                    </Typography>
                                )}
                            </Paper>

                            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                <Paper sx={{ flex: 1, p: 1, textAlign: 'center', bgcolor: 'background.paper' }}>
                                    <Typography variant="caption" color="text.secondary">R:R</Typography>
                                    <Typography variant="subtitle1" fontWeight={700}>{meta.rr || "-"}</Typography>
                                </Paper>
                                <Paper sx={{ flex: 1, p: 1, textAlign: 'center', bgcolor: 'background.paper' }}>
                                    <Typography variant="caption" color="text.secondary">LOTS</Typography>
                                    <Typography variant="subtitle1" fontWeight={700}>{meta.lotSize || "-"}</Typography>
                                </Paper>
                            </Stack>
                        </Box>
                    )}

                    {/* 2. TECHNICAL SPECS (List) */}
                    <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
                        <Typography variant="overline" color="text.secondary" fontWeight={800}>DÉTAILS TECHNIQUES</Typography>
                        
                        <Stack spacing={0.5} sx={{ mt: 1, mb: 3 }}>
                            <DataRow icon={<ShowChartIcon fontSize="small" />} label="Symbole" value={meta.symbol} highlight />
                            <DataRow icon={<TimerIcon fontSize="small" />} label="Timeframe" value={formatTimeframesForDisplay(meta.timeframe)} />
                            <DataRow icon={<InsertLinkIcon fontSize="small" />} label="Setup" value={meta.setup} />
                            <DataRow icon={<AccountBalanceIcon fontSize="small" />} label="Compte" value={meta.accountName} />
                        </Stack>
                        
                        {(meta.entryPrice || meta.exitPrice) && (
                            <>
                                <Typography variant="overline" color="text.secondary" fontWeight={800}>EXÉCUTION</Typography>
                                <Stack spacing={0.5} sx={{ mt: 1 }}>
                                    <DataRow icon={<Typography variant="caption" fontWeight={900} sx={{ width: 20, textAlign: 'center' }}>IN</Typography>} label="Entrée" value={meta.entryPrice} />
                                    <DataRow icon={<Typography variant="caption" fontWeight={900} sx={{ width: 20, textAlign: 'center' }}>OUT</Typography>} label="Sortie" value={meta.exitPrice} />
                                </Stack>
                            </>
                        )}
                        
                        {/* 3. MEDIA GALLERY (Bottom of Sidebar) */}
                        {images.length > 0 && (
                             <Box sx={{ mt: 4 }}>
                                <Typography variant="overline" color="text.secondary" fontWeight={800} sx={{ mb: 1, display: 'block' }}>
                                    PREUVES VISUELLES ({images.length})
                                </Typography>
                                <Grid container spacing={1}>
                                    {images.map((img, idx) => (
                                        <Grid item xs={6} key={idx}>
                                            <Box 
                                                component="img" 
                                                src={img.src} 
                                                onClick={() => setPreviewImageSrc(img.src)}
                                                sx={{ 
                                                    width: '100%', 
                                                    aspectRatio: '16/9', 
                                                    objectFit: 'cover', 
                                                    borderRadius: 2, 
                                                    cursor: 'zoom-in',
                                                    border: `1px solid ${theme.palette.divider}`,
                                                    transition: 'transform 0.2s',
                                                    '&:hover': { transform: 'scale(1.02)' }
                                                }} 
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                             </Box>
                        )}
                    </Box>

                </Grid>
            </Grid>
          </DialogContent>
        )}
      </Dialog>

      {/* --- CONFIRMATION DELETE --- */}
      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>Supprimer cette entrée ?</DialogTitle>
        <DialogContent>
          <Typography>Cette action est irréversible. Êtes-vous sûr ?</Typography>
          {mutationState.error && <Alert severity="error" sx={{ mt: 2 }}>{mutationState.error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Supprimer</Button>
        </DialogActions>
      </Dialog>

      {/* --- IMAGE PREVIEW MODAL --- */}
      <Dialog 
         open={!!previewImageSrc} 
         onClose={() => setPreviewImageSrc(null)}
         maxWidth="xl"
         PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}
      >
         <Box 
            component="img" 
            src={previewImageSrc} 
            onClick={() => setPreviewImageSrc(null)}
            sx={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', cursor: 'zoom-out' }} 
         />
      </Dialog>
    </>
  );
};

export default JournalEntryModal;