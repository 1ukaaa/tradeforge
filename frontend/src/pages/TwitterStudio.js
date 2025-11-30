import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddLinkIcon from "@mui/icons-material/AddLink";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BatteryFullIcon from "@mui/icons-material/BatteryFull";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from '@mui/icons-material/Edit';
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import IosShareIcon from "@mui/icons-material/IosShare";
import RepeatIcon from "@mui/icons-material/Repeat";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SearchIcon from "@mui/icons-material/Search";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import VerifiedIcon from '@mui/icons-material/Verified';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WifiIcon from "@mui/icons-material/Wifi";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardActionArea,
    CardActions,
    CardContent,
    CardMedia,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Fade,
    Grid,
    IconButton,
    InputAdornment,
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
const VARIANTS = [
    { value: "tweet.simple", label: "Synthèse", icon: "📝", description: "Un tweet simple et efficace" },
    { value: "thread.analysis", label: "Analyse", icon: "🧠", description: "Thread détaillé d'analyse" },
    { value: "thread.annonce", label: "Hype", icon: "🔥", description: "Annonce engageante" },
];

const DEFAULT_TWEET = () => ({ id: `tweet-${Date.now()}`, text: "", media: [] });

// --- UTILS ---
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

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
                <Stack direction="row" spacing={0.5} sx={{ opacity: 0.9 }}><SignalCellularAltIcon sx={{ fontSize: 16 }} /><WifiIcon sx={{ fontSize: 16 }} /><BatteryFullIcon sx={{ fontSize: 16 }} /></Stack>
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
                                    <Typography variant="body2" sx={{ color: secondaryTextPhone }}>{integrationInfo?.handle || "handle"} · {index === 0 ? '2m' : ''}</Typography>
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
                                    <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} /><RepeatIcon sx={{ fontSize: 18 }} /><FavoriteBorderIcon sx={{ fontSize: 18 }} /><IosShareIcon sx={{ fontSize: 18 }} />
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

// --- COMPOSANT : EDITOR TOOLBAR ---
const EditorToolbar = ({ currentVariant, onVariantChange, sourceEntry, onOpenSource, onGenerate, isGenerating }) => {
    const theme = useTheme();

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                mb: 3,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.background.paper, 0.5),
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap'
            }}
        >
            <Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>VARIANTE</Typography>
                <Stack direction="row" spacing={1}>
                    {VARIANTS.map((v) => (
                        <Tooltip key={v.value} title={v.description}>
                            <Button
                                onClick={() => onVariantChange(v.value)}
                                size="small"
                                startIcon={<span>{v.icon}</span>}
                                variant={currentVariant === v.value ? "contained" : "outlined"}
                                color={currentVariant === v.value ? "primary" : "inherit"}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    borderColor: currentVariant === v.value ? 'transparent' : theme.palette.divider
                                }}
                            >
                                {v.label}
                            </Button>
                        </Tooltip>
                    ))}
                </Stack>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            <Box sx={{ flex: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>SOURCE</Typography>
                {sourceEntry ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                            avatar={<Avatar src={sourceEntry.metadata?.images?.[0]?.src} sx={{ width: 24, height: 24 }}>{sourceEntry.metadata?.symbol?.[0]}</Avatar>}
                            label={sourceEntry.metadata?.symbol || "Source"}
                            onDelete={onOpenSource}
                            deleteIcon={<EditIcon sx={{ fontSize: '14px !important' }} />}
                            onClick={onOpenSource}
                            sx={{ fontWeight: 600 }}
                        />
                    </Stack>
                ) : (
                    <Button
                        onClick={onOpenSource}
                        startIcon={<AddLinkIcon />}
                        variant="outlined"
                        size="small"
                        sx={{ borderStyle: 'dashed', borderRadius: 2, textTransform: 'none' }}
                    >
                        Lier une entrée
                    </Button>
                )}
            </Box>

            <Button
                onClick={onGenerate}
                disabled={isGenerating || !sourceEntry}
                variant="contained"
                startIcon={isGenerating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 3,
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
            >
                {isGenerating ? "Réflexion..." : "Magic Draft"}
            </Button>
        </Paper>
    );
};

