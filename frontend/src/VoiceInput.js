import { useRef, useState } from "react";

const VoiceInput = ({ transcript, setTranscript }) => {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const isSpeechSupported =
    "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

  // Handler start + auto-continuous
  const startRecording = () => {
    if (!isSpeechSupported) {
      alert("Web Speech API non supportée dans ce navigateur.");
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // mode "entretien"
    recognition.lang = "fr-FR";
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript((prev) => prev + finalTranscript);
    };
    recognition.onerror = (e) => {
      setIsRecording(false);
      alert("Erreur micro : " + (e.error || ""));
    };
    recognition.onend = () => {
      setIsRecording(false);
      // relance automatique après cutoff (limite navigateur)
      if (isRecording) {
        setTimeout(() => startRecording(), 100);
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <textarea
        rows="6"
        cols="60"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Parlez ou tapez votre analyse ici…"
        style={{ fontSize: 16, marginBottom: 10, width: "100%" }}
      />
      <div>
        <button onClick={isRecording ? stopRecording : startRecording} disabled={!isSpeechSupported}>
          {isRecording ? "Stop micro" : "Démarrer micro"}
        </button>
        <span style={{ marginLeft: 16, color: isRecording ? "green" : "grey" }}>
          {isRecording ? "🎤 Enregistrement... (auto-restart)" : "Micro désactivé"}
        </span>
      </div>
      {isRecording && (
        <div style={{ marginTop: 10, color: "#888"}}>
          Session micro limitée à ~30s/browser.<br />
          Redémarrage automatique jusqu'à Stop.
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
