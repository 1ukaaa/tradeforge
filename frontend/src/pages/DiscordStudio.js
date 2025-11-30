import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddLinkIcon from "@mui/icons-material/AddLink";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import GifIcon from "@mui/icons-material/Gif";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InboxIcon from "@mui/icons-material/Inbox";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PushPinIcon from "@mui/icons-material/PushPin";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SearchIcon from "@mui/icons-material/Search";
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
    { value: "trade.simple", label: "Trade Recap", icon: "📉", description: "Résumé simple d'un trade" },
    { value: "analysis.deep", label: "Analyse", icon: "🧠", description: "Analyse technique détaillée" },
];

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

// --- COMPOSANT : DISCORD IMAGE GRID ---
const DiscordImageGrid = ({ embeds }) => {
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
            maxWidth: '100%'
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
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: DC.bg }}>
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
                            <Box sx={{ borderLeft: `4px solid ${DC.channelBar}`, bgcolor: DC.embedBg, p: 2, borderRadius: 1, maxWidth: 500 }}>
                                <Skeleton variant="text" width="40%" height={28} sx={{ bgcolor: DC.channelBar, mb: 1 }} />
                                <Skeleton variant="text" width="80%" sx={{ bgcolor: DC.channelBar }} />
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
                <Typography variant="body2">Aperçu du message</Typography>
            </Box>
        );
    }

    const mainEmbed = payload.embeds?.[0] || {};
    const hasEmbedContent = mainEmbed.title || mainEmbed.description || (mainEmbed.fields && mainEmbed.fields.length > 0);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: DC.bg, fontFamily: 'gg sans, "Noto Sans", sans-serif' }}>
            {/* Header Mock */}
            <Box sx={{ height: 48, minHeight: 48, borderBottom: `1px solid ${DC.divider}`, display: 'flex', alignItems: 'center', px: 2, gap: 1, bgcolor: DC.bg, boxShadow: '0 1px 0 rgba(4,4,5,0.02),0 1.5px 0 rgba(6,6,7,0.05),0 2px 0 rgba(4,4,5,0.05)' }}>
                <TagIcon sx={{ color: DC.textMuted, fontSize: 24 }} />
                <Typography sx={{ color: '#F2F3F5', fontWeight: 700, fontSize: '1rem', mr: 1 }}>annonces-trades</Typography>
                <Divider orientation="vertical" sx={{ height: 24, bgcolor: '#3F4147', mx: 1 }} />
                <Typography sx={{ color: DC.textMuted, fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>Signaux et analyses</Typography>
                <Stack direction="row" spacing={2} sx={{ color: DC.textMuted, display: { xs: 'none', md: 'flex' } }}>
                    <NotificationsIcon sx={{ fontSize: 22 }} />
                    <PushPinIcon sx={{ fontSize: 22, transform: 'rotate(45deg)' }} />
                    <InboxIcon sx={{ fontSize: 22 }} />
                    <HelpOutlineIcon sx={{ fontSize: 22 }} />
                </Stack>
            </Box>

            {/* Message Content */}
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

                        {/* EMBED */}
                        {hasEmbedContent && (
                            <Box sx={{ bgcolor: DC.embedBg, borderRadius: '4px', maxWidth: 600, borderLeft: `4px solid ${mainEmbed.color ? `#${mainEmbed.color.toString(16)}` : DC.blurple}`, display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                                <Box sx={{ p: 2 }}>
                                    <Stack spacing={1}>
                                        {mainEmbed.author && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                {mainEmbed.author.icon_url && <Avatar src={mainEmbed.author.icon_url} sx={{ width: 24, height: 24 }} />}
                                                <Typography sx={{ color: '#F2F3F5', fontWeight: 600, fontSize: '0.875rem' }}>{mainEmbed.author.name}</Typography>
                                            </Box>
                                        )}
                                        {mainEmbed.title && (
                                            <InputBase
                                                fullWidth multiline
                                                value={mainEmbed.title}
                                                onChange={(e) => onUpdate && onUpdate('title', e.target.value)}
                                                sx={{ color: '#F2F3F5', fontWeight: 600, fontSize: '1rem', p: 0, '& .MuiInputBase-input': { p: 0 } }}
                                                placeholder="Titre de l'embed"
                                            />
                                        )}
                                        {mainEmbed.description && (
                                            <InputBase
                                                fullWidth multiline
                                                value={mainEmbed.description}
                                                onChange={(e) => onUpdate && onUpdate('description', e.target.value)}
                                                sx={{ color: DC.textMain, fontSize: '0.875rem', lineHeight: '1.125rem', p: 0, '& .MuiInputBase-input': { p: 0 } }}
                                                placeholder="Description de l'embed"
                                            />
                                        )}
                                        {mainEmbed.fields?.length > 0 && (
                                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 2, mt: 1 }}>
                                                {mainEmbed.fields.map((field, i) => (
                                                    <Box key={i}>
                                                        <InputBase
                                                            fullWidth
                                                            value={field.name}
                                                            onChange={(e) => onUpdate && onUpdate('field_name', e.target.value, i)}
                                                            sx={{ color: DC.textMuted, fontWeight: 600, fontSize: '0.75rem', mb: 0.25, p: 0, '& .MuiInputBase-input': { p: 0 } }}
                                                        />
                                                        <InputBase
                                                            fullWidth multiline
                                                            value={field.value}
                                                            onChange={(e) => onUpdate && onUpdate('field_value', e.target.value, i)}
                                                            sx={{ color: DC.textMain, fontSize: '0.875rem', p: 0, '& .MuiInputBase-input': { p: 0 } }}
                                                        />
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
                                {mainEmbed.image && mainEmbed.image.url && (
                                    <Box component="img" src={mainEmbed.image.url} sx={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
                                )}
                            </Box>
                        )}

                        {/* Images Grid if multiple */}
                        <DiscordImageGrid embeds={payload.embeds} />
                    </Box>
                </Box>
            </Box>

            {/* Input Mock */}
            <Box sx={{ p: 2, pt: 0, bgcolor: DC.bg }}>
                <Box sx={{ bgcolor: '#383A40', borderRadius: '8px', px: 2, height: 44, display: 'flex', alignItems: 'center', gap: 2, color: DC.textMuted }}>
                    <AddCircleIcon sx={{ cursor: 'pointer' }} />
                    <Typography fontSize="0.95rem" sx={{ flex: 1 }}>Envoyer un message...</Typography>
                    <GifIcon sx={{ fontSize: 28 }} />
                    <EmojiEmotionsIcon sx={{ fontSize: 22 }} />
                </Box>
            </Box>
        </Box>
    );
};

// --- COMPOSANT : EDITOR TOOLBAR ---
const EditorToolbar = ({ currentVariant, onVariantChange, sourceEntry, onOpenSource, onGenerate, isGenerating, webhookStatus, onShowSource }) => {
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
                        <Tooltip title="Voir le contenu original">
                            <IconButton size="small" onClick={onShowSource} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                                <VisibilityIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Tooltip title={webhookStatus ? "Webhook Connecté" : "Webhook Manquant"}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 2, bgcolor: alpha(webhookStatus ? '#23A559' : '#DA373C', 0.1), color: webhookStatus ? '#23A559' : '#DA373C' }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'currentColor' }} />
                        <Typography variant="caption" fontWeight={700}>{webhookStatus ? "ON" : "OFF"}</Typography>
                    </Box>
                </Tooltip>
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
                        background: 'linear-gradient(135deg, #5865F2 0%, #4752C4 100%)',
                        boxShadow: '0 4px 12px rgba(88, 101, 242, 0.3)'
                    }}
                >
                    {isGenerating ? "Génération..." : "Générer"}
                </Button>
            </Box>
        </Paper>
    );
};

