// frontend/src/components/InspectorEntryCard.js
import PhotoIcon from "@mui/icons-material/Photo";
import { alpha, Box, Chip, Paper, Stack, SvgIcon, Typography, useTheme } from "@mui/material";
import { formatDate, getEntryDirection, getEntryImage, getEntryTitle, resultTone, typeLabel } from "../utils/journalUtils";


// --- MODIFICATION : Graphiques "PRO" avec PLUS de VAGUES ---
const SparklineUpPro = ({ color = 'currentColor' }) => (
  <SvgIcon viewBox="0 0 100 60" sx={{ width: '100%', height: '100%', color }}> 
    <defs>
      <linearGradient id="sparkline-up-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={0.4} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
    {/* Tracé "Tendance haussière avec plus de vagues" */}
    <path 
      d="M 5 55 
         C 15 50, 20 30, 30 35 
         S 40 55, 45 45 
         S 55 20, 60 25 
         S 70 10, 80 15 
         S 85 5, 95 5"
      fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
    />
    <path 
      d="M 5 55 
         C 15 50, 20 30, 30 35 
         S 40 55, 45 45 
         S 55 20, 60 25 
         S 70 10, 80 15 
         S 85 5, 95 5
         L 95 60 L 5 60 Z"
      fill="url(#sparkline-up-gradient)" stroke="none" 
    />
  </SvgIcon>
);

const SparklineDownPro = ({ color = 'currentColor' }) => (
  <SvgIcon viewBox="0 0 100 60" sx={{ width: '100%', height: '100%', color }}>
    <defs>
      <linearGradient id="sparkline-down-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={0.4} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
    {/* Tracé "Tendance baissière avec plus de vagues" */}
    <path 
      d="M 5 5 
         C 15 10, 20 30, 30 25 
         S 40 5, 45 15 
         S 55 40, 60 35 
         S 70 50, 80 45 
         S 85 55, 95 55" 
      fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
    />
    <path 
      d="M 5 5 
         C 15 10, 20 30, 30 25 
         S 40 5, 45 15 
         S 55 40, 60 35 
         S 70 50, 80 45 
         S 85 55, 95 55
         L 95 60 L 5 60 Z"
      fill="url(#sparkline-down-gradient)" stroke="none" 
    />
  </SvgIcon>
);

const SparklineConsolidation = ({ color = 'currentColor' }) => (
  <SvgIcon viewBox="0 0 100 60" sx={{ width: '100%', height: '100%', color }}>
    <defs>
      <linearGradient id="sparkline-be-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={0.4} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
    {/* Tracé "Consolidation avec plus de vagues" */}
    <path 
      d="M 5 30 
         C 15 10, 25 50, 35 30 
         S 45 10, 55 30 
         S 65 50, 75 30 
         S 85 10, 95 30" 
      fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
    />
    <path 
      d="M 5 30 
         C 15 10, 25 50, 35 30 
         S 45 10, 55 30 
         S 65 50, 75 30 
         S 85 10, 95 30
         L 95 60 L 5 60 Z"
      fill="url(#sparkline-be-gradient)" stroke="none" 
    />
  </SvgIcon>
);
// --- FIN MODIFICATION ---


export const InspectorEntryCard = ({ entry, onClick }) => {
  const theme = useTheme();
  const meta = entry.metadata || {};
  const firstImage = getEntryImage(entry);
  const title = getEntryTitle(entry);
  const dateLabel = formatDate(meta.date || entry.createdAt);
  const typeInfo = typeLabel[entry.type] || { chip: "Entrée", color: "default" };
  const symbol = meta.symbol || "N/A";

  const isTrade = entry.type === 'trade';
  const tone = resultTone(meta.result); 
  const graphColor = theme.palette[tone]?.main || theme.palette.text.secondary;
  const direction = getEntryDirection(entry);

  return (
    <Paper
      onClick={onClick}
      variant="outlined"
      sx={{
        display: "flex", flexDirection: "row", overflow: "hidden", cursor: "pointer",
        "&:hover": {
          "& .slide-up-bandeau": { transform: 'translateY(0%)' },
          "& .image-main": { transform: 'scale(1.1)', filter: 'brightness(0.6)' },
        },
      }}
    >
      {/* 1. Bloc Image (inchangé) */}
      <Box
        sx={{
          width: { xs: 120, sm: 160, md: 200 }, flexShrink: 0, aspectRatio: "16/10",
          position: "relative", background: alpha(theme.palette.divider, 0.05),
          overflow: 'hidden', 
        }}
      >
        <Box
          className="image-main"
          sx={{
            width: '100%', 
            height: '100%',
            transition: 'transform 0.3s ease-out, filter 0.3s ease-out',
          }}
        >
          {firstImage ? (
            <img src={firstImage} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Stack sx={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center", color: "text.secondary", opacity: 0.5 }}>
              <PhotoIcon sx={{ fontSize: 40 }} />
            </Stack>
          )}
        </Box>
        
        <Box
          className="slide-up-bandeau"
          sx={{
            position: 'absolute', bottom: 0, left: 0, width: '100%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
            color: 'white', padding: 1.5, paddingTop: 3,
            transform: 'translateY(100%)',
            transition: 'transform 0.3s ease-out',
          }}
        >
          <Stack>
            <Chip label={typeInfo.chip} size="small" color={typeInfo.color} variant="filled" sx={{width: 'fit-content', mb: 1}} />
            <Typography variant="h6" fontWeight={600} noWrap>{symbol}</Typography>
            <Typography variant="caption" sx={{fontFamily: 'monospace'}}>{dateLabel}</Typography>
          </Stack>
        </Box>
      </Box>
      
      {/* 2. Bloc Contenu (Centré) */}
      <Stack 
        spacing={1.5} 
        sx={{ 
          p: { xs: 2, md: 2.5 }, 
          flex: 1, // Prend l'espace disponible
          minWidth: 0, 
          justifyContent: "center"
        }}
      >
        <Typography variant="h6" fontWeight={600} title={title} noWrap sx={{ lineHeight: 1.3 }}>
          {title}
        </Typography>
        {isTrade && (
          <Stack sx={{ borderTop: "1px dashed", borderColor: "divider", pt: 1.5 }}>
            <Chip 
              label={meta.result || "N/A"} 
              size="small" 
              color={tone}
              sx={{width: 'fit-content'}} 
            />
          </Stack>
        )}
      </Stack>
        
      {/* --- MODIFICATION : 3. Bloc Graphique "Grossi" et SANS bordure --- */}
      {isTrade && (
        <Box sx={{ 
          // Taille "légèrement grossie"
          width: { xs: 'none', sm: 120, md: 140 }, 
          flexShrink: 0, 
          aspectRatio: "16/10",
          
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          p: 1.5, 
          // Trait de séparation vertical ENLEVÉ
        }}>
          
          {/* Logique de rendu à 3 conditions */}
          {tone === 'info' ? (
            <SparklineConsolidation color={graphColor} />
          ) : direction === 'sell' ? (
            <SparklineDownPro color={graphColor} />
          ) : (
            <SparklineUpPro color={graphColor} />
          )}

        </Box>
      )}
      {/* --- FIN MODIFICATION --- */}
    </Paper>
  );
};
export default InspectorEntryCard;