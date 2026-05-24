// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/hooks/use-realtime";
import { Button } from "@/components/ui/button";
import { AudioVisualizer } from "@/components/audio-visualizer"; // Import statement
import { Mic, MicOff, Loader2, Radio, ClipboardCheck } from "lucide-react";

export default function Home() {
  const router = useRouter();
  // Destructure the audioStream parameter from our custom state hook
  const { isConnected, isConnecting, isSavingReport, reportId, startSession, stopSession, audioStream } = useRealtime();

  useEffect(() => {
    if (reportId) {
      router.push(`/report/${reportId}`);
    }
  }, [reportId, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-950 text-zinc-50 select-none">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-10 relative z-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-extralight tracking-widest text-zinc-100">VERBA</h1>
          <p className="text-xs font-light tracking-wide text-zinc-400 uppercase">AI Interview Simulator</p>
        </div>

        {/* Status Box Container */}
        <div className="h-44 w-full rounded-2xl bg-zinc-900/40 border border-zinc-800/50 flex flex-col items-center justify-center relative p-6 overflow-hidden">
          {isConnected ? (
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              <div className="flex justify-center">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs tracking-wider uppercase font-medium">
                  <Radio className="w-3 h-3 animate-pulse" /> Live Session Active
                </div>
              </div>
              
              {/* Mounted real-time canvas visualization element */}
              <div className="w-full h-16 opacity-80">
                <AudioVisualizer stream={audioStream} />
              </div>

              <p className="text-[11px] font-light text-zinc-400">
                Interviewer is listening. Speak naturally.
              </p>
            </div>
          ) : isSavingReport ? (
            <div className="space-y-3 flex flex-col items-center text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-100" />
              <p className="text-sm font-light tracking-wide">Analyzing your speech and creating report...</p>
            </div>
          ) : reportId ? (
            <div className="space-y-3 flex flex-col items-center text-emerald-400 animate-pulse">
              <ClipboardCheck className="w-8 h-8 stroke-[1.5]" />
              <p className="text-sm font-light text-zinc-300">Opening Evaluation Dashboard...</p>
            </div>
          ) : (
            <div className="space-y-2 flex flex-col items-center text-zinc-500">
              <MicOff className="w-8 h-8 stroke-[1.25]" />
              <p className="text-xs font-light tracking-wide pt-2">Microphone disconnected. Start session to connect.</p>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          {isConnected ? (
            <Button onClick={stopSession} variant="destructive" className="px-8 py-6 rounded-full font-light tracking-wide text-sm">
              <MicOff className="w-4 h-4 mr-2" /> End Interview Session
            </Button>
          ) : (
            <Button
              onClick={startSession}
              disabled={isConnecting || isSavingReport || !!reportId}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 px-8 py-6 rounded-full font-light tracking-wide text-sm shadow-lg disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Establishing WebRTC...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" /> Start Live Interview
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}