import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddLinkIcon from "@mui/icons-material/AddLink";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import GifIcon from "@mui/icons-material/Gif";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InboxIcon from "@mui/icons-material/Inbox";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PushPinIcon from "@mui/icons-material/PushPin";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SettingsEthernetIcon from "@mui/icons-material/SettingsEthernet";
import TagIcon from "@mui/icons-material/Tag";
import VisibilityIcon from "@mui/icons-material/Visibility";
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
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    InputBase,
    List,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Paper,
    Skeleton,
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
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchDiscordStatus, generateDiscordPostFromEntry, publishToDiscord } from "../services/discordClient";
import { fetchJournalEntries } from "../services/journalClient";

// --- CONFIGURATION ---
const VARIANTS = [
    { value: "trade.simple", label: "Trade Recap", icon: "📉" },
    { value: "analysis.deep", label: "Analyse", icon: "🧠" },
];

// --- UTILS ---
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

// --- COMPOSANT : DISCORD IMAGE GRID (GALERIE PREVIEW) ---
const DiscordImageGrid = ({ embeds }) => {
    // On récupère les images à partir du 2ème embed (le 1er est le principal)
    const galleryImages = embeds.slice(1).filter(e => e.image && e.image.url).map(e => e.image.url);

    if (galleryImages.length === 0) return null;

    const count = galleryImages.length;
    let gridTemplate = count === 1 ? '1fr' : '1fr 1fr';
    let height = count === 1 ? '200px' : (count === 2 ? '150px' : '250px');

    return (
        <Box sx={{
            mt: '4px',
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            gridTemplateRows: count >= 3 ? '1fr 1fr' : '1fr',
            gap: '4px',
            height: height,
            borderRadius: '4px',
            overflow: 'hidden',
            maxWidth: '800px'
        }}>
            {galleryImages.slice(0, 4).map((src, idx) => {
                const isTriple = count === 3;
                const style = (isTriple && idx === 0) ? { gridRow: 'span 2' } : {};
                return (
                    <Box key={idx} sx={{ position: 'relative', width: '100%', height: '100%', ...style }}>
                        <Box component="img" src={src} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer', '&:hover': { filter: 'brightness(0.9)' } }} />
                    </Box>
                );
            })}
        </Box>
    );
};

