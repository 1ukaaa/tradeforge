import { Alert, alpha, Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";
// 'useState' est déjà importé
import { useEffect, useRef, useState } from "react";
import ChatInputBar from "../components/ChatInputBar";
import EditableAnalysis from "../components/EditableAnalysis";
import WelcomeScreen from "../components/WelcomeScreen";
import { requestAnalysis, requestStructuredAnalysis } from "../services/aiClient";
import { saveJournalEntry } from "../services/journalClient";
import { fetchPlan } from "../services/planClient";
import { fetchSettings } from "../services/settingsClient";
import { buildPlanDescription } from "../utils/planUtils";

// Le composant UserPrompt (inchangé)
const UserPrompt = ({ text }) => (
  <Stack direction="row" spacing={2} sx={{ width: "100%", justifyContent: "flex-end" }}>
    <Paper
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: "80%",
        borderRadius: 4,
        borderBottomRightRadius: 0,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      }}
    >
      <Typography sx={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
        {text}
      </Typography>
    </Paper>
  </Stack>
);

/**
 * Page "Chat" pour la nouvelle entrée.
 * Gère le cycle de vie : Vide -> Soumission -> Affichage éditable
 */
const NewEntry = () => {
  const [planDescription, setPlanDescription] = useState("");
  const [structuredVariant, setStructuredVariant] = useState("detailed");
  const [analysisVariant, setAnalysisVariant] = useState("default");
  const [tradeVariant, setTradeVariant] = useState("default");

  // États du "chat"
  const [userTranscript, setUserTranscript] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [structuredMetadata, setStructuredMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // États de sauvegarde
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // NOUVEL ÉTAT : Gère l'outil sélectionné dans la barre d'input
  // On met "analyse" par défaut.
  const [activeTool, setActiveTool] = useState("analyse");

  const suggestionClickCallback = useRef(null);
  const scrollRef = useRef(null);

  // 1. Charger le plan et les réglages (inchangé)
  useEffect(() => {
    const loadPrereqs = async () => {
      try {
        const { plan } = await fetchPlan();
        setPlanDescription(buildPlanDescription(plan));
      } catch (e) { console.error("Erreur chargement plan:", e); }
      
      try {
        const settings = await fetchSettings();
        setStructuredVariant(settings.structuredVariant || "detailed");
        setAnalysisVariant(settings.analysisVariant || "default");
        setTradeVariant(settings.tradeVariant || "default");
      } catch (e) { console.error("Erreur chargement réglages:", e); }
    };
    loadPrereqs();
  }, []);

  // Fait défiler vers le bas (inchangé)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [userTranscript, aiAnalysis, loading]);

  // 2. Logique de soumission (MODIFIÉE)
  const handleSend = async (rawText) => {
    setLoading(true);
    setError("");
    setSaveError("");
    setSaveSuccess("");
    setUserTranscript(rawText);
    setAiAnalysis("");
    setStructuredMetadata(null);

    // [MODIFICATION]
    // Au lieu de deviner ("isTrade"), on utilise l'état 'activeTool'
    // qui est contrôlé par le nouveau menu.
    const entryType = activeTool; // C'est soit "analyse", soit "trade"
    const template = entryType === "trade" ? tradeVariant : analysisVariant;
    // [FIN MODIFICATION]

    try {
      const [analysisResult, structuredData] = await Promise.all([
        // Appel 1: Obtenir le texte brut de l'analyse
        requestAnalysis({
          rawText,
          template, // 'template' est maintenant 'tradeVariant' ou 'analysisVariant'
          plan: planDescription,
        }),
        // Appel 2: Obtenir les métadonnées JSON
        requestStructuredAnalysis({
          rawText,
          entryType, // 'entryType' est explicitement "trade" ou "analyse"
          plan: planDescription,
          variant: structuredVariant,
        })
      ]);

      if (!structuredData || !structuredData.metadata) {
        throw new Error("L'IA n'a pas pu structurer la réponse.");
      }

      setAiAnalysis(analysisResult);
      setStructuredMetadata(structuredData.metadata);

    } catch (err) {
      console.error("Échec de l'analyse:", err);
      setError(err.message || "Une erreur est survenue.");
      setAiAnalysis(`**Erreur :** ${err.message || "Impossible de générer l'analyse."}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Logique de Sauvegarde (MODIFIÉE)
  const handleSave = async (finalContent, finalMetadata) => {
    if (!finalContent || !userTranscript) {
      setSaveError("Aucune analyse à sauvegarder.");
      return;
    }
    
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      // [MODIFICATION]
      // On utilise 'activeTool' comme source de vérité pour le type,
      // au lieu de le redétecter.
      const entryType = finalMetadata.entryType || activeTool;
      // [FIN MODIFICATION]

      // Sauvegarder au journal
      await saveJournalEntry({
        type: entryType,
        content: finalContent,
        plan: planDescription,
        transcript: userTranscript,
        metadata: finalMetadata,
      });
      
      setSaveSuccess("Analyse enregistrée au journal !");
      
      setTimeout(() => {
        setUserTranscript("");
        setAiAnalysis("");
        setStructuredMetadata(null);
        setSaveSuccess("");
      }, 2000);

    } catch (err) {
      console.error("Échec de la sauvegarde:", err);
      setSaveError(err.message || "Une erreur est survenue lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };


  // 4. Gérer les suggestions (inchangé)
  const handleSuggestion = (suggestion) => {
    if (suggestionClickCallback.current) {
      suggestionClickCallback.current(suggestion);
    }
  };

  return (
    <Stack sx={{ height: "100%", width: "100%" }}>
      {/* Zone de contenu scrollable */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          p: { xs: 2, md: 4 },
        }}
      >
        <Stack
          spacing={3}
          sx={{
            maxWidth: { lg: 980, xl: 1080 },
            mx: "auto",
            height: !userTranscript && !aiAnalysis ? "100%" : "auto",
          }}
        >
          {/* État vide */}
          {!userTranscript && !aiAnalysis && (
            <WelcomeScreen onSuggestionClick={handleSuggestion} />
          )}

          {/* Prompt Utilisateur */}
          {userTranscript && <UserPrompt text={userTranscript} />}

          {/* Loader */}
          {loading && (
             <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CircularProgress size={24} />
                </Box>
                <Typography sx={{ color: "text.secondary", fontStyle: "italic" }}>
                  TradeForge AI est en train d'analyser...
                </Typography>
             </Stack>
          )}

          {/* Bulle éditable */}
          {aiAnalysis && structuredMetadata && (
            <EditableAnalysis
              content={aiAnalysis}
              initialMetadata={structuredMetadata}
              onSave={handleSave}
              saving={saving}
              saveError={saveError}
              saveSuccess={saveSuccess}
            />
          )}

          {/* Afficher l'erreur principale */}
          {error && !aiAnalysis && (
            <Alert severity="error">{error}</Alert>
          )}
        </Stack>
      </Box>

      {/* Barre d'input fixe (MODIFIÉE) */}
      <ChatInputBar
        onSend={handleSend}
        loading={loading}
        onSuggestionClick={suggestionClickCallback}
        // Props ajoutées pour lier l'état au composant
        activeTool={activeTool}
        onToolChange={setActiveTool}
      />
    </Stack>
  );
};

export default NewEntry;