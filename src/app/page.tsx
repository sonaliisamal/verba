// src/app/page.tsx
"usemain"
"use client";

import { useRealtime } from "@/hooks/use-realtime";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Radio } from "lucide-react";

export default function Home() {
  const { isConnected, isConnecting, startSession, stopSession } = useRealtime();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-950 text-zinc-50 select-none">
      {/* Decorative background visual ambient node */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-10 relative z-10">
        {/* Brand Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-extralight tracking-widest text-zinc-100">
            VERBA
          </h1>
          <p className="text-xs font-light tracking-wide text-zinc-400 uppercase">
            AI Interview Simulator
          </p>
        </div>

        {/* Dynamic Minimalist Audio Visualizer / Status Box */}
        <div className="h-44 w-full rounded-2xl bg-zinc-900/40 border border-zinc-800/50 flex flex-col items-center justify-center p-6 transition-all duration-300">
          {isConnected ? (
            <div className="space-y-4 flex flex-col items-center animate-fade-in">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs tracking-wider uppercase font-medium">
                <Radio className="w-3 h-3 animate-pulse" />
                Session Active
              </div>
              <p className="text-sm font-light text-zinc-300 max-w-70">
                The interviewer is listening. Speak clearly and answer naturally.
              </p>
            </div>
          ) : (
            <div className="space-y-2 flex flex-col items-center text-zinc-500">
              <MicOff className="w-8 h-8 stroke-[1.25]" />
              <p className="text-xs font-light tracking-wide pt-2">
                Microphone disconnected. Start session to connect.
              </p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex justify-center">
          {isConnected ? (
            <Button
              onClick={stopSession}
              variant="destructive"
              className="px-8 py-6 rounded-full font-light tracking-wide text-sm border border-red-500/20 shadow-lg shadow-red-950/20 transition-all duration-200"
            >
              <MicOff className="w-4 h-4 mr-2" />
              End Interview Session
            </Button>
          ) : (
            <Button
              onClick={startSession}
              disabled={isConnecting}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 px-8 py-6 rounded-full font-light tracking-wide text-sm shadow-lg shadow-zinc-950/40 transition-all duration-200 disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Establishing WebRTC...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Live Interview
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}