// --- COMPOSANT : DISCORD PREVIEW ---
const DiscordMessagePreview = ({ payload, loading, onUpdate }) => {
    const DC = {
        bg: "#313338", channelBar: "#2B2D31", messageHover: "#2e3035",
        textMain: "#DBDEE1", textMuted: "#949BA4", divider: "#26272D",
        embedBg: "#2B2D31", blurple: "#5865F2"
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: DC.bg, p: 0 }}>
                {/* Fake Header */}
                <Box sx={{ height: 48, borderBottom: `1px solid ${DC.divider}`, display: 'flex', alignItems: 'center', px: 2, gap: 1 }}>
                    <Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: DC.channelBar }} />
                    <Skeleton variant="text" width={120} sx={{ bgcolor: DC.channelBar }} />
                </Box>
                <Box sx={{ p: 2, mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: DC.channelBar }} />
                        <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width={150} height={24} sx={{ bgcolor: DC.channelBar, mb: 1 }} />
                            <Skeleton variant="text" width="90%" sx={{ bgcolor: DC.channelBar }} />
                            <Skeleton variant="text" width="60%" sx={{ bgcolor: DC.channelBar, mb: 2 }} />

                            {/* Embed Skeleton */}
                            <Box sx={{ borderLeft: `4px solid ${DC.channelBar}`, bgcolor: DC.embedBg, p: 2, borderRadius: 1, maxWidth: 500 }}>
                                <Skeleton variant="text" width="40%" height={28} sx={{ bgcolor: DC.channelBar, mb: 1 }} />
                                <Skeleton variant="text" width="80%" sx={{ bgcolor: DC.channelBar }} />
                                <Skeleton variant="text" width="70%" sx={{ bgcolor: DC.channelBar, mb: 2 }} />
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                    <Skeleton variant="rectangular" height={40} sx={{ bgcolor: DC.channelBar, borderRadius: 1 }} />
                                    <Skeleton variant="rectangular" height={40} sx={{ bgcolor: DC.channelBar, borderRadius: 1 }} />
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        );
    }

    if (!payload?.embeds?.length && !payload?.content) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 2, color: DC.textMuted, opacity: 0.5, bgcolor: DC.bg }}>
                <SettingsEthernetIcon sx={{ fontSize: 60 }} />
                <Typography variant="body2">En attente de contenu</Typography>
            </Box>
        );
    }

    const mainEmbed = payload.embeds?.[0] || {};
    // Est-ce que l'embed a du contenu texte/champs ?
    const hasEmbedContent = mainEmbed.title || mainEmbed.description || (mainEmbed.fields && mainEmbed.fields.length > 0);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: DC.bg, fontFamily: 'gg sans, "Noto Sans", sans-serif' }}>
            {/* Header */}
            <Box sx={{ height: 48, minHeight: 48, borderBottom: `1px solid ${DC.divider}`, display: 'flex', alignItems: 'center', px: 2, gap: 1, bgcolor: DC.bg, boxShadow: '0 1px 0 rgba(4,4,5,0.02),0 1.5px 0 rgba(6,6,7,0.05),0 2px 0 rgba(4,4,5,0.05)' }}>
                <TagIcon sx={{ color: DC.textMuted, fontSize: 24 }} />
                <Typography sx={{ color: '#F2F3F5', fontWeight: 700, fontSize: '1rem', mr: 1 }}>annonces-trades</Typography>
                <Divider orientation="vertical" sx={{ height: 24, bgcolor: '#3F4147', mx: 1 }} />
                <Typography sx={{ color: DC.textMuted, fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>Signaux et analyses automatiques</Typography>
                <Stack direction="row" spacing={2} sx={{ color: DC.textMuted, display: { xs: 'none', md: 'flex' } }}><NotificationsIcon sx={{ fontSize: 22 }} /><PushPinIcon sx={{ fontSize: 22, transform: 'rotate(45deg)' }} /><InboxIcon sx={{ fontSize: 22 }} /><HelpOutlineIcon sx={{ fontSize: 22 }} /></Stack>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 0, '&::-webkit-scrollbar': { width: '8px', bgcolor: '#2B2D31' }, '&::-webkit-scrollbar-thumb': { bgcolor: '#1A1B1E', borderRadius: '4px' } }}>
                <Box sx={{ height: 20 }} />
                <Box sx={{ display: 'flex', gap: 2, px: 2, py: 0.5, mt: 1, '&:hover': { bgcolor: DC.messageHover }, position: 'relative' }}>
                    <Avatar sx={{ bgcolor: DC.blurple, width: 40, height: 40, mt: 0.5 }}>🤖</Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                            <Typography sx={{ color: '#F2F3F5', fontWeight: 500, fontSize: '1rem' }}>TradeForge Bot</Typography>
                            <Chip label="BOT" size="small" sx={{ height: 15, fontSize: '0.625rem', bgcolor: DC.blurple, color: 'white', borderRadius: '3px', px: 0.5, fontWeight: 500 }} />
                            <Typography sx={{ color: DC.textMuted, fontSize: '0.75rem', ml: 0.5 }}>Aujourd'hui à {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                        </Box>
                        {payload.content && <Typography sx={{ color: DC.textMain, whiteSpace: 'pre-wrap', mb: 0.5, fontSize: '1rem', lineHeight: '1.375rem' }}>{payload.content}</Typography>}

                        {/* EMBED PRINCIPAL (SANS IMAGE) */}
                        {hasEmbedContent && (
                            <Box sx={{ bgcolor: DC.embedBg, borderRadius: '4px', maxWidth: 800, borderLeft: `4px solid ${mainEmbed.color ? `#${mainEmbed.color.toString(16)}` : DC.blurple}`, display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                                <Box sx={{ p: 2 }}>
                                    <Stack spacing={1}>
                                        {mainEmbed.author && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                {mainEmbed.author.icon_url && <Avatar src={mainEmbed.author.icon_url} sx={{ width: 24, height: 24 }} />}
                                                <Typography sx={{ color: '#F2F3F5', fontWeight: 600, fontSize: '0.875rem' }}>{mainEmbed.author.name}</Typography>
                                            </Box>
                                        )}
                                        {mainEmbed.title && <InputBase fullWidth multiline value={mainEmbed.title} onChange={(e) => onUpdate && onUpdate('title', e.target.value)} sx={{ color: '#F2F3F5', fontWeight: 600, fontSize: '1rem', p: 0 }} />}
                                        {mainEmbed.description && <InputBase fullWidth multiline value={mainEmbed.description} onChange={(e) => onUpdate && onUpdate('description', e.target.value)} sx={{ color: DC.textMain, fontSize: '0.875rem', lineHeight: '1.125rem', p: 0 }} />}
                                        {mainEmbed.fields?.length > 0 && (
                                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 1, mt: 1 }}>
                                                {mainEmbed.fields.map((field, i) => (
                                                    <Box key={i} sx={{ mb: 1 }}>
                                                        <InputBase fullWidth value={field.name} onChange={(e) => onUpdate && onUpdate('field_name', e.target.value, i)} sx={{ color: DC.textMuted, fontWeight: 600, fontSize: '0.75rem', mb: 0.25, p: 0 }} />
                                                        <InputBase fullWidth multiline value={field.value} onChange={(e) => onUpdate && onUpdate('field_value', e.target.value, i)} sx={{ color: DC.textMain, fontSize: '0.875rem', p: 0 }} />
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                        {mainEmbed.footer && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, pt: 1 }}>
                                                {mainEmbed.footer.icon_url && <Avatar src={mainEmbed.footer.icon_url} sx={{ width: 20, height: 20 }} />}
                                                <Typography sx={{ color: DC.textMuted, fontSize: '0.75rem', fontWeight: 500 }}>{mainEmbed.footer.text}</Typography>
                                            </Box>
                                        )}
                                    </Stack>
                                </Box>
                            </Box>
                        )}

                        {/* IMAGE PRINCIPALE (HORS EMBED BG) */}
                        {mainEmbed.image && mainEmbed.image.url && (
                            <Box sx={{ mt: 0.5, borderRadius: '4px', overflow: 'hidden', maxWidth: 800 }}>
                                <Box component="img" src={mainEmbed.image.url} sx={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }} />
                            </Box>
                        )}

                        {/* GALERIE D'IMAGES SECONDAIRES */}
                        <DiscordImageGrid embeds={payload.embeds} />

                    </Box>
                </Box>
            </Box>

            {/* Fake Input */}
            <Box sx={{ p: 2, pt: 0, bgcolor: DC.bg }}>
                <Box sx={{ bgcolor: '#383A40', borderRadius: '8px', p: 0, px: 2, height: 44, display: 'flex', alignItems: 'center', gap: 2, color: DC.textMuted }}>
                    <AddCircleIcon sx={{ cursor: 'pointer' }} /><Typography fontSize="0.95rem" sx={{ flex: 1 }}>Envoyer un message...</Typography><GifIcon sx={{ fontSize: 28 }} /><EmojiEmotionsIcon sx={{ fontSize: 22 }} />
                </Box>
            </Box>
        </Box>
    );
};

