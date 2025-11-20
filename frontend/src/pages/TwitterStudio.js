import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BatteryFullIcon from "@mui/icons-material/BatteryFull";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from '@mui/icons-material/Edit';
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import IosShareIcon from "@mui/icons-material/IosShare";
import RepeatIcon from "@mui/icons-material/Repeat";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SaveIcon from "@mui/icons-material/Save";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import VerifiedIcon from '@mui/icons-material/Verified';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WifiIcon from "@mui/icons-material/Wifi";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fade,
  Grid,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchIntegrations } from "../services/integrationsClient";
import { fetchJournalEntries } from "../services/journalClient";
import {
  createTwitterDraft,
  deleteTwitterDraft,
  fetchTwitterDrafts,
  generateTwitterFromEntry,
  publishTwitterDraft,
  updateTwitterDraft,
} from "../services/twitterClient";

// --- CONFIGURATION ---
const VIBES = [
  { value: "tweet.simple", label: "Synthèse", icon: "📝" },
  { value: "thread.analysis", label: "Analyse", icon: "🧠" },
  { value: "thread.annonce", label: "Hype", icon: "🔥" },
];

const DEFAULT_TWEET = () => ({ id: `tweet-${Date.now()}`, text: "", media: [] });

// --- UTILS ---
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const mapEntryImagesToAttachments = (entry) => {
  if (!entry?.metadata?.images) return [];
  return entry.metadata.images.filter(i => i?.src).map((img, idx) => ({
      id: img.id || `entry-${entry.id}-${idx}-${Date.now()}`,
      src: img.src,
      caption: img.caption || entry.metadata?.title
  }));
};

const hydrateDraft = (draft) => {
  if (!draft) return draft;
  const cloned = JSON.parse(JSON.stringify(draft));
  const tweets = Array.isArray(cloned?.payload?.tweets)
    ? cloned.payload.tweets.map(t => ({ ...t, media: t.media || [] }))
    : [DEFAULT_TWEET()];
  return { ...cloned, payload: { ...cloned.payload, tweets } };
};

