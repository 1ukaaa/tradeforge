// frontend/src/pages/Home.js

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PostAddIcon from '@mui/icons-material/PostAdd';
import TwitterIcon from '@mui/icons-material/Twitter';
import {
  Avatar,
  Box,
  Container,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  SvgIcon,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

// --- ICÔNE DISCORD PERSONNALISÉE ---
const DiscordIcon = (props) => (
  <SvgIcon {...props}>
    <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.2 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.53.31-1.07.57-1.64.78c-.04.01-.05.06-.04.09c.31.61.66 1.19 1.07 1.74c.02.01.05.02.08.02c1.68-.53 3.4-1.33 5.2-2.65c.02-.01.03-.03.03-.05c.44-4.53-.6-8.5-3.1-11.95c-.01-.01-.02-.02-.03-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z" />
  </SvgIcon>
);

/**
 * Composant réutilisable pour les lignes d'action
 */
const ActionListItem = ({ title, description, icon, onClick, disabled = false }) => {
  const theme = useTheme();

  // Style pour l'icône et son fond, s'inspirant de l'image
  const iconAvatar = (
    <Avatar 
      variant="rounded" 
      sx={{ 
        bgcolor: disabled ? theme.palette.action.disabledBackground : alpha(theme.palette.primary.main, 0.1), 
        color: disabled ? theme.palette.action.disabled : theme.palette.primary.main,
        borderRadius: 2, // Bords arrondis
      }}
    >
      {icon}
    </Avatar>
  );

  const item = (
    <ListItemButton 
      onClick={!disabled ? onClick : undefined} 
      disabled={disabled}
      sx={{ 
        py: 2, 
        px: 2.5,
        '&:not(:last-child)': {
          borderBottom: `1px solid ${theme.palette.divider}`
        }
      }}
    >
      <ListItemIcon sx={{ minWidth: 52 }}>
        {iconAvatar}
      </ListItemIcon>
      
      <ListItemText
        primary={title}
        secondary={description}
        primaryTypographyProps={{ fontWeight: '600' }}
        secondaryTypographyProps={{ color: 'text.secondary' }}
      />
      
      {!disabled && (
        <ChevronRightIcon sx={{ color: 'text.secondary', ml: 1 }} />
      )}
    </ListItemButton>
  );

  if (disabled) {
    return (
      <Tooltip title="En cours de développement" placement="right">
        <span>{item}</span>
      </Tooltip>
    );
  }

  return item;
};


export default function Home() {
  const navigate = useNavigate();

  // ----- GESTIONNAIRES DE NAVIGATION -----
  const handleAiClick = () => {
    navigate('/', { state: { defaultTab: 'ai' } });
  };

  const handleStructureTradeClick = () => {
    navigate('/', { state: { defaultTab: 'trade' } });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      
      {/* --- TEXTE D'EN-TÊTE (COMME SUR L'IMAGE) --- */}
      <Box sx={{ mb: 4, px: 2 }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Que voulez-vous faire ?
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Lancez une action rapide ou gérez vos modules.
        </Typography>
      </Box>

      {/* --- LISTE D'ACTIONS (COMME SUR L'IMAGE) --- */}
      <Box 
        sx={{ 
          // Le conteneur de la liste est le "Paper"
          bgcolor: 'background.paper',
          borderRadius: 4,
          boxShadow: (theme) => theme.shadows[2],
          overflow: 'hidden', // Pour les coins arrondis
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <List sx={{ p: 0 }}>
          {/* -- Bouton 1: IA -- */}
          <ActionListItem
            title="IA"
            description="Générer une analyse de trade complète."
            icon={<AutoAwesomeIcon />}
            onClick={handleAiClick}
          />

          {/* -- Bouton 2: Structurer un trade -- */}
          <ActionListItem
            title="Structurer un trade"
            description="Créer une nouvelle entrée de trade."
            icon={<PostAddIcon />}
            onClick={handleStructureTradeClick}
          />

          {/* -- Bouton 3: Message Discord (Désactivé) -- */}
          <ActionListItem
            title="Message Discord"
            description="Partager une analyse avec la communauté."
            icon={<DiscordIcon />}
            disabled={true}
          />

          {/* -- Bouton 4: Posts Twitter (Désactivé) -- */}
          <ActionListItem
            title="Posts Twitter"
            description="Préparer un post pour X (Twitter)."
            icon={<TwitterIcon />}
            disabled={true}
          />
        </List>
      </Box>
    </Container>
  );
}