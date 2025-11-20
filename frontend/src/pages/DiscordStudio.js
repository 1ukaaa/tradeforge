import AddCircleIcon from "@mui/icons-material/AddCircle";
import AddLinkIcon from "@mui/icons-material/AddLink";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
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
            maxWidth: '520px'
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
const DiscordMessagePreview = ({ payload, loading }) => {
  const DC = {
    bg: "#313338", channelBar: "#2B2D31", messageHover: "#2e3035",
    textMain: "#DBDEE1", textMuted: "#949BA4", divider: "#26272D",
    embedBg: "#2B2D31", blurple: "#5865F2"
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 2, color: DC.textMuted, bgcolor: DC.bg }}>
        <CircularProgress size={40} sx={{ color: DC.blurple }} />
        <Typography variant="body2">Rédaction en cours...</Typography>
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
                        <Typography sx={{ color: DC.textMuted, fontSize: '0.75rem', ml: 0.5 }}>Aujourd'hui à {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Typography>
                    </Box>
                    {payload.content && <Typography sx={{ color: DC.textMain, whiteSpace: 'pre-wrap', mb: 0.5, fontSize: '1rem', lineHeight: '1.375rem' }}>{payload.content}</Typography>}
                    
                    {/* EMBED PRINCIPAL (SANS IMAGE) */}
                    {hasEmbedContent && (
                        <Box sx={{ bgcolor: DC.embedBg, borderRadius: '4px', maxWidth: 520, borderLeft: `4px solid ${mainEmbed.color ? `#${mainEmbed.color.toString(16)}` : DC.blurple}`, display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                            <Box sx={{ p: 2 }}>
                                <Stack spacing={1}>
                                    {mainEmbed.author && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            {mainEmbed.author.icon_url && <Avatar src={mainEmbed.author.icon_url} sx={{ width: 24, height: 24 }} />}
                                            <Typography sx={{ color: '#F2F3F5', fontWeight: 600, fontSize: '0.875rem' }}>{mainEmbed.author.name}</Typography>
                                        </Box>
                                    )}
                                    {mainEmbed.title && <Typography sx={{ color: '#F2F3F5', fontWeight: 600, fontSize: '1rem' }}>{mainEmbed.title}</Typography>}
                                    {mainEmbed.description && <Typography sx={{ color: DC.textMain, fontSize: '0.875rem', whiteSpace: 'pre-wrap', lineHeight: '1.125rem' }}>{mainEmbed.description}</Typography>}
                                    {mainEmbed.fields?.length > 0 && (
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 1, mt: 1 }}>
                                            {mainEmbed.fields.map((field, i) => (
                                                <Box key={i} sx={{ mb: 1 }}>
                                                    <Typography sx={{ color: DC.textMuted, fontWeight: 600, fontSize: '0.75rem', mb: 0.25 }}>{field.name}</Typography>
                                                    <Typography sx={{ color: DC.textMain, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{field.value}</Typography>
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
                        <Box sx={{ mt: 0.5, borderRadius: '4px', overflow: 'hidden', maxWidth: 520 }}>
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
const StudioToolbar = ({ currentVariant, onVariantChange, sourceEntry, onOpenSource, onGenerate, isGenerating, webhookStatus }) => {
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
                <Chip avatar={<Avatar src={sourceEntry.metadata?.images?.[0]?.src} sx={{ width: 24, height: 24 }}>{sourceEntry.metadata?.symbol?.[0]}</Avatar>} label={<Typography variant="caption" fontWeight={700}>{sourceEntry.metadata?.symbol || "Source"}</Typography>} onDelete={onOpenSource} deleteIcon={<EditIcon sx={{ fontSize: '14px !important' }} />} onClick={onOpenSource} sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main, border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`, fontWeight: 700, cursor: 'pointer' }} />
            ) : (
                <Button onClick={onOpenSource} startIcon={<AddLinkIcon sx={{ fontSize: 18 }} />} variant="outlined" size="small" sx={{ borderStyle: 'dashed', color: 'text.secondary', borderColor: theme.palette.divider, borderRadius: '20px', textTransform: 'none', px: 2, '&:hover': { borderColor: '#5865F2', color: '#5865F2', bgcolor: alpha('#5865F2', 0.05) } }}>Lier journal</Button>
            )}
            <Box flexGrow={1} />
            <Tooltip title={webhookStatus ? "Connecté" : "Manquant"}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: webhookStatus ? '#23A559' : '#DA373C', boxShadow: webhookStatus ? '0 0 8px #23A559' : 'none' }} /></Box></Tooltip>
            <Button onClick={onGenerate} disabled={isGenerating || !sourceEntry} startIcon={isGenerating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />} sx={{ background: isGenerating || !sourceEntry ? theme.palette.action.disabledBackground : 'linear-gradient(135deg, #5865F2 0%, #4752C4 100%)', color: 'white', borderRadius: '12px', textTransform: 'none', fontWeight: 700, px: 3, boxShadow: isGenerating ? 'none' : '0px 4px 12px rgba(88, 101, 242, 0.3)', '&:hover': { transform: 'translateY(-1px)', boxShadow: '0px 6px 16px rgba(88, 101, 242, 0.4)' } }}>{isGenerating ? "Générer" : "Créer"}</Button>
        </Paper>
    );
};

// --- MAIN PAGE ---

const DiscordStudio = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fileInputRef = useRef(null);

  const [journalEntries, setJournalEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [generatedPost, setGeneratedPost] = useState(null);
  const [variant, setVariant] = useState("trade.simple");
  const [contentOverride, setContentOverride] = useState("");
  const [notes, setNotes] = useState("");
  const [mobileTab, setMobileTab] = useState(0);
  
  const [activeImages, setActiveImages] = useState([]); 
  const [draggingId, setDraggingId] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });

  useEffect(() => {
    const init = async () => {
        try { const status = await fetchDiscordStatus(); setWebhookConfigured(status?.configured); } catch(e) { setWebhookConfigured(false); }
    }; init();
  }, []);

  useEffect(() => {
      if (selectedEntry?.metadata?.images) {
          const journalImgs = selectedEntry.metadata.images
            .filter(i => i.src)
            .map(i => ({ id: `journal-${i.id || Date.now()}`, src: i.src, type: 'journal' }));
          setActiveImages(journalImgs);
      } else {
          setActiveImages([]);
      }
  }, [selectedEntry]);

  const loadEntries = async () => { try { setJournalEntries(await fetchJournalEntries()); } catch(e) { console.error(e); } };
  const openDialog = () => { setIsDialogOpen(true); if(journalEntries.length === 0) loadEntries(); };

  const handleGenerate = async () => {
      if(!selectedEntry) return;
      setGenerating(true);
      try {
          const data = await generateDiscordPostFromEntry({ entryId: selectedEntry.id, variant });
          setGeneratedPost(data.post);
          setContentOverride(data.post.content || "");
          setNotification({ open: true, message: "Généré !", severity: "success" });
      } catch(err) { setNotification({ open: true, message: err.message, severity: "error" }); } finally { setGenerating(false); }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if(files.length > 0) {
        const newItems = await Promise.all(files.map(async f => ({ id: `custom-${Date.now()+Math.random()}`, src: await fileToDataUrl(f), type: 'custom' })));
        setActiveImages(prev => [...prev, ...newItems]);
    }
    if (e.target) e.target.value = "";
  };

  const removeImage = (id) => {
      setActiveImages(prev => prev.filter(img => img.id !== id));
  };

  // --- DRAG & DROP LOGIC ---
  const handleDragStart = (e, id) => setDraggingId(id);
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e, targetId) => {
      e.preventDefault();
      if (!draggingId || draggingId === targetId) return;
      
      setActiveImages(prev => {
          const newList = [...prev];
          const dragIndex = newList.findIndex(item => item.id === draggingId);
          const targetIndex = newList.findIndex(item => item.id === targetId);
          if(dragIndex === -1 || targetIndex === -1) return prev;
          const [movedItem] = newList.splice(dragIndex, 1);
          newList.splice(targetIndex, 0, movedItem);
          return newList;
      });
      setDraggingId(null);
  };

  const previewPayload = useMemo(() => {
      let baseEmbed = generatedPost?.embeds?.[0] ? JSON.parse(JSON.stringify(generatedPost.embeds[0])) : {};
      const embeds = [];

      if (notes.trim()) {
          baseEmbed.description = (baseEmbed.description || "") + `\n\n**Note:** ${notes}`;
      }
      if (!baseEmbed.title && !baseEmbed.description) baseEmbed.description = "...";
      if (baseEmbed.fields && baseEmbed.fields.length === 0) delete baseEmbed.fields;

      if (activeImages.length === 0) {
           embeds.push(baseEmbed);
      } else {
           baseEmbed.image = { url: activeImages[0].src };
           embeds.push(baseEmbed);
           const groupUrl = baseEmbed.url || "https://tradeforge.app/grouped"; 
           baseEmbed.url = groupUrl;
           for (let i = 1; i < Math.min(activeImages.length, 4); i++) {
               embeds.push({ url: groupUrl, image: { url: activeImages[i].src } });
           }
      }
      return { content: contentOverride || null, embeds };
  }, [generatedPost, contentOverride, notes, activeImages]);

  const handlePublish = async () => {
      if(!previewPayload || !webhookConfigured) return;
      setSending(true);
      try {
          await publishToDiscord(previewPayload);
          setNotification({ open: true, message: "Envoyé sur Discord !", severity: "success" });
          setNotes(""); setActiveImages(prev => prev.filter(i => i.type === 'journal'));
      } catch(err) { setNotification({ open: true, message: err.message, severity: "error" }); } finally { setSending(false); }
  };

  const handleReset = () => {
      if(!window.confirm("Tout effacer ?")) return;
      setGeneratedPost(null); setSelectedEntry(null); setContentOverride(""); setNotes(""); setActiveImages([]);
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>
      <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: 'background.paper' }}>
        
        {/* HEADER */}
        <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper' }}>
            <IconButton disabled><ArrowBackIcon /></IconButton>
            <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>Discord Studio</Typography>
            {generatedPost && (
                <>
                    <Tooltip title="Copier JSON"><IconButton size="small" onClick={() => { navigator.clipboard.writeText(JSON.stringify(previewPayload, null, 2)); setNotification({open:true, message:"JSON Copié"}) }}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Effacer"><IconButton size="small" color="error" onClick={handleReset} sx={{ mr: 1 }}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                </>
            )}
            <Button variant="contained" startIcon={sending ? <CircularProgress size={20} color="inherit"/> : <RocketLaunchIcon />} onClick={handlePublish} disabled={sending || !previewPayload || !webhookConfigured} sx={{ bgcolor: '#5865F2', '&:hover': { bgcolor: '#4752C4' }, opacity: (!previewPayload || !webhookConfigured) ? 0.5 : 1 }}>Publier</Button>
        </Box>

        {/* MOBILE TABS */}
        {isMobile && <Tabs value={mobileTab} onChange={(_, v) => setMobileTab(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 48 }}><Tab icon={<EditIcon fontSize="small" />} label="Éditeur" /><Tab icon={<RocketLaunchIcon fontSize="small" />} label="Aperçu" /></Tabs>}

        {/* WORKSPACE */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* LEFT: EDITOR */}
            {(!isMobile || mobileTab === 0) && (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`, maxWidth: isMobile ? '100%' : '40%', minWidth: 350, bgcolor: 'background.paper', zIndex: 1 }}>
                    <StudioToolbar currentVariant={variant} onVariantChange={setVariant} sourceEntry={selectedEntry} onOpenSource={openDialog} onGenerate={handleGenerate} isGenerating={generating} webhookStatus={webhookConfigured} />
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
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
                                    <Typography variant="caption" fontWeight="bold" color="text.secondary">MÉDIAS ({ activeImages.length })</Typography>
                                    <Button size="small" startIcon={<AddPhotoAlternateIcon />} onClick={() => fileInputRef.current?.click()} disabled={!generatedPost}>Ajouter</Button>
                                </Stack>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 1, p: 1, bgcolor: alpha(theme.palette.action.hover, 0.5), borderRadius: 2, minHeight: 80 }}>
                                    {activeImages.map((img, index) => (
                                        <Box key={img.id} draggable onDragStart={(e) => handleDragStart(e, img.id)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, img.id)} sx={{ position: 'relative', width: '100%', aspectRatio: '1', cursor: 'grab', opacity: draggingId === img.id ? 0.5 : 1, border: index === 0 ? `2px solid ${theme.palette.primary.main}` : 'none', borderRadius: 1, overflow: 'hidden' }}>
                                            <Box component="img" src={img.src} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <IconButton size="small" onClick={() => removeImage(img.id)} sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.6)', p: 0.5, '&:hover':{bgcolor:'rgba(0,0,0,0.8)'}, color: 'white' }}><CloseIcon sx={{ fontSize: 12 }} /></IconButton>
                                            {index === 0 && <Chip label="Principal" size="small" color="primary" sx={{ position: 'absolute', bottom: 2, left: 2, height: 16, fontSize: '0.6rem' }} />}
                                        </Box>
                                    ))}
                                    {activeImages.length === 0 && <Typography variant="caption" color="text.secondary" sx={{ gridColumn: '1/-1', textAlign: 'center', py: 2 }}>Aucune image</Typography>}
                                </Box>
                            </Box>
                        </Stack>
                    </Box>
                </Box>
            )}

            {/* RIGHT: PREVIEW */}
            {(!isMobile || mobileTab === 1) && (
                <Box sx={{ flex: 1.5, bgcolor: '#313338', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <DiscordMessagePreview payload={previewPayload} loading={generating} />
                </Box>
            )}
        </Box>
      </Paper>
      <input type="file" multiple accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth><DialogTitle>Choisir une source</DialogTitle><DialogContent dividers><List>{journalEntries.slice(0, 6).map(entry => (<ListItemButton key={entry.id} onClick={() => { setSelectedEntry(entry); setIsDialogOpen(false); }}><ListItemAvatar><Avatar variant="rounded" src={entry.metadata?.images?.[0]?.src}>{entry.type[0].toUpperCase()}</Avatar></ListItemAvatar><ListItemText primary={entry.metadata?.title || "Entrée sans titre"} secondary={entry.metadata?.symbol} /></ListItemButton>))}</List></DialogContent><DialogActions><Button onClick={() => setIsDialogOpen(false)}>Fermer</Button></DialogActions></Dialog>
      <Snackbar open={notification.open} autoHideDuration={3000} onClose={() => setNotification(p => ({...p, open: false}))}><Alert severity={notification.severity} variant="filled">{notification.message}</Alert></Snackbar>
    </Box>
  );
};

export default DiscordStudio;