// --- COMPOSANT : POST EDITOR ---
const PostEditor = ({ draft, onSave, onClose, onPublish, onDelete }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const fileInputRef = useRef(null);

    // State
    const [editorDraft, setEditorDraft] = useState(hydrateDraft(draft));
    const [mobileTab, setMobileTab] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [isEntryDialogOpen, setEntryDialogOpen] = useState(false);
    const [journalEntries, setJournalEntries] = useState([]);
    const [entrySearch, setEntrySearch] = useState("");
    const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });
    const [integrationInfo, setIntegrationInfo] = useState(null);
    const [pendingTweetIndex, setPendingTweetIndex] = useState(null);
    const [draggingMedia, setDraggingMedia] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    // Effects
    useEffect(() => {
        const load = async () => { try { setIntegrationInfo((await fetchIntegrations()).twitter); } catch (err) { console.error(err); } };
        load();
    }, []);

    // Handlers
    const updateDraftField = (f, v) => { setEditorDraft(p => ({ ...p, [f]: v })); setIsDirty(true); };
    const updateTweetText = (i, txt) => { setEditorDraft(p => { const nt = [...p.payload.tweets]; nt[i].text = txt; return { ...p, payload: { ...p.payload, tweets: nt } }; }); setIsDirty(true); };
    const addTweet = () => setEditorDraft(p => ({ ...p, payload: { ...p.payload, tweets: [...p.payload.tweets, DEFAULT_TWEET()] } }));
    const removeTweet = (i) => setEditorDraft(p => { const nt = [...p.payload.tweets]; nt.splice(i, 1); return { ...p, payload: { ...p.payload, tweets: nt } }; });

    const handleGenerateAI = async () => {
        if (!editorDraft?.sourceEntryId) return setNotification({ open: true, message: "Lier une entrée d'abord", severity: "warning" });
        setGenerating(true);
        try {
            const data = await generateTwitterFromEntry({ entryId: editorDraft.sourceEntryId, variant: editorDraft.variant || "tweet.simple" });
            const newTweets = (data.tweets || []).map((t, i) => ({ ...DEFAULT_TWEET(), text: t.text, media: editorDraft.payload.tweets[i]?.media || [] }));
            updateDraftField('payload', { ...editorDraft.payload, tweets: newTweets });
            setNotification({ open: true, message: "Généré !", severity: "success" });
        } catch (err) { setNotification({ open: true, message: err.message, severity: "error" }); } finally { setGenerating(false); }
    };

    const handleSaveClick = async () => {
        await onSave(editorDraft);
        setIsDirty(false);
        setNotification({ open: true, message: "Sauvegardé", severity: "success" });
    };

    const handlePublishClick = async () => {
        if (!window.confirm("Publier ce thread sur Twitter ?")) return;
        setPublishing(true);
        try {
            await onPublish(editorDraft);
            setNotification({ open: true, message: "Publié avec succès !", severity: "success" });
        } catch (err) { setNotification({ open: true, message: err.message, severity: "error" }); } finally { setPublishing(false); }
    };

    // Media Logic
    const handleAddImageClick = (i) => { setPendingTweetIndex(i); fileInputRef.current?.click(); };
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (file && pendingTweetIndex !== null) {
            const src = await fileToDataUrl(file);
            setEditorDraft(p => { const nt = [...p.payload.tweets]; nt[pendingTweetIndex].media = [...(nt[pendingTweetIndex].media || []), { id: Date.now(), src }]; return { ...p, payload: { ...p.payload, tweets: nt } }; });
            setIsDirty(true);
        }
        setPendingTweetIndex(null);
    };
    const removeMedia = (ti, mid) => setEditorDraft(p => { const nt = [...p.payload.tweets]; nt[ti].media = nt[ti].media.filter(m => m.id !== mid); return { ...p, payload: { ...p.payload, tweets: nt } }; });

    // Drag & Drop
    const handleDragStart = (e, tweetIndex, mediaId) => { setDraggingMedia({ tweetIndex, mediaId }); e.dataTransfer.effectAllowed = "move"; };
    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
    const handleDrop = (e, targetTweetIndex, targetMediaId = null) => {
        e.preventDefault();
        if (!draggingMedia) return;
        const { tweetIndex: sourceTweetIndex, mediaId } = draggingMedia;
        if (sourceTweetIndex === targetTweetIndex && mediaId === targetMediaId) { setDraggingMedia(null); return; }

        setEditorDraft(prev => {
            const newTweets = [...prev.payload.tweets];
            const sourceMedia = [...newTweets[sourceTweetIndex].media];
            const itemIndex = sourceMedia.findIndex(m => m.id === mediaId);
            if (itemIndex === -1) return prev;
            const [movedItem] = sourceMedia.splice(itemIndex, 1);
            newTweets[sourceTweetIndex] = { ...newTweets[sourceTweetIndex], media: sourceMedia };

            let targetMedia = sourceTweetIndex === targetTweetIndex ? sourceMedia : [...(newTweets[targetTweetIndex].media || [])];
            let insertIndex = targetMedia.length;
            if (targetMediaId) {
                const targetIndex = targetMedia.findIndex(m => m.id === targetMediaId);
                if (targetIndex !== -1) insertIndex = targetIndex;
            }
            targetMedia.splice(insertIndex, 0, movedItem);
            newTweets[targetTweetIndex] = { ...newTweets[targetTweetIndex], media: targetMedia };
            return { ...prev, payload: { ...prev.payload, tweets: newTweets } };
        });
        setIsDirty(true);
        setDraggingMedia(null);
    };

    // Journal Logic
    const openJournalDialog = async () => { setEntryDialogOpen(true); if (journalEntries.length === 0) setJournalEntries(await fetchJournalEntries()); };
    const attachEntry = (e) => {
        const att = mapEntryImagesToAttachments(e);
        setEditorDraft(p => { const nt = [...p.payload.tweets]; if (nt[0] && nt[0].media.length === 0) nt[0].media = att; return { ...p, sourceEntryId: e.id, metadata: { ...p.metadata, sourceSymbol: e.metadata?.symbol }, payload: { ...p.payload, tweets: nt } }; });
        setEntryDialogOpen(false);
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>
            {/* TOP BAR */}
            <Paper elevation={0} sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper', zIndex: 10 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>Retour</Button>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                <TextField
                    variant="standard"
                    value={editorDraft.title || ""}
                    onChange={(e) => updateDraftField('title', e.target.value)}
                    InputProps={{ disableUnderline: true, style: { fontSize: '1.1rem', fontWeight: 700 } }}
                    placeholder="Nom du thread..."
                    sx={{ flex: 1 }}
                />

                {isDirty && <Chip label="Non enregistré" color="warning" size="small" variant="outlined" />}

                <Tooltip title="Supprimer">
                    <IconButton onClick={() => onDelete(editorDraft.id)} color="error" size="small"><DeleteOutlineIcon /></IconButton>
                </Tooltip>

                <Button
                    variant="outlined"
                    startIcon={<CheckCircleIcon />}
                    onClick={handleSaveClick}
                    disabled={!isDirty}
                    sx={{ borderRadius: 2 }}
                >
                    Sauver
                </Button>

                <Button
                    variant="contained"
                    startIcon={publishing ? <CircularProgress size={20} color="inherit" /> : <RocketLaunchIcon />}
                    onClick={handlePublishClick}
                    disabled={publishing}
                    sx={{
                        bgcolor: '#1D9BF0',
                        '&:hover': { bgcolor: '#1A8CD8' },
                        borderRadius: 2,
                        px: 3,
                        boxShadow: '0 4px 10px rgba(29, 155, 240, 0.3)'
                    }}
                >
                    Publier
                </Button>
            </Paper>

            {/* MOBILE TABS */}
            {isMobile && <Tabs value={mobileTab} onChange={(_, v) => setMobileTab(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 48 }}><Tab icon={<EditIcon fontSize="small" />} label="Éditeur" /><Tab icon={<VisibilityIcon fontSize="small" />} label="Aperçu" /></Tabs>}

            {/* MAIN CONTENT */}
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* LEFT PANEL: TOOLS */}
                {(!isMobile || mobileTab === 0) && (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`, maxWidth: isMobile ? '100%' : '600px', minWidth: 350, bgcolor: 'background.paper', overflowY: 'auto' }}>
                        <Box sx={{ p: 3 }}>
                            <EditorToolbar
                                currentVariant={editorDraft.variant}
                                onVariantChange={(v) => updateDraftField('variant', v)}
                                sourceEntry={editorDraft.sourceEntryId ? { id: editorDraft.sourceEntryId, metadata: { symbol: editorDraft.metadata?.sourceSymbol } } : null}
                                onOpenSource={openJournalDialog}
                                onGenerate={handleGenerateAI}
                                isGenerating={generating}
                            />

                            <Stack spacing={4}>
                                {editorDraft.payload?.tweets.map((tweet, idx) => (
                                    <Box key={idx} sx={{ position: 'relative', pl: 3, borderLeft: `2px solid ${theme.palette.divider}` }}>
                                        <Box sx={{ position: 'absolute', left: -9, top: 0, width: 16, height: 16, borderRadius: '50%', bgcolor: theme.palette.divider, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', color: 'text.secondary' }}>{idx + 1}</Box>

                                        <Stack direction="row" justifyContent="space-between" mb={1}>
                                            <Typography variant="subtitle2" fontWeight={700} color="text.secondary">TWEET {idx + 1}</Typography>
                                            {idx > 0 && <IconButton size="small" onClick={() => removeTweet(idx)} color="error"><CloseIcon fontSize="small" /></IconButton>}
                                        </Stack>

                                        <TextField
                                            fullWidth multiline minRows={3}
                                            value={tweet.text}
                                            onChange={(e) => updateTweetText(idx, e.target.value)}
                                            placeholder="Quoi de neuf ?"
                                            variant="outlined"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                                        />

                                        {/* Media Area */}
                                        <Box sx={{ mt: 2 }}>
                                            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, idx, null)}>
                                                {tweet.media?.map(m => (
                                                    <Box
                                                        key={m.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, idx, m.id)}
                                                        onDragOver={handleDragOver}
                                                        onDrop={(e) => { e.stopPropagation(); handleDrop(e, idx, m.id); }}
                                                        sx={{
                                                            width: 80, height: 80, position: 'relative', flexShrink: 0, cursor: 'grab', borderRadius: 2, overflow: 'hidden',
                                                            opacity: draggingMedia?.mediaId === m.id ? 0.5 : 1, border: `1px solid ${theme.palette.divider}`
                                                        }}
                                                    >
                                                        <img src={m.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <IconButton size="small" onClick={() => removeMedia(idx, m.id)} sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', width: 20, height: 20, p: 0.5 }}><CloseIcon sx={{ fontSize: 12 }} /></IconButton>
                                                    </Box>
                                                ))}
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => handleAddImageClick(idx)}
                                                    sx={{ minWidth: 80, height: 80, borderStyle: 'dashed', borderRadius: 2, flexDirection: 'column', gap: 0.5 }}
                                                >
                                                    <AddPhotoAlternateIcon color="action" />
                                                </Button>
                                            </Stack>
                                        </Box>

                                        <Stack direction="row" justifyContent="flex-end" mt={0.5}>
                                            <Typography variant="caption" color={tweet.text.length > 280 ? "error" : "text.secondary"} fontWeight={600}>
                                                {tweet.text.length} / 280
                                            </Typography>
                                        </Stack>
                                    </Box>
                                ))}
                                <Button startIcon={<AddCircleIcon />} onClick={addTweet} variant="text" sx={{ alignSelf: 'flex-start', ml: 1 }}>Ajouter un tweet</Button>
                            </Stack>
                        </Box>
                    </Box>
                )}

                {/* RIGHT PANEL: PREVIEW */}
                {(!isMobile || mobileTab === 1) && (
                    <Box sx={{ flex: 1, bgcolor: theme.palette.mode === 'dark' ? '#151a21' : '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(#888 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                        <Fade in={true} timeout={600}>
                            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <PhonePreview tweets={editorDraft.payload?.tweets || []} integrationInfo={integrationInfo} theme={theme} />
                            </Box>
                        </Fade>
                    </Box>
                )}
            </Box>

            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />

            <Dialog open={isEntryDialogOpen} onClose={() => setEntryDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Source Journal</DialogTitle>
                <DialogContent dividers>
                    <TextField fullWidth placeholder="Rechercher..." value={entrySearch} onChange={e => setEntrySearch(e.target.value)} sx={{ mb: 2 }} />
                    <List>
                        {journalEntries.slice(0, 5).map(entry => (
                            <ListItemButton key={entry.id} onClick={() => attachEntry(entry)} sx={{ borderRadius: 2, mb: 1 }}>
                                <ListItemAvatar><Avatar variant="rounded" src={entry.metadata?.images?.[0]?.src}>{entry.metadata?.symbol?.[0]}</Avatar></ListItemAvatar>
                                <ListItemText primary={<Typography fontWeight={600}>{entry.metadata?.title || "Entrée"}</Typography>} secondary={entry.type} />
                                <ArrowBackIcon sx={{ transform: 'rotate(180deg)' }} color="action" fontSize="small" />
                            </ListItemButton>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions><Button onClick={() => setEntryDialogOpen(false)}>Fermer</Button></DialogActions>
            </Dialog>

            <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification(p => ({ ...p, open: false }))}>
                <Alert severity={notification.severity} variant="filled" sx={{ borderRadius: 2 }}>{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
};

// --- COMPOSANT : DASHBOARD ---
const StatCard = ({ title, value, icon, color }) => (
    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(color, 0.1), color: color, display: 'flex' }}>
            {icon}
        </Box>
        <Box>
            <Typography variant="h5" fontWeight={700}>{value}</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>{title}</Typography>
        </Box>
    </Paper>
);

const PostDashboard = ({ drafts, onEdit, onCreate, onDelete, loading }) => {
    const theme = useTheme();
    const [tab, setTab] = useState(0);
    const [search, setSearch] = useState("");

    const filteredDrafts = drafts.filter(d => {
        const matchesTab = (tab === 0 && d.status !== 'published') || (tab === 1 && d.status === 'published');
        const matchesSearch = d.title?.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const stats = {
        drafts: drafts.filter(d => d.status !== 'published').length,
        published: drafts.filter(d => d.status === 'published').length
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflowY: 'auto' }}>
            {/* HERO */}
            <Box sx={{
                py: 6, px: 4,
                background: theme.forge?.gradients?.hero || 'linear-gradient(180deg, #1E1E24 0%, #0A0A0F 100%)',
                borderBottom: `1px solid ${theme.palette.divider}`
            }}>
                <Container maxWidth="xl">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Typography variant="h3" fontWeight={800} gutterBottom sx={{
                                background: theme.palette.mode === 'dark'
                                    ? 'linear-gradient(90deg, #fff, #ccc)'
                                    : 'linear-gradient(90deg, #0F1729, #4A4A52)',
                                backgroundClip: 'text',
                                textFillColor: 'transparent'
                            }}>
                                Twitter Studio
                            </Typography>
                            <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 600 }}>
                                Créez des threads engageants et partagez vos analyses avec votre audience sur X.
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                                <StatCard title="Brouillons" value={stats.drafts} icon={<EditIcon />} color={theme.palette.text.secondary} />
                                <StatCard title="Publiés" value={stats.published} icon={<CheckCircleIcon />} color="#1D9BF0" />
                            </Stack>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* CONTENT */}
            <Container maxWidth="xl" sx={{ flex: 1, py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        sx={{
                            bgcolor: 'background.paper',
                            borderRadius: 3,
                            p: 0.5,
                            border: `1px solid ${theme.palette.divider}`,
                            '& .MuiTab-root': { borderRadius: 2, minHeight: 40, px: 3, zIndex: 1 },
                            '& .MuiTabs-indicator': { height: '100%', borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1) }
                        }}
                    >
                        <Tab label="Brouillons" />
                        <Tab label="Publiés" />
                    </Tabs>

                    <Stack direction="row" spacing={2}>
                        <TextField
                            size="small"
                            placeholder="Rechercher..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                            sx={{ width: 250, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.paper' } }}
                        />
                        <Button
                            variant="contained"
                            startIcon={<AddCircleIcon />}
                            onClick={onCreate}
                            sx={{
                                borderRadius: 3,
                                fontWeight: 700,
                                px: 3,
                                background: 'linear-gradient(135deg, #1D9BF0 0%, #1A8CD8 100%)',
                                boxShadow: '0 4px 12px rgba(29, 155, 240, 0.3)'
                            }}
                        >
                            Nouveau
                        </Button>
                    </Stack>
                </Box>

                {loading ? <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} /> : (
                    <Grid container spacing={3}>
                        {filteredDrafts.map(draft => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={draft.id}>
                                <Fade in timeout={500}>
                                    <Card sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: 3,
                                        border: `1px solid ${theme.palette.divider}`,
                                        transition: 'all 0.3s ease',
                                        '&:hover': { transform: 'translateY(-5px)', boxShadow: theme.shadows[4], borderColor: theme.palette.primary.main }
                                    }}>
                                        <CardActionArea onClick={() => onEdit(draft)} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                                            <Box sx={{ height: 160, position: 'relative', overflow: 'hidden', bgcolor: 'background.paper' }}>
                                                {draft.payload?.tweets?.[0]?.media?.[0]?.src ? (
                                                    <CardMedia component="img" height="100%" image={draft.payload.tweets[0].media[0].src} alt="Post image" sx={{ transition: 'transform 0.5s', '&:hover': { transform: 'scale(1.05)' } }} />
                                                ) : (
                                                    <Box sx={{ height: '100%', bgcolor: alpha(theme.palette.action.hover, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
                                                        <ChatBubbleOutlineIcon sx={{ color: theme.palette.divider, fontSize: 40 }} />
                                                    </Box>
                                                )}
                                                <Chip
                                                    label={draft.variant ? draft.variant.split('.')[1] : 'Tweet'}
                                                    size="small"
                                                    sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(4px)', border: 'none', textTransform: 'capitalize' }}
                                                />
                                            </Box>
                                            <CardContent sx={{ flex: 1, p: 2.5 }}>
                                                <Typography variant="h6" fontWeight={700} noWrap sx={{ mb: 1 }}>{draft.title || "Sans titre"}</Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                    {draft.payload?.tweets?.[0]?.text || "Pas de contenu..."}
                                                </Typography>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatDate(draft.updatedAt)}
                                                    </Typography>
                                                </Stack>
                                            </CardContent>
                                        </CardActionArea>
                                        <Divider />
                                        <CardActions sx={{ justifyContent: 'space-between', p: 1.5 }}>
                                            <Button size="small" color="inherit" onClick={() => onEdit(draft)}>Éditer</Button>
                                            <IconButton size="small" color="error" onClick={() => onDelete(draft.id)} sx={{ opacity: 0.7, '&:hover': { opacity: 1, bgcolor: alpha(theme.palette.error.main, 0.1) } }}>
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </CardActions>
                                    </Card>
                                </Fade>
                            </Grid>
                        ))}
                        {filteredDrafts.length === 0 && (
                            <Box sx={{ width: '100%', textAlign: 'center', mt: 8, color: 'text.secondary' }}>
                                <ChatBubbleOutlineIcon sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
                                <Typography variant="h6">Aucun tweet trouvé</Typography>
                                <Typography variant="body2" color="text.disabled">Créez un nouveau thread pour commencer.</Typography>
                            </Box>
                        )}
                    </Grid>
                )}
            </Container>
        </Box>
    );
};

// --- MAIN CONTROLLER ---
const TwitterStudio = () => {
    const [drafts, setDrafts] = useState([]);
    const [activeDraftId, setActiveDraftId] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadDrafts = useCallback(async () => {
        setLoading(true);
        try { setDrafts((await fetchTwitterDrafts()).map(hydrateDraft)); } catch (err) { console.error(err); } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadDrafts(); }, [loadDrafts]);

    const handleCreateDraft = async () => {
        try {
            const newDraft = await createTwitterDraft({ title: "Nouveau Thread", status: "draft", payload: { tweets: [DEFAULT_TWEET()] } });
            const hydrated = hydrateDraft(newDraft);
            setDrafts(prev => [hydrated, ...prev]);
            setActiveDraftId(hydrated.id);
        } catch (err) { console.error(err); }
    };

    const handleSaveDraft = async (draft) => {
        try {
            const updated = await updateTwitterDraft(draft.id, { ...draft, payload: draft.payload });
            setDrafts(prev => prev.map(d => d.id === updated.id ? hydrateDraft(updated) : d));
        } catch (err) { throw err; }
    };

    const handleDeleteDraft = async (id) => {
        if (!window.confirm("Supprimer définitivement ce brouillon ?")) return;
        try {
            await deleteTwitterDraft(id);
            setDrafts(prev => prev.filter(d => d.id !== id));
            if (activeDraftId === id) setActiveDraftId(null);
        } catch (err) { console.error(err); }
    };

    const handlePublishDraft = async (draft) => {
        await handleSaveDraft(draft);
        await publishTwitterDraft(draft.id);
        setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, status: 'published' } : d));
        setActiveDraftId(null);
    };

    const activeDraft = drafts.find(d => d.id === activeDraftId);

    if (activeDraft) {
        return (
            <PostEditor
                key={activeDraft.id}
                draft={activeDraft}
                onSave={handleSaveDraft}
                onClose={() => setActiveDraftId(null)}
                onPublish={handlePublishDraft}
                onDelete={(id) => { handleDeleteDraft(id); setActiveDraftId(null); }}
            />
        );
    }

    return (
        <PostDashboard
            drafts={drafts}
            onEdit={(d) => setActiveDraftId(d.id)}
            onCreate={handleCreateDraft}
            onDelete={handleDeleteDraft}
            loading={loading}
        />
    );
};

export default TwitterStudio;