// --- COMPOSANT : STUDIO TOOLBAR ---
const StudioToolbar = ({ currentVariant, onVariantChange, sourceEntry, onOpenSource, onGenerate, isGenerating, webhookStatus, onShowSource }) => {
    const theme = useTheme();
    return (
        <Paper elevation={0} sx={{ p: 1.5, mx: 2, mt: 2, mb: 0, border: `1px solid ${theme.palette.divider}`, borderRadius: '16px', bgcolor: alpha(theme.palette.background.paper, 0.6), backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Stack direction="row" spacing={0.5} sx={{ p: 0.5, bgcolor: theme.palette.action.hover, borderRadius: '12px' }}>
                {VARIANTS.map((v) => (
                    <Button key={v.value} onClick={() => onVariantChange(v.value)} size="small" startIcon={<span>{v.icon}</span>} sx={{ borderRadius: '8px', px: 2, py: 0.5, minWidth: 'auto', color: currentVariant === v.value ? 'white' : 'text.secondary', bgcolor: currentVariant === v.value ? '#5865F2' : 'transparent', fontWeight: currentVariant === v.value ? 700 : 500, '&:hover': { bgcolor: currentVariant === v.value ? '#4752C4' : theme.palette.action.selected } }}>{v.label}</Button>
                ))}
            </Stack>
            <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center' }} />
            {sourceEntry ? (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Chip avatar={<Avatar src={sourceEntry.metadata?.images?.[0]?.src} sx={{ width: 24, height: 24 }}>{sourceEntry.metadata?.symbol?.[0]}</Avatar>} label={<Typography variant="caption" fontWeight={700}>{sourceEntry.metadata?.symbol || "Source"}</Typography>} onDelete={onOpenSource} deleteIcon={<EditIcon sx={{ fontSize: '14px !important' }} />} onClick={onOpenSource} sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main, border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`, fontWeight: 700, cursor: 'pointer' }} />
                    <Tooltip title="Voir le contenu original"><IconButton size="small" onClick={onShowSource} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                </Stack>
            ) : (
                <Button onClick={onOpenSource} startIcon={<AddLinkIcon sx={{ fontSize: 18 }} />} variant="outlined" size="small" sx={{ borderStyle: 'dashed', color: 'text.secondary', borderColor: theme.palette.divider, borderRadius: '20px', textTransform: 'none', px: 2, '&:hover': { borderColor: '#5865F2', color: '#5865F2', bgcolor: alpha('#5865F2', 0.05) } }}>Lier journal</Button>
            )}
            <Box flexGrow={1} />
            <Tooltip title={webhookStatus ? "Connecté" : "Manquant"}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: webhookStatus ? '#23A559' : '#DA373C', boxShadow: webhookStatus ? '0 0 8px #23A559' : 'none' }} /></Box></Tooltip>
            <Button onClick={onGenerate} disabled={isGenerating || !sourceEntry} startIcon={isGenerating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />} sx={{ background: isGenerating || !sourceEntry ? theme.palette.action.disabledBackground : 'linear-gradient(135deg, #5865F2 0%, #4752C4 100%)', color: 'white', borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3, boxShadow: isGenerating ? 'none' : '0px 4px 12px rgba(88, 101, 242, 0.3)', '&:hover': { transform: 'translateY(-1px)', boxShadow: '0px 6px 16px rgba(88, 101, 242, 0.4)' } }}>{isGenerating ? "Générer" : "Créer"}</Button>
        </Paper>
    );
};

// --- COMPOSANT : POST EDITOR (L'ancien DiscordStudio adapté) ---
const PostEditor = ({ post, onSave, onClose, onPublish }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const fileInputRef = useRef(null);

    // Init state from POST prop
    const [selectedEntry, setSelectedEntry] = useState(post.selectedEntry || null);
    const [generatedPost, setGeneratedPost] = useState(post.generatedPost || null);
    const [variant, setVariant] = useState(post.variant || "trade.simple");
    const [contentOverride, setContentOverride] = useState(post.contentOverride || "");
    const [notes, setNotes] = useState(post.notes || "");
    const [activeImages, setActiveImages] = useState(post.activeImages || []);
    const [scheduledTime, setScheduledTime] = useState(post.scheduledAt || "");

    // UI States
    const [mobileTab, setMobileTab] = useState(0);
    const [draggingId, setDraggingId] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [webhookConfigured, setWebhookConfigured] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });
    const [showSource, setShowSource] = useState(false);
    const [journalEntries, setJournalEntries] = useState([]);

    // Load Webhook Status
    useEffect(() => {
        const init = async () => {
            try { const status = await fetchDiscordStatus(); setWebhookConfigured(status?.configured); } catch (e) { setWebhookConfigured(false); }
        }; init();
    }, []);

    // Auto-Save to Parent
    useEffect(() => {
        const updatedPost = {
            ...post,
            selectedEntry,
            generatedPost,
            variant,
            contentOverride,
            notes,
            activeImages,
            scheduledAt: scheduledTime,
            updatedAt: new Date().toISOString(),
            title: generatedPost?.embeds?.[0]?.title || "Nouveau brouillon"
        };
        const timer = setTimeout(() => onSave(updatedPost), 500);
        return () => clearTimeout(timer);
    }, [selectedEntry, generatedPost, variant, contentOverride, notes, activeImages, scheduledTime]);

    const handleSelectEntry = (entry) => {
        setSelectedEntry(entry);
        if (entry?.metadata?.images) {
            const journalImgs = entry.metadata.images
                .filter(i => i.src)
                .map((i, idx) => ({ id: `journal-${i.id || Date.now()}-${idx}`, src: i.src, type: 'journal' }));
            setActiveImages(journalImgs);
        } else {
            setActiveImages([]);
        }
        setIsDialogOpen(false);
    };

    const loadEntries = async () => { try { setJournalEntries(await fetchJournalEntries()); } catch (e) { console.error(e); } };
    const openDialog = () => { setIsDialogOpen(true); if (journalEntries.length === 0) loadEntries(); };

    const handleGenerate = async () => {
        if (!selectedEntry) return;
        setGenerating(true);
        try {
            const data = await generateDiscordPostFromEntry({ entryId: selectedEntry.id, variant });
            setGeneratedPost(data.post);
            setContentOverride(data.post.content || "");
            setNotification({ open: true, message: "Généré !", severity: "success" });
        } catch (err) { setNotification({ open: true, message: err.message, severity: "error" }); } finally { setGenerating(false); }
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            const newItems = await Promise.all(files.map(async f => ({ id: `custom-${Date.now() + Math.random()}`, src: await fileToDataUrl(f), type: 'custom' })));
            setActiveImages(prev => [...prev, ...newItems]);
        }
        if (e.target) e.target.value = "";
    };

    const removeImage = (id) => setActiveImages(prev => prev.filter(img => img.id !== id));
    const moveImage = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= activeImages.length) return;
        setActiveImages(prev => {
            const newList = [...prev];
            const [movedItem] = newList.splice(index, 1);
            newList.splice(newIndex, 0, movedItem);
            return newList;
        });
    };

    // Drag & Drop
    const handleDragStart = (e, id) => setDraggingId(id);
    const handleDragOver = (e) => { e.preventDefault(); };
    const handleDrop = (e, targetId) => {
        e.preventDefault();
        if (!draggingId || draggingId === targetId) return;
        setActiveImages(prev => {
            const newList = [...prev];
            const dragIndex = newList.findIndex(item => item.id === draggingId);
            const targetIndex = newList.findIndex(item => item.id === targetId);
            if (dragIndex === -1 || targetIndex === -1) return prev;
            const [movedItem] = newList.splice(dragIndex, 1);
            newList.splice(targetIndex, 0, movedItem);
            return newList;
        });
        setDraggingId(null);
    };

    const handleFieldUpdate = (type, value, index) => {
        if (!generatedPost) return;
        const newPost = JSON.parse(JSON.stringify(generatedPost));
        const embed = newPost.embeds?.[0];
        if (!embed) return;
        if (type === 'title') embed.title = value;
        else if (type === 'description') embed.description = value;
        else if (embed.fields && index !== undefined) {
            if (type === 'field_name') embed.fields[index].name = value;
            else if (type === 'field_value') embed.fields[index].value = value;
        }
        setGeneratedPost(newPost);
    };

    const previewPayload = useMemo(() => {
        let baseEmbed = generatedPost?.embeds?.[0] ? JSON.parse(JSON.stringify(generatedPost.embeds[0])) : {};
        const embeds = [];
        if (notes.trim()) baseEmbed.description = (baseEmbed.description || "") + `\n\n**Note:** ${notes}`;
        if (!baseEmbed.title && !baseEmbed.description) baseEmbed.description = "...";
        if (baseEmbed.fields && baseEmbed.fields.length === 0) delete baseEmbed.fields;

        if (activeImages.length === 0) embeds.push(baseEmbed);
        else {
            baseEmbed.image = { url: activeImages[0].src };
            embeds.push(baseEmbed);
            const groupUrl = baseEmbed.url || "https://tradeforge.app/grouped";
            baseEmbed.url = groupUrl;
            for (let i = 1; i < Math.min(activeImages.length, 4); i++) embeds.push({ url: groupUrl, image: { url: activeImages[i].src } });
        }
        return { content: contentOverride || null, embeds };
    }, [generatedPost, contentOverride, notes, activeImages]);

    const handlePublishClick = async () => {
        if (!previewPayload || !webhookConfigured) return;
        setSending(true);
        try {
            const finalPayload = { ...previewPayload, scheduledAt: scheduledTime || null };
            await onPublish(post.id, finalPayload, scheduledTime);
            // onPublish handles the logic, we just wait
        } catch (err) { setNotification({ open: true, message: err.message, severity: "error" }); } finally { setSending(false); }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>
            {/* HEADER EDITOR */}
            <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper' }}>
                <Button startIcon={<ArrowBackIcon />} onClick={onClose} sx={{ color: 'text.secondary' }}>Retour</Button>
                <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>Éditeur</Typography>

                <TextField type="datetime-local" size="small" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} sx={{ width: 220 }} InputLabelProps={{ shrink: true }} label="Planifier (Optionnel)" />

                {generatedPost && (
                    <Tooltip title="Copier JSON"><IconButton size="small" onClick={() => { navigator.clipboard.writeText(JSON.stringify(previewPayload, null, 2)); setNotification({ open: true, message: "JSON Copié" }) }}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
                )}

                <Button variant="contained" startIcon={sending ? <CircularProgress size={20} color="inherit" /> : (scheduledTime ? <CalendarTodayIcon /> : <RocketLaunchIcon />)} onClick={handlePublishClick} disabled={sending || !previewPayload || !webhookConfigured} sx={{ bgcolor: scheduledTime ? '#F57C00' : '#5865F2', '&:hover': { bgcolor: scheduledTime ? '#EF6C00' : '#4752C4' }, opacity: (!previewPayload || !webhookConfigured) ? 0.5 : 1 }}>
                    {scheduledTime ? "Planifier" : "Publier"}
                </Button>
            </Box>

            {/* MOBILE TABS */}
            {isMobile && <Tabs value={mobileTab} onChange={(_, v) => setMobileTab(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 48 }}><Tab icon={<EditIcon fontSize="small" />} label="Éditeur" /><Tab icon={<RocketLaunchIcon fontSize="small" />} label="Aperçu" /></Tabs>}

            {/* WORKSPACE */}
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {(!isMobile || mobileTab === 0) && (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`, maxWidth: isMobile ? '100%' : '40%', minWidth: 350, bgcolor: 'background.paper', zIndex: 1 }}>
                        <StudioToolbar currentVariant={variant} onVariantChange={setVariant} sourceEntry={selectedEntry} onOpenSource={openDialog} onGenerate={handleGenerate} isGenerating={generating} webhookStatus={webhookConfigured} onShowSource={() => setShowSource(true)} />
                        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                            {!selectedEntry ? (
                                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, gap: 2 }}>
                                    <AutoAwesomeIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
                                    <Typography variant="body1" color="text.secondary" fontWeight={500}>Sélectionnez une entrée pour commencer</Typography>
                                    <Button variant="outlined" onClick={openDialog}>Ouvrir le journal</Button>
                                </Box>
                            ) : (
                                <Stack spacing={3}>
                                    <Box>
                                        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>MESSAGE</Typography>
                                        <TextField fullWidth multiline minRows={2} placeholder="Message hors embed..." value={contentOverride} onChange={(e) => setContentOverride(e.target.value)} variant="outlined" disabled={!generatedPost} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>NOTE</Typography>
                                        <TextField fullWidth multiline minRows={3} placeholder="Précision dans l'embed..." value={notes} onChange={(e) => setNotes(e.target.value)} variant="outlined" disabled={!generatedPost} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                    </Box>
                                    <Box>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Typography variant="caption" fontWeight="bold" color="text.secondary">MÉDIAS ({activeImages.length})</Typography>
                                            <Button size="small" startIcon={<AddPhotoAlternateIcon />} onClick={() => fileInputRef.current?.click()} disabled={!generatedPost}>Ajouter</Button>
                                        </Stack>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 1, p: 1, bgcolor: alpha(theme.palette.action.hover, 0.5), borderRadius: 2, minHeight: 80 }}>
                                            {activeImages.map((img, index) => (
                                                <Box key={img.id} draggable onDragStart={(e) => handleDragStart(e, img.id)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, img.id)} sx={{ position: 'relative', width: '100%', aspectRatio: '1', cursor: 'grab', opacity: draggingId === img.id ? 0.5 : 1, border: index === 0 ? `2px solid ${theme.palette.primary.main}` : 'none', borderRadius: 1, overflow: 'hidden', '&:hover .image-controls': { opacity: 1 } }}>
                                                    <Box component="img" src={img.src} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <Box className="image-controls" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                        <IconButton size="small" onClick={() => moveImage(index, -1)} disabled={index === 0} sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)', p: 0.5, '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }, '&.Mui-disabled': { opacity: 0.3 } }}><ArrowBackIcon sx={{ fontSize: 16 }} /></IconButton>
                                                        <IconButton size="small" onClick={() => removeImage(img.id)} sx={{ color: 'white', bgcolor: 'rgba(218, 55, 60, 0.8)', p: 0.5, '&:hover': { bgcolor: 'rgba(218, 55, 60, 1)' } }}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton>
                                                        <IconButton size="small" onClick={() => moveImage(index, 1)} disabled={index === activeImages.length - 1} sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)', p: 0.5, '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }, '&.Mui-disabled': { opacity: 0.3 } }}><ArrowForwardIcon sx={{ fontSize: 16 }} /></IconButton>
                                                    </Box>
                                                    {index === 0 && <Chip label="Principal" size="small" color="primary" sx={{ position: 'absolute', bottom: 2, left: 2, height: 16, fontSize: '0.6rem', pointerEvents: 'none' }} />}
                                                </Box>
                                            ))}
                                            {activeImages.length === 0 && <Typography variant="caption" color="text.secondary" sx={{ gridColumn: '1/-1', textAlign: 'center', py: 2 }}>Aucune image</Typography>}
                                        </Box>
                                    </Box>
                                </Stack>
                            )}
                        </Box>
                    </Box>
                )}
                {(!isMobile || mobileTab === 1) && (
                    <Box sx={{ flex: 1.5, bgcolor: '#313338', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <DiscordMessagePreview payload={previewPayload} loading={generating} onUpdate={handleFieldUpdate} />
                    </Box>
                )}
            </Box>
            <input type="file" multiple accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth><DialogTitle>Choisir une source</DialogTitle><DialogContent dividers><List>{journalEntries.slice(0, 6).map(entry => (<ListItemButton key={entry.id} onClick={() => handleSelectEntry(entry)}><ListItemAvatar><Avatar variant="rounded" src={entry.metadata?.images?.[0]?.src}>{entry.type[0].toUpperCase()}</Avatar></ListItemAvatar><ListItemText primary={entry.metadata?.title || "Entrée sans titre"} secondary={entry.metadata?.symbol} /></ListItemButton>))}</List></DialogContent><DialogActions><Button onClick={() => setIsDialogOpen(false)}>Fermer</Button></DialogActions></Dialog>
            <Dialog open={showSource} onClose={() => setShowSource(false)} maxWidth="md" fullWidth><DialogTitle>Contenu Original</DialogTitle><DialogContent dividers><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{selectedEntry ? (selectedEntry.content || "Pas de contenu") : "Aucune entrée sélectionnée"}</Typography>{selectedEntry?.plan && (<Box mt={2}><Typography variant="subtitle2" fontWeight="bold">Plan :</Typography><Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: 'text.secondary' }}>{selectedEntry.plan}</Typography></Box>)}</DialogContent><DialogActions><Button onClick={() => setShowSource(false)}>Fermer</Button></DialogActions></Dialog>
            <Snackbar open={notification.open} autoHideDuration={3000} onClose={() => setNotification(p => ({ ...p, open: false }))}><Alert severity={notification.severity} variant="filled">{notification.message}</Alert></Snackbar>
        </Box>
    );
};