// --- COMPOSANT : PHONE PREVIEW ---
const PhonePreview = ({ tweets, integrationInfo, theme }) => {
  const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const bgPhone = theme.palette.mode === 'dark' ? '#000000' : '#FFFFFF';
  const textPhone = theme.palette.mode === 'dark' ? '#E7E9EA' : '#0F1419';
  const borderPhone = theme.palette.mode === 'dark' ? '#2F3336' : '#EFF3F4';
  const secondaryTextPhone = theme.palette.mode === 'dark' ? '#71767B' : '#536471';

  return (
    <Box sx={{
        height: '100%', maxHeight: '820px', aspectRatio: '9/19.5', width: 'auto', maxWidth: '400px',
        borderRadius: '44px', border: `8px solid ${theme.palette.mode === 'dark' ? '#2a2a2a' : '#111'}`,
        backgroundColor: bgPhone, position: 'relative', overflow: 'hidden',
        boxShadow: theme.palette.mode === 'dark' ? '0px 0px 50px -10px rgba(0,0,0,0.8)' : '0px 20px 60px -20px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column'
    }}>
      {/* Dynamic Island */}
      <Box sx={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: '30%', height: 24, bgcolor: 'black', borderRadius: 20, zIndex: 10 }} />
      
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" px={3} pt={1.5} pb={1} sx={{ color: textPhone }}>
        <Typography variant="caption" fontWeight={600} sx={{ fontSize: 12 }}>{currentTime}</Typography>
        <Stack direction="row" spacing={0.5} sx={{ opacity: 0.9 }}><SignalCellularAltIcon sx={{ fontSize: 16 }}/><WifiIcon sx={{ fontSize: 16 }}/><BatteryFullIcon sx={{ fontSize: 16 }}/></Stack>
      </Stack>
      <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'center', borderBottom: `1px solid ${alpha(borderPhone, 0.5)}` }}>
         <Typography fontWeight={900} fontSize={20} sx={{ color: textPhone }}>𝕏</Typography>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
        {tweets.map((tweet, index) => (
          <Box key={tweet.id || index} sx={{ p: 2, borderBottom: `1px solid ${borderPhone}`, position: 'relative' }}>
             {index < tweets.length - 1 && <Box sx={{ position: 'absolute', left: 36, top: 60, bottom: -10, width: '2px', backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#CFD9DE', zIndex: 0 }} />}
            <Stack direction="row" spacing={1.5}>
              <Avatar src={integrationInfo?.avatar_url} sx={{ width: 40, height: 40, zIndex: 1, border: `1px solid ${bgPhone}` }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                   <Typography variant="body2" fontWeight={700} sx={{ color: textPhone, maxWidth: '140px', noWrap: true }}>{integrationInfo?.name || "User"}</Typography>
                   <VerifiedIcon sx={{ fontSize: 14, color: '#1D9BF0' }} />
                   <Typography variant="body2" sx={{ color: secondaryTextPhone }}>@{integrationInfo?.handle || "handle"} · {index === 0 ? '2m' : ''}</Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: textPhone, whiteSpace: 'pre-wrap', mt: 0.5, fontSize: '0.95rem', lineHeight: 1.45 }}>
                  {tweet.text || <span style={{ opacity: 0.3 }}>...</span>}
                </Typography>
                {tweet.media?.length > 0 && (
                  <Box sx={{ mt: 1.5, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${theme.palette.mode === 'dark' ? '#333' : '#CFD9DE'}` }}>
                    {tweet.media.map(m => <Box key={m.id} component="img" src={m.src} sx={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />)}
                  </Box>
                )}
                <Stack direction="row" justifyContent="space-between" mt={1.5} sx={{ color: secondaryTextPhone, maxWidth: '85%' }}>
                   <ChatBubbleOutlineIcon sx={{ fontSize: 18 }}/><RepeatIcon sx={{ fontSize: 18 }}/><FavoriteBorderIcon sx={{ fontSize: 18 }}/><IosShareIcon sx={{ fontSize: 18 }}/>
                </Stack>
              </Box>
            </Stack>
          </Box>
        ))}
        <Box height={60} />
      </Box>
      <Box sx={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: '35%', height: 5, borderRadius: 10, backgroundColor: theme.palette.mode === 'dark' ? 'white' : 'black', opacity: 0.8 }} />
    </Box>
  );
};

// --- COMPOSANT : EDITOR TOOLBAR (Esthétique) ---
const EditorToolbar = ({ currentVibe, onVibeChange, sourceEntry, onOpenSource, onGenerate, isGenerating }) => {
    const theme = useTheme();
    return (
        <Paper elevation={0} sx={{ 
            p: 1.5, mx: 2, mt: 2, mb: 0, border: `1px solid ${theme.palette.divider}`, borderRadius: '16px',
            bgcolor: alpha(theme.palette.background.paper, 0.6), backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap'
        }}>
            {/* Vibe Pills */}
            <Stack direction="row" spacing={0.5} sx={{ p: 0.5, bgcolor: theme.palette.action.hover, borderRadius: '12px' }}>
                {VIBES.map((v) => (
                    <Button
                        key={v.value} onClick={() => onVibeChange(v.value)} size="small"
                        startIcon={<span style={{ fontSize: '1.1rem' }}>{v.icon}</span>}
                        sx={{
                            borderRadius: '8px', px: 2, py: 0.5, minWidth: 'auto',
                            color: currentVibe === v.value ? 'white' : 'text.secondary',
                            bgcolor: currentVibe === v.value ? 'primary.main' : 'transparent',
                            fontWeight: currentVibe === v.value ? 700 : 500,
                            boxShadow: currentVibe === v.value ? '0px 2px 8px rgba(0,0,0,0.15)' : 'none',
                            '&:hover': { bgcolor: currentVibe === v.value ? 'primary.dark' : theme.palette.action.selected }
                        }}
                    >{v.label}</Button>
                ))}
            </Stack>

            <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center' }} />

            {/* Source Badge */}
            {sourceEntry ? (
                <Chip
                    avatar={<Avatar src={sourceEntry.metadata?.images?.[0]?.src} sx={{ width: 24, height: 24 }}>{sourceEntry.metadata?.symbol?.[0]}</Avatar>}
                    label={<Typography variant="caption" fontWeight={700}>{sourceEntry.metadata?.symbol || "Source"}</Typography>}
                    onDelete={onOpenSource} deleteIcon={<EditIcon sx={{ fontSize: '14px !important' }} />}
                    onClick={onOpenSource}
                    sx={{
                        bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`, fontWeight: 700, cursor: 'pointer'
                    }}
                />
            ) : (
                <Button onClick={onOpenSource} startIcon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />} variant="outlined" size="small" sx={{
                    borderStyle: 'dashed', color: 'text.secondary', borderColor: theme.palette.divider, borderRadius: '20px', textTransform: 'none', px: 2,
                    '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }
                }}>Lier une analyse</Button>
            )}

            <Box flexGrow={1} />

            {/* Magic Button */}
            <Button
                onClick={onGenerate} disabled={isGenerating || !sourceEntry}
                startIcon={isGenerating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                sx={{
                    background: isGenerating || !sourceEntry ? theme.palette.action.disabledBackground : 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                    color: 'white', borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3,
                    boxShadow: isGenerating ? 'none' : '0px 4px 12px rgba(59, 130, 246, 0.3)', transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-1px)', boxShadow: '0px 6px 16px rgba(59, 130, 246, 0.4)' },
                    '&.Mui-disabled': { color: 'rgba(255,255,255,0.5)' }
                }}
            >{isGenerating ? "Réflexion..." : "Magic Draft"}</Button>
        </Paper>
    );
};

// --- MAIN COMPONENT ---

const TwitterStudio = () => {
  const theme = useTheme();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md'));
  const fileInputRef = useRef(null);

  // State
  const [drafts, setDrafts] = useState([]);
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [editorDraft, setEditorDraft] = useState(null);
  const [mobileTab, setMobileTab] = useState(0);
  
  // Drag & Drop State
  const [draggingMedia, setDraggingMedia] = useState(null);

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isEntryDialogOpen, setEntryDialogOpen] = useState(false);
  const [journalEntries, setJournalEntries] = useState([]);
  const [entrySearch, setEntrySearch] = useState("");
  const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });
  const [integrationInfo, setIntegrationInfo] = useState(null);
  const [pendingTweetIndex, setPendingTweetIndex] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // --- LOADERS ---
  const loadDrafts = useCallback(async () => {
    setLoading(true);
    try { setDrafts((await fetchTwitterDrafts()).map(hydrateDraft)); } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  const loadIntegrations = async () => { try { setIntegrationInfo((await fetchIntegrations()).twitter); } catch (err) { console.error(err); } };

  useEffect(() => { loadDrafts(); loadIntegrations(); }, [loadDrafts]);

  useEffect(() => {
    if (activeDraftId) {
      const found = drafts.find(d => d.id === activeDraftId);
      if (found) setEditorDraft(hydrateDraft(found));
      setMobileTab(0);
    } else { setEditorDraft(null); }
    setIsDirty(false);
  }, [activeDraftId, drafts]);

  // --- DRAG & DROP LOGIC ---

  const handleDragStart = (e, tweetIndex, mediaId) => {
    setDraggingMedia({ tweetIndex, mediaId });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Permet le drop
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetTweetIndex, targetMediaId = null) => {
    e.preventDefault();
    if (!draggingMedia) return;

    const { tweetIndex: sourceTweetIndex, mediaId } = draggingMedia;
    
    // Optim: On ne fait rien si on lâche sur soi-même
    if (sourceTweetIndex === targetTweetIndex && mediaId === targetMediaId) {
        setDraggingMedia(null);
        return;
    }

    moveMediaItem(sourceTweetIndex, mediaId, targetTweetIndex, targetMediaId);
  };

  const moveMediaItem = (sourceTweetIndex, mediaId, targetTweetIndex, targetMediaId) => {
    setEditorDraft(prev => {
        const newTweets = [...prev.payload.tweets];
        
        // 1. Retirer de la source
        const sourceMedia = [...newTweets[sourceTweetIndex].media];
        const itemIndex = sourceMedia.findIndex(m => m.id === mediaId);
        if (itemIndex === -1) return prev;
        const [movedItem] = sourceMedia.splice(itemIndex, 1);
        
        newTweets[sourceTweetIndex] = { ...newTweets[sourceTweetIndex], media: sourceMedia };

        // 2. Préparer la cible
        let targetMedia = sourceTweetIndex === targetTweetIndex 
            ? sourceMedia 
            : [...(newTweets[targetTweetIndex].media || [])];
        
        // 3. Trouver la position d'insertion
        let insertIndex = targetMedia.length; // Par défaut: à la fin
        if (targetMediaId) {
            const targetIndex = targetMedia.findIndex(m => m.id === targetMediaId);
            if (targetIndex !== -1) insertIndex = targetIndex;
        }
        
        // 4. Insérer
        targetMedia.splice(insertIndex, 0, movedItem);
        
        // 5. Mise à jour
        newTweets[targetTweetIndex] = { ...newTweets[targetTweetIndex], media: targetMedia };

        return { ...prev, payload: { ...prev.payload, tweets: newTweets } };
    });
    setIsDirty(true);
    setDraggingMedia(null);
  };


  // --- ACTIONS ---
  const handleCreateDraft = async () => {
    try {
      const newDraft = await createTwitterDraft({ title: "Nouveau Thread", status: "draft", payload: { tweets: [DEFAULT_TWEET()] } });
      const hydrated = hydrateDraft(newDraft);
      setDrafts(prev => [hydrated, ...prev]);
      setActiveDraftId(hydrated.id);
    } catch (err) { pushNotification(err.message, "error"); }
  };

  const handleSave = async () => {
    if (!editorDraft) return;
    setSaving(true);
    try {
      const updated = await updateTwitterDraft(editorDraft.id, { ...editorDraft, payload: editorDraft.payload });
      setDrafts(prev => prev.map(d => d.id === updated.id ? hydrateDraft(updated) : d));
      setIsDirty(false);
      pushNotification("Sauvegardé", "success");
    } catch (err) { pushNotification(err.message, "error"); } finally { setSaving(false); }
  };

  const handlePublish = async () => {
    if(!editorDraft || !window.confirm("Publier sur Twitter maintenant ?")) return;
    setPublishing(true);
    try {
        await handleSave();
        await publishTwitterDraft(editorDraft.id);
        pushNotification("Publié !", "success");
        setActiveDraftId(null);
        loadDrafts();
    } catch (err) { pushNotification(err.message, "error"); } finally { setPublishing(false); }
  };

  const handleGenerateAI = async () => {
    if(!editorDraft?.sourceEntryId) return pushNotification("Lier une entrée d'abord", "warning");
    setGenerating(true);
    try {
        const data = await generateTwitterFromEntry({ entryId: editorDraft.sourceEntryId, variant: editorDraft.variant || "tweet.simple" });
        const newTweets = (data.tweets || []).map((t, i) => ({ ...DEFAULT_TWEET(), text: t.text, media: editorDraft.payload.tweets[i]?.media || [] }));
        updateDraftField('payload', { ...editorDraft.payload, tweets: newTweets });
        pushNotification("Généré !", "success");
    } catch(err) { pushNotification(err.message, "error"); } finally { setGenerating(false); }
  };

  const handleDelete = async (id, e) => {
    if(e) e.stopPropagation();
    if(!window.confirm("Supprimer définitivement ce brouillon ?")) return;
    try {
        await deleteTwitterDraft(id);
        setDrafts(prev => prev.filter(d => d.id !== id));
        if(activeDraftId === id) setActiveDraftId(null);
        pushNotification("Supprimé", "info");
    } catch (err) { pushNotification(err.message, "error"); }
  };

  // --- HELPERS ---
  const updateDraftField = (f, v) => { setEditorDraft(p => ({ ...p, [f]: v })); setIsDirty(true); };
  const updateTweetText = (i, txt) => { setEditorDraft(p => { const nt = [...p.payload.tweets]; nt[i].text = txt; return { ...p, payload: { ...p.payload, tweets: nt }}; }); setIsDirty(true); };
  const addTweet = () => setEditorDraft(p => ({ ...p, payload: { ...p.payload, tweets: [...p.payload.tweets, DEFAULT_TWEET()] } }));
  const removeTweet = (i) => setEditorDraft(p => { const nt = [...p.payload.tweets]; nt.splice(i, 1); return { ...p, payload: { ...p.payload, tweets: nt }}; });
  
  const handleAddImageClick = (i) => { setPendingTweetIndex(i); fileInputRef.current?.click(); };
  const handleFileChange = async (e) => {
      const file = e.target.files?.[0];
      if(file && pendingTweetIndex !== null) {
          const src = await fileToDataUrl(file);
          setEditorDraft(p => { const nt = [...p.payload.tweets]; nt[pendingTweetIndex].media = [...(nt[pendingTweetIndex].media||[]), { id: Date.now(), src }]; return { ...p, payload: { ...p.payload, tweets: nt }}; });
          setIsDirty(true);
      }
      setPendingTweetIndex(null);
  };
  const removeMedia = (ti, mid) => setEditorDraft(p => { const nt = [...p.payload.tweets]; nt[ti].media = nt[ti].media.filter(m => m.id !== mid); return { ...p, payload: { ...p.payload, tweets: nt }}; });

  const openJournalDialog = async () => { setEntryDialogOpen(true); if(journalEntries.length===0) setJournalEntries(await fetchJournalEntries()); };
  const attachEntry = (e) => {
      const att = mapEntryImagesToAttachments(e);
      setEditorDraft(p => { const nt = [...p.payload.tweets]; if(nt[0] && nt[0].media.length===0) nt[0].media = att; return { ...p, sourceEntryId: e.id, metadata: { ...p.metadata, sourceSymbol: e.metadata?.symbol }, payload: { ...p.payload, tweets: nt } }; });
      setEntryDialogOpen(false);
  };

  const pushNotification = (message, severity="info") => setNotification({ open: true, message, severity });


  // -----------------------------------------
  // --- VUE 1: DASHBOARD (Liste avec Pudding) ---
  // -----------------------------------------
  if (!activeDraftId) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, height: '100%', overflowY: 'auto', bgcolor: 'background.default' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
            <Box>
                <Typography variant="h4" fontWeight={800} gutterBottom>Studio</Typography>
                <Typography color="text.secondary">Tableau de bord de création</Typography>
            </Box>
            <Button variant="contained" size="large" startIcon={<AddPhotoAlternateIcon />} onClick={handleCreateDraft} sx={{ borderRadius: 3, px: 3 }}>
                Nouveau
            </Button>
        </Stack>

        {loading ? <CircularProgress sx={{ display:'block', mx: 'auto' }} /> : (
            <Grid container spacing={2}>
                {drafts.map(draft => (
                    <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={draft.id}>
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 2.5, cursor: 'pointer', borderRadius: 3, border: `1px solid ${theme.palette.divider}`, position: 'relative',
                                transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', borderColor: theme.palette.primary.main, boxShadow: theme.shadows[2] },
                                '&:hover .delete-btn': { opacity: 1 }
                            }}
                            onClick={() => setActiveDraftId(draft.id)}
                        >
                            <IconButton 
                                className="delete-btn" size="small" onClick={(e) => handleDelete(draft.id, e)}
                                sx={{ position: 'absolute', top: 8, right: 8, opacity: 0, transition: 'opacity 0.2s', color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'error.light' } }}
                            >
                                <DeleteOutlineIcon fontSize="small" />
                            </IconButton>

                            <Stack spacing={1.5}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Chip label={draft.status === 'published' ? 'Publié' : 'Brouillon'} color={draft.status === 'published' ? 'success' : 'default'} size="small" sx={{ height: 20, fontSize: 10 }} />
                                    <Typography variant="caption" color="text.secondary">{new Date(draft.updatedAt).toLocaleDateString()}</Typography>
                                </Stack>
                                <Typography variant="h6" fontWeight={700} noWrap sx={{ fontSize: '1rem', pr: 3 }}>{draft.title || "Sans titre"}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ height: 40, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {draft.payload?.tweets?.[0]?.text || "Aucun contenu..."}
                                </Typography>
                            </Stack>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        )}
      </Box>
    );
  }

  // -----------------------------------------
  // --- VUE 2: EDITOR (Avec Pudding + Toolbar + D&D) ---
  // -----------------------------------------
  return (
    <Box sx={{ p: { xs: 1, md: 2 }, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>
        
        <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
            {/* Header */}
            <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, bgcolor: 'background.paper' }}>
                <IconButton onClick={() => setActiveDraftId(null)}><ArrowBackIcon /></IconButton>
                <TextField 
                    variant="standard" value={editorDraft?.title || ""} onChange={(e) => updateDraftField('title', e.target.value)}
                    InputProps={{ disableUnderline: true, style: { fontSize: '1.2rem', fontWeight: 700 } }} placeholder="Nom du thread..." sx={{ flex: 1 }}
                />
                {isDirty && <Chip label="Modifié" color="warning" size="small" variant="outlined" />}
                <Tooltip title="Supprimer le brouillon">
                    <IconButton onClick={(e) => handleDelete(editorDraft.id, e)} color="error" size="small" sx={{ mr: 1 }}><DeleteOutlineIcon /></IconButton>
                </Tooltip>
                <Button startIcon={<SaveIcon />} onClick={handleSave} disabled={!isDirty || saving} variant="outlined" size="small">Sauver</Button>
            </Box>

            {/* Mobile Tabs */}
            {isMobileOrTablet && (
                <Tabs value={mobileTab} onChange={(_, v) => setMobileTab(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 48 }}>
                    <Tab icon={<EditIcon fontSize="small" />} iconPosition="start" label="Éditer" sx={{ minHeight: 48 }} />
                    <Tab icon={<VisibilityIcon fontSize="small" />} iconPosition="start" label="Aperçu" sx={{ minHeight: 48 }} />
                </Tabs>
            )}

            {/* Workspace */}
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                
                {/* Left: Editor */}
                {(!isMobileOrTablet || mobileTab === 0) && (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: isMobileOrTablet ? 'none' : `1px solid ${theme.palette.divider}`, maxWidth: isMobileOrTablet ? '100%' : '60%', bgcolor: 'background.paper' }}>
                        
                        <EditorToolbar 
                            currentVibe={editorDraft?.variant} onVibeChange={(v) => v && updateDraftField('variant', v)}
                            sourceEntry={editorDraft?.sourceEntryId ? { id: editorDraft.sourceEntryId, metadata: { symbol: editorDraft.metadata?.sourceSymbol } } : null}
                            onOpenSource={openJournalDialog} onGenerate={handleGenerateAI} isGenerating={generating}
                        />

                        <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
                            <Stack spacing={6}>
                                {editorDraft?.payload?.tweets.map((tweet, idx) => (
                                    <Box key={idx} sx={{ pl: 3, borderLeft: `3px solid ${theme.palette.divider}` }}>
                                        <Stack direction="row" justifyContent="space-between" mb={1}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary">TWEET {idx + 1}</Typography>
                                            {idx > 0 && <IconButton size="small" onClick={() => removeTweet(idx)}><DeleteOutlineIcon fontSize="small"/></IconButton>}
                                        </Stack>
                                        <TextField
                                            fullWidth multiline minRows={3} value={tweet.text} onChange={(e) => updateTweetText(idx, e.target.value)}
                                            placeholder="Quoi de neuf ?" variant="filled" InputProps={{ disableUnderline: true, sx: { borderRadius: 2, fontSize: '1.05rem' } }}
                                        />
                                        {/* Media Area with Drag & Drop */}
                                        <Stack 
                                            direction="row" spacing={1} mt={1} 
                                            sx={{ overflowX: 'auto', py: 1, minHeight: 50, alignItems: 'center' }}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, idx, null)} // Drop on empty space = append
                                        >
                                            {tweet.media?.map(m => (
                                                <Box 
                                                    key={m.id} 
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, idx, m.id)}
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => { e.stopPropagation(); handleDrop(e, idx, m.id); }} // Drop on item = insert before
                                                    sx={{ 
                                                        width: 70, height: 70, position: 'relative', flexShrink: 0, cursor: 'grab',
                                                        opacity: draggingMedia?.mediaId === m.id ? 0.5 : 1, transition: 'all 0.2s',
                                                        '&:hover': { transform: 'scale(1.05)' }
                                                    }}
                                                >
                                                    <img src={m.src} alt="" style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} />
                                                    <IconButton size="small" onClick={() => removeMedia(idx, m.id)} sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'background.paper', border: '1px solid #ccc', width: 20, height: 20 }}><CloseIcon sx={{ fontSize: 14 }} /></IconButton>
                                                </Box>
                                            ))}
                                            <IconButton onClick={() => handleAddImageClick(idx)} sx={{ width: 70, height: 70, border: '1px dashed grey', borderRadius: 2 }}><AddPhotoAlternateIcon /></IconButton>
                                        </Stack>
                                        <Typography variant="caption" display="block" textAlign="right" sx={{ mt: 1 }} color={tweet.text.length > 280 ? "error" : "text.secondary"}>{tweet.text.length} / 280</Typography>
                                    </Box>
                                ))}
                                <Button startIcon={<DragIndicatorIcon />} onClick={addTweet} sx={{ alignSelf: 'flex-start', ml: 3 }}>Ajouter un tweet</Button>
                            </Stack>
                        </Box>

                        <Paper elevation={6} sx={{ p: 2, zIndex: 10, borderTop: `1px solid ${theme.palette.divider}` }}>
                            <Button fullWidth variant="contained" color="primary" size="large" onClick={handlePublish} disabled={publishing} startIcon={publishing ? <CircularProgress size={20} color="inherit"/> : <RocketLaunchIcon/>}>
                                {publishing ? "Publication en cours..." : "Publier le Thread"}
                            </Button>
                        </Paper>
                    </Box>
                )}

                {/* Right: Preview */}
                {(!isMobileOrTablet || mobileTab === 1) && (
                    <Box sx={{ flex: 1, bgcolor: theme.palette.mode === 'dark' ? '#151a21' : '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, position: 'relative' }}>
                        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(#888 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                        <Fade in={true} timeout={600}>
                            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <PhonePreview tweets={editorDraft?.payload?.tweets || []} integrationInfo={integrationInfo} theme={theme} />
                            </Box>
                        </Fade>
                    </Box>
                )}
            </Box>
        </Paper>

        {/* UTILS */}
        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
        <Dialog open={isEntryDialogOpen} onClose={() => setEntryDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Source Journal</DialogTitle>
            <DialogContent dividers>
                <TextField fullWidth placeholder="Rechercher..." value={entrySearch} onChange={e => setEntrySearch(e.target.value)} sx={{ mb: 2 }} />
                <List>
                    {journalEntries.slice(0, 5).map(entry => (
                        <ListItemButton key={entry.id} onClick={() => attachEntry(entry)}>
                            <ListItemAvatar><Avatar src={entry.metadata?.images?.[0]?.src}>{entry.metadata?.symbol?.[0]}</Avatar></ListItemAvatar>
                            <ListItemText primary={entry.metadata?.title || "Entrée"} secondary={entry.type} />
                        </ListItemButton>
                    ))}
                </List>
            </DialogContent>
            <DialogActions><Button onClick={() => setEntryDialogOpen(false)}>Fermer</Button></DialogActions>
        </Dialog>
        <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification(p => ({...p, open: false}))}>
            <Alert severity={notification.severity} variant="filled">{notification.message}</Alert>
        </Snackbar>
    </Box>
  );
};

export default TwitterStudio;