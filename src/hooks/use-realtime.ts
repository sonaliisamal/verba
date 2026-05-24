// src/hooks/use-realtime.ts
import { useState, useRef } from "react";

export function useRealtime() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  
  // Array to collect conversation logs in real-time
  const transcriptLogsRef = useRef<{ role: string; text: string }[]>([]);

  async function startSession() {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    setReportId(null);
    transcriptLogsRef.current = []; // Reset logs for a fresh interview

    try {
      const res = await fetch("/api/session", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get session token");
      const clientSecret = data.clientSecret;

      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      if (!audioElRef.current) {
        const audio = document.createElement("audio");
        audio.autoplay = true;
        audioElRef.current = audio;
      }

      pc.ontrack = (e) => {
        if (e.streams[0] && audioElRef.current) {
          audioElRef.current.srcObject = e.streams[0];
        }
      };

      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = localStream;
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

      // 1. Establish the data channel to receive real-time text logs from OpenAI
      const dataChannel = pc.createDataChannel("oai-events");

      dataChannel.onmessage = (event) => {
        try {
          const serverEvent = JSON.parse(event.data);
          
          // Capture completed system responses (the interviewer speaking)
          if (serverEvent.type === "conversation.item.created" && serverEvent.item?.role === "assistant") {
            const content = serverEvent.item.content?.find((c: any) => c.type === "audio");
            if (content?.transcript) {
              transcriptLogsRef.current.push({ role: "Interviewer", text: content.transcript });
            }
          }
          
          // Capture completed user speech chunks (the user speaking)
          if (serverEvent.type === "conversation.item.created" && serverEvent.item?.role === "user") {
            const content = serverEvent.item.content?.find((c: any) => c.type === "input_audio");
            if (content?.transcript) {
              transcriptLogsRef.current.push({ role: "Candidate", text: content.transcript });
            }
          }
        } catch (err) {
          console.error("Error reading data channel event:", err);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview";
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) throw new Error("Failed establishing WebRTC handshake");

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      setIsConnected(true);
    } catch (error) {
      console.error("WebRTC Session Error:", error);
      stopSession();
    } finally {
      setIsConnecting(false);
    }
  }

  async function stopSession() {
    // Shutdown tracks and connection streams immediately
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
    }
    setIsConnected(false);

    // 2. Format logs and request an evaluation report if a conversation happened
    if (transcriptLogsRef.current.length > 0) {
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
        }
      } catch (err) {
        console.error("Failed to generate report from session logs:", err);
      } finally {
        setIsSavingReport(false);
      }
    }
  }

 


// src/hooks/use-realtime.ts (Scroll down to the bottom of the file)
  return {
    isConnected,
    isConnecting,
    isSavingReport,
    reportId,
    startSession,
    stopSession,
    audioStream: localStreamRef.current // Add this line here
  };
}