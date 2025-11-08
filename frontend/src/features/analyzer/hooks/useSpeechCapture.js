import { useCallback, useEffect, useRef, useState } from "react";

const getSpeechRecognition = () => {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const useSpeechCapture = ({ onTranscript, language = "fr-FR" }) => {
  const recognitionRef = useRef(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    setIsSupported(Boolean(SpeechRecognition));
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition || recognitionRef.current) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = language;
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      let chunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        chunk += event.results[i][0].transcript;
      }
      if (chunk && onTranscript) {
        onTranscript(chunk);
      }
    };
    recognition.onerror = () => {
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    recognition.start();
  }, [language, onTranscript]);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) {
      setIsRecording(false);
      return;
    }
    const recognition = recognitionRef.current;
    recognition.onend = null;
    recognition.onerror = null;
    recognition.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  }, []);

  return {
    isSupported,
    isRecording,
    startRecording,
    stopRecording,
  };
};

export default useSpeechCapture;
