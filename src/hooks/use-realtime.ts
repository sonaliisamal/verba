// src/hooks/use-realtime.ts
import { useState, useRef } from "react";

export function useRealtime() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  async function startSession() {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);

    try {
      // 1. Fetch token from our backend API route
      const res = await fetch("/api/session", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get session token");
      const clientSecret = data.clientSecret;

      // 2. Setup standard RTCPeerConnection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // 3. Prepare an audio element to play the AI's response stream
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

      // 4. Request and capture local microphone track
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = localStream;
      
      // Inject user microphone audio into the WebRTC channel
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

      // 5. Build an ephemeral data channel (required by OpenAI Realtime over WebRTC)
      pc.createDataChannel("oai-events");

      // 6. Complete Session Description Protocol (SDP) Handshake
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

      if (!sdpResponse.ok) {
        throw new Error("Failed establishing WebRTC SDP handshake directly with OpenAI");
      }

      const answerSdp = await sdpResponse.text();
      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: answerSdp,
      };

      await pc.setRemoteDescription(answer);
      setIsConnected(true);
    } catch (error) {
      console.error("WebRTC Session Error:", error);
      stopSession();
    } finally {
      setIsConnecting(false);
    }
  }

  function stopSession() {
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
  }

  return {
    isConnected,
    isConnecting,
    startSession,
    stopSession,
  };
}