// --- COMPOSANT : DASHBOARD (Nouvelle vue) ---
const PostDashboard = ({ posts, onEdit, onCreate, onDelete }) => {
    const [tab, setTab] = useState(0);
    const filteredPosts = posts.filter(p => {
        if (tab === 0) return p.status === 'draft';
        if (tab === 1) return p.status === 'scheduled';
        return p.status === 'published';
    });

    return (
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>Tableau de bord</Typography>
                <Button variant="contained" startIcon={<AddCircleIcon />} onClick={onCreate} sx={{ bgcolor: '#5865F2', fontWeight: 700 }}>Nouveau Post</Button>
            </Box>

            <Paper sx={{ mb: 3, borderRadius: 2 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="primary" sx={{ px: 2 }}>
                    <Tab label={`Brouillons (${posts.filter(p => p.status === 'draft').length})`} />
                    <Tab label={`Planifiés (${posts.filter(p => p.status === 'scheduled').length})`} />
                    <Tab label={`Publiés (${posts.filter(p => p.status === 'published').length})`} />
                </Tabs>
            </Paper>

            <Grid container spacing={2} sx={{ flex: 1, overflowY: 'auto', pb: 2 }}>
                {filteredPosts.map(post => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={post.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
                            <CardActionArea onClick={() => onEdit(post)} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                                {post.activeImages?.[0]?.src ? (
                                    <CardMedia component="img" height="140" image={post.activeImages[0].src} alt="Post image" />
                                ) : (
                                    <Box sx={{ height: 140, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AutoAwesomeIcon sx={{ color: 'text.disabled', fontSize: 40 }} /></Box>
                                )}
                                <CardContent sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" fontWeight={700} noWrap>{post.title || "Sans titre"}</Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                        Modifié le {new Date(post.updatedAt).toLocaleDateString()}
                                    </Typography>
                                    <Chip label={post.status === 'scheduled' ? new Date(post.scheduledAt).toLocaleDateString() : (post.status === 'published' ? 'Envoyé' : 'Brouillon')} size="small" color={post.status === 'scheduled' ? 'warning' : (post.status === 'published' ? 'success' : 'default')} variant="outlined" />
                                </CardContent>
                            </CardActionArea>
                            <CardActions sx={{ justifyContent: 'flex-end' }}>
                                <IconButton size="small" color="error" onClick={() => onDelete(post.id)}><DeleteOutlineIcon /></IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
                {filteredPosts.length === 0 && (
                    <Box sx={{ width: '100%', textAlign: 'center', mt: 5, color: 'text.secondary' }}>
                        <Typography>Aucun post dans cette catégorie.</Typography>
                    </Box>
                )}
            </Grid>
        </Box>
    );
};

// --- MAIN CONTROLLER ---
const DiscordStudio = () => {
    const [posts, setPosts] = useState([]);
    const [view, setView] = useState('dashboard'); // 'dashboard' | 'editor'
    const [activePostId, setActivePostId] = useState(null);

    // Load posts from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("discord_studio_posts");
        if (saved) {
            try { setPosts(JSON.parse(saved)); } catch (e) { console.error(e); }
        }
    }, []);

    // Save posts to localStorage
    useEffect(() => {
        localStorage.setItem("discord_studio_posts", JSON.stringify(posts));
    }, [posts]);

    const handleCreatePost = () => {
        const newPost = {
            id: Date.now().toString(),
            status: 'draft',
            updatedAt: new Date().toISOString(),
            title: "Nouveau brouillon",
            variant: "trade.simple",
            activeImages: [],
            notes: "",
            contentOverride: ""
        };
        setPosts(prev => [newPost, ...prev]);
        setActivePostId(newPost.id);
        setView('editor');
    };

    const handleEditPost = (post) => {
        setActivePostId(post.id);
        setView('editor');
    };

    const handleSavePost = (updatedPost) => {
        setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    };

    const handleDeletePost = (id) => {
        if (!window.confirm("Supprimer ce post ?")) return;
        setPosts(prev => prev.filter(p => p.id !== id));
    };

    const handlePublishPost = async (id, payload, scheduledAt) => {
        // Here we would normally call the API
        await publishToDiscord(payload);

        // Update status
        setPosts(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, status: scheduledAt ? 'scheduled' : 'published', scheduledAt };
            }
            return p;
        }));

        // Return to dashboard or stay? Let's return to dashboard with success
        // Actually, PostEditor handles the notification. We just update state.
        setView('dashboard');
    };

    const activePost = posts.find(p => p.id === activePostId);

    if (view === 'editor' && activePost) {
        return (
            <PostEditor
                key={activePost.id}
                post={activePost}
                onSave={handleSavePost}
                onClose={() => setView('dashboard')}
                onPublish={handlePublishPost}
            />
        );
    }

    return (
        <PostDashboard
            posts={posts}
            onEdit={handleEditPost}
            onCreate={handleCreatePost}
            onDelete={handleDeletePost}
        />
    );
};

export default DiscordStudio;