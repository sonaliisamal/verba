// src/hooks/use-realtime.ts
import { useState, useRef } from "react";

export function useRealtime() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const transcriptLogsRef = useRef<{ role: string; text: string }[]>([]);
  const voiceSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Helper function to make the browser speak
  function speak(text: string) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      voiceSynthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }

  async function startSession() {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    setReportId(null);
    transcriptLogsRef.current = [];

    try {
      // 1. Activate microphone tracks just to feed the visualizer canvas
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = localStream;

      setIsConnected(true);
      setIsConnecting(false);

      // 2. Simulate the interviewer's opening question locally
      const greeting = "Hi there! Welcome to your mock interview session. Let's start simple: could you please briefly introduce yourself and tell me why you want this position?";
      transcriptLogsRef.current.push({ role: "Interviewer", text: greeting });
      
      // Small timeout so the visualizer mounts before speech starts
      setTimeout(() => speak(greeting), 600);

    } catch (error) {
      console.error("Local Mock Session Error:", error);
      stopSession();
    } finally {
      setIsConnecting(false);
    }
  }

  async function stopSession() {
    // Turn off mic tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    
    // Stop browser audio voice
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    
    setIsConnected(false);

    // Mock response log to test report parsing
    if (transcriptLogsRef.current.length === 1) {
      transcriptLogsRef.current.push({ 
        role: "Candidate", 
        text: "I am a passionate software engineering student looking to build great things, practice my communication skills, and work with modern technology frameworks." 
      });
    }

    // 3. Trigger report pipeline creation
    setIsSavingReport(true);
    try {
      const formattedTranscript = transcriptLogsRef.current
        .map((log) => `${log.role}: ${log.text}`)
        .join("\n");

      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationTranscript: formattedTranscript }),
      });

      const reportData = await response.json();
      if (response.ok && reportData.reportId) {
        setReportId(reportData.reportId);
      } else {
        // Fallback fake ID if your OpenAI Key is blocked globally for text parsing too
        setReportId("mock-free-report-id");
      }
    } catch (err) {
      console.error("Failed creating report generation instance:", err);
      setReportId("mock-free-report-id");
    } finally {
      setIsSavingReport(false);
    }
  }

  return {
    isConnected,
    isConnecting,
    isSavingReport,
    reportId,
    startSession,
    stopSession,
    audioStream: localStreamRef.current,
  };
}