// --- COMPOSANT : POST EDITOR ---
const PostEditor = ({ post, onSave, onClose, onPublish }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const fileInputRef = useRef(null);

    // State
    const [selectedEntry, setSelectedEntry] = useState(post.selectedEntry || null);
    const [generatedPost, setGeneratedPost] = useState(post.generatedPost || null);
    const [variant, setVariant] = useState(post.variant || "trade.simple");
    const [contentOverride, setContentOverride] = useState(post.contentOverride || "");
    const [notes, setNotes] = useState(post.notes || "");
    const [activeImages, setActiveImages] = useState(post.activeImages || []);
    const [scheduledTime, setScheduledTime] = useState(post.scheduledAt || "");

    // UI State
    const [mobileTab, setMobileTab] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [webhookConfigured, setWebhookConfigured] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });
    const [showSource, setShowSource] = useState(false);
    const [journalEntries, setJournalEntries] = useState([]);

    // Effects
    useEffect(() => {
        const init = async () => {
            try { const status = await fetchDiscordStatus(); setWebhookConfigured(status?.configured); } catch (e) { setWebhookConfigured(false); }
        }; init();
    }, []);

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
        const timer = setTimeout(() => onSave(updatedPost), 800);
        return () => clearTimeout(timer);
    }, [selectedEntry, generatedPost, variant, contentOverride, notes, activeImages, scheduledTime]);

    // Handlers
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
            setNotification({ open: true, message: "Contenu généré avec succès !", severity: "success" });
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
        } catch (err) { setNotification({ open: true, message: err.message, severity: "error" }); } finally { setSending(false); }
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>
            {/* TOP BAR */}
            <Paper elevation={0} sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper', zIndex: 10 }}>
                <Button startIcon={<ArrowBackIcon />} onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>Retour</Button>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>Éditeur de Post</Typography>

                <TextField
                    type="datetime-local"
                    size="small"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    sx={{ width: 220 }}
                    InputLabelProps={{ shrink: true }}
                    label="Planifier (Optionnel)"
                />

                <Button
                    variant="contained"
                    startIcon={sending ? <CircularProgress size={20} color="inherit" /> : (scheduledTime ? <CalendarTodayIcon /> : <RocketLaunchIcon />)}
                    onClick={handlePublishClick}
                    disabled={sending || !previewPayload || !webhookConfigured}
                    sx={{
                        bgcolor: scheduledTime ? '#F57C00' : '#5865F2',
                        '&:hover': { bgcolor: scheduledTime ? '#EF6C00' : '#4752C4' },
                        borderRadius: 2,
                        px: 3,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                    }}
                >
                    {scheduledTime ? "Planifier" : "Publier"}
                </Button>
            </Paper>

            {/* MOBILE TABS */}
            {isMobile && <Tabs value={mobileTab} onChange={(_, v) => setMobileTab(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 48 }}><Tab icon={<EditIcon fontSize="small" />} label="Éditeur" /><Tab icon={<RocketLaunchIcon fontSize="small" />} label="Aperçu" /></Tabs>}

            {/* MAIN CONTENT */}
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* LEFT PANEL: TOOLS */}
                {(!isMobile || mobileTab === 0) && (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`, maxWidth: isMobile ? '100%' : '550px', minWidth: 350, bgcolor: 'background.paper', overflowY: 'auto' }}>
                        <Box sx={{ p: 3 }}>
                            <EditorToolbar
                                currentVariant={variant}
                                onVariantChange={setVariant}
                                sourceEntry={selectedEntry}
                                onOpenSource={openDialog}
                                onGenerate={handleGenerate}
                                isGenerating={generating}
                                webhookStatus={webhookConfigured}
                                onShowSource={() => setShowSource(true)}
                            />

                            {!selectedEntry ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2, opacity: 0.7 }}>
                                    <AutoAwesomeIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary">Commencez par lier une entrée</Typography>
                                    <Typography variant="body2" color="text.disabled" align="center" sx={{ maxWidth: 300 }}>
                                        Sélectionnez une entrée de votre journal pour générer automatiquement un post Discord formaté.
                                    </Typography>
                                    <Button variant="outlined" onClick={openDialog} sx={{ mt: 2 }}>Ouvrir le journal</Button>
                                </Box>
                            ) : (
                                <Stack spacing={4}>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <EditIcon fontSize="small" /> MESSAGE
                                        </Typography>
                                        <TextField
                                            fullWidth multiline minRows={3}
                                            placeholder="Message d'introduction (hors embed)..."
                                            value={contentOverride}
                                            onChange={(e) => setContentOverride(e.target.value)}
                                            variant="outlined"
                                            disabled={!generatedPost}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                                        />
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <PushPinIcon fontSize="small" /> NOTE
                                        </Typography>
                                        <TextField
                                            fullWidth multiline minRows={3}
                                            placeholder="Ajouter une note ou une précision dans l'embed..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            variant="outlined"
                                            disabled={!generatedPost}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }}
                                        />
                                    </Box>
                                    <Box>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                                            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <AddPhotoAlternateIcon fontSize="small" /> MÉDIAS ({activeImages.length})
                                            </Typography>
                                            <Button size="small" startIcon={<AddCircleIcon />} onClick={() => fileInputRef.current?.click()} disabled={!generatedPost}>Ajouter</Button>
                                        </Stack>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 1.5 }}>
                                            {activeImages.map((img, index) => (
                                                <Paper key={img.id} elevation={0} sx={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                                                    <Box component="img" src={img.src} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <Box sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.6)', borderRadius: '50%' }}>
                                                        <IconButton size="small" onClick={() => removeImage(img.id)} sx={{ color: 'white', p: 0.5 }}><CloseIcon sx={{ fontSize: 14 }} /></IconButton>
                                                    </Box>
                                                    {index === 0 && <Chip label="Cover" size="small" color="primary" sx={{ position: 'absolute', bottom: 4, left: 4, height: 16, fontSize: '0.6rem' }} />}
                                                </Paper>
                                            ))}
                                            <Button
                                                variant="outlined"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={!generatedPost}
                                                sx={{ aspectRatio: '1', borderStyle: 'dashed', borderRadius: 2, flexDirection: 'column', gap: 1 }}
                                            >
                                                <AddPhotoAlternateIcon color="action" />
                                                <Typography variant="caption" color="text.secondary">Upload</Typography>
                                            </Button>
                                        </Box>
                                    </Box>
                                </Stack>
                            )}
                        </Box>
                    </Box>
                )}

                {/* RIGHT PANEL: PREVIEW */}
                {(!isMobile || mobileTab === 1) && (
                    <Box sx={{ flex: 1, bgcolor: '#1E1F22', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <DiscordMessagePreview payload={previewPayload} loading={generating} onUpdate={handleFieldUpdate} />
                        </Box>
                    </Box>
                )}
            </Box>

            <input type="file" multiple accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />

            {/* DIALOGS */}
            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Sélectionner une entrée</DialogTitle>
                <DialogContent dividers>
                    <List>
                        {journalEntries.slice(0, 6).map(entry => (
                            <ListItemButton key={entry.id} onClick={() => handleSelectEntry(entry)} sx={{ borderRadius: 2, mb: 1 }}>
                                <ListItemAvatar>
                                    <Avatar variant="rounded" src={entry.metadata?.images?.[0]?.src} sx={{ bgcolor: theme.palette.primary.main }}>{entry.type[0].toUpperCase()}</Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={<Typography fontWeight={600}>{entry.metadata?.title || "Entrée sans titre"}</Typography>}
                                    secondary={entry.metadata?.symbol}
                                />
                                <ArrowForwardIcon color="action" fontSize="small" />
                            </ListItemButton>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions><Button onClick={() => setIsDialogOpen(false)}>Annuler</Button></DialogActions>
            </Dialog>

            <Dialog open={showSource} onClose={() => setShowSource(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Contenu Original</DialogTitle>
                <DialogContent dividers>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {selectedEntry ? (selectedEntry.content || "Pas de contenu") : "Aucune entrée sélectionnée"}
                    </Paper>
                </DialogContent>
                <DialogActions><Button onClick={() => setShowSource(false)}>Fermer</Button></DialogActions>
            </Dialog>

            <Snackbar open={notification.open} autoHideDuration={3000} onClose={() => setNotification(p => ({ ...p, open: false }))}>
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

const PostDashboard = ({ posts, onEdit, onCreate, onDelete }) => {
    const theme = useTheme();
    const [tab, setTab] = useState(0);
    const [search, setSearch] = useState("");

    const filteredPosts = posts.filter(p => {
        const matchesTab = (tab === 0 && p.status === 'draft') || (tab === 1 && p.status === 'scheduled') || (tab === 2 && p.status === 'published');
        const matchesSearch = p.title?.toLowerCase().includes(search.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const stats = {
        drafts: posts.filter(p => p.status === 'draft').length,
        scheduled: posts.filter(p => p.status === 'scheduled').length,
        published: posts.filter(p => p.status === 'published').length
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflowY: 'auto' }}>
            {/* HEADER */}
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
                                Discord Studio
                            </Typography>
                            <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 600 }}>
                                Créez, planifiez et publiez vos analyses et signaux de trading directement vers vos serveurs Discord.
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                                <StatCard title="Brouillons" value={stats.drafts} icon={<EditIcon />} color={theme.palette.text.secondary} />
                                <StatCard title="Planifiés" value={stats.scheduled} icon={<CalendarTodayIcon />} color="#F57C00" />
                                <StatCard title="Publiés" value={stats.published} icon={<CheckCircleIcon />} color="#23A559" />
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
                        <Tab label="Planifiés" />
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
                                background: 'linear-gradient(135deg, #5865F2 0%, #4752C4 100%)',
                                boxShadow: '0 4px 12px rgba(88, 101, 242, 0.3)'
                            }}
                        >
                            Créer
                        </Button>
                    </Stack>
                </Box>

                <Grid container spacing={3}>
                    {filteredPosts.map(post => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={post.id}>
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
                                    <CardActionArea onClick={() => onEdit(post)} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                                        <Box sx={{ height: 160, position: 'relative', overflow: 'hidden' }}>
                                            {post.activeImages?.[0]?.src ? (
                                                <CardMedia component="img" height="100%" image={post.activeImages[0].src} alt="Post image" sx={{ transition: 'transform 0.5s', '&:hover': { transform: 'scale(1.05)' } }} />
                                            ) : (
                                                <Box sx={{ height: '100%', bgcolor: alpha(theme.palette.action.hover, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
                                                    <AutoAwesomeIcon sx={{ color: theme.palette.divider, fontSize: 40 }} />
                                                </Box>
                                            )}
                                            <Chip
                                                label={post.variant === 'trade.simple' ? 'Trade' : 'Analyse'}
                                                size="small"
                                                sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(4px)', border: 'none' }}
                                            />
                                        </Box>
                                        <CardContent sx={{ flex: 1, p: 2.5 }}>
                                            <Typography variant="h6" fontWeight={700} noWrap sx={{ mb: 1 }}>{post.title || "Sans titre"}</Typography>
                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                                <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    {post.status === 'scheduled' ? `Prévu : ${formatDate(post.scheduledAt)}` : `Modifié : ${formatDate(post.updatedAt)}`}
                                                </Typography>
                                            </Stack>
                                            <Chip
                                                label={post.status === 'scheduled' ? 'Planifié' : (post.status === 'published' ? 'Publié' : 'Brouillon')}
                                                size="small"
                                                color={post.status === 'scheduled' ? 'warning' : (post.status === 'published' ? 'success' : 'default')}
                                                variant="outlined"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </CardContent>
                                    </CardActionArea>
                                    <Divider />
                                    <CardActions sx={{ justifyContent: 'space-between', p: 1.5 }}>
                                        <Button size="small" color="inherit" onClick={() => onEdit(post)}>Éditer</Button>
                                        <IconButton size="small" color="error" onClick={() => onDelete(post.id)} sx={{ opacity: 0.7, '&:hover': { opacity: 1, bgcolor: alpha(theme.palette.error.main, 0.1) } }}>
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </Fade>
                        </Grid>
                    ))}
                    {filteredPosts.length === 0 && (
                        <Box sx={{ width: '100%', textAlign: 'center', mt: 8, color: 'text.secondary' }}>
                            <InboxIcon sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
                            <Typography variant="h6">Aucun post trouvé</Typography>
                            <Typography variant="body2" color="text.disabled">Créez un nouveau post pour commencer.</Typography>
                        </Box>
                    )}
                </Grid>
            </Container>
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
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce post ?")) return;
        setPosts(prev => prev.filter(p => p.id !== id));
    };

    const handlePublishPost = async (id, payload, scheduledAt) => {
        await publishToDiscord(payload);
        setPosts(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, status: scheduledAt ? 'scheduled' : 'published', scheduledAt };
            }
            return p;
        }));
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