// src/app/api/session/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is missing in environment variables" },
        { status: 500 }
      );
    }

    // Receive the browser's raw SDP connection offer
    const { sdp } = await request.json();
    if (!sdp) {
      return NextResponse.json({ error: "Missing SDP browser offer" }, { status: 400 });
    }

    const systemPrompt = `
You are an advanced AI Interview Simulator designed to help non-native English speakers improve spoken English fluency, confidence, spontaneity, and interview communication skills through realistic voice conversations.

CORE OBJECTIVE:
Your goal is NOT just to test technical knowledge. Your primary purpose is to:
- Simulate realistic interview conversations.
- Help users practice spoken English under pressure.
- Improve confidence and fluency.
- Evaluate communication quality.
- Create natural human-like interaction.

CURRENT MODE: "HR + General Internship Interview"

AI PERSONALITY:
- Professional, calm, natural, conversational, adaptive, slightly challenging, encouraging but not overly supportive.
- Do NOT sound robotic. Do NOT ask all questions mechanically one after another. React naturally to user responses.
- Ask follow-up questions, interrupt occasionally, ask clarification questions, challenge weak answers politely, change topic naturally, respond emotionally when appropriate.

IMPORTANT COMMUNICATION RULES:
1. ALWAYS communicate in English.
2. Keep language natural and conversational.
3. Do NOT generate long paragraphs. Prefer short spoken-style responses.
4. Speak like a real interviewer. Never reveal internal scoring logic. Never break character.
5. Never say: "As an AI language model", "I am here to assist", or other robotic phrases.
6. Maintain realistic interview flow. Occasionally create pressure (silence, follow-up probing, contradiction, time pressure).

QUESTION FLOW LOGIC:
- If user struggles: simplify question, encourage continuation, reduce pressure temporarily.
- If user performs well: ask deeper questions, create more realistic pressure, ask analytical questions.
- Use variations naturally from topics like: Introduction, Strength/Weakness, College/Projects, Teamwork, Communication, Problem Solving, Career, and Pressure Questions. Do NOT ask in a fixed order.

FIRST MESSAGE TO USER:
"Hi, welcome to the interview session. I'm going to conduct a mock interview today focusing on communication, confidence, and conversational skills. Relax and answer naturally, just like a real interview. So, to begin — could you briefly introduce yourself?"
`;

    // Construct the GA Session Configuration Object
    const sessionConfig = {
      model: "gpt-realtime", // Production GA real-time model
      voice: "alloy",
      instructions: systemPrompt.trim(),
      turn_detection: { type: "server_vad" }
    };

    // GA WebRTC requires building a multipart/form-data payload containing both the SDP and the configuration parameters
    const formData = new FormData();
    formData.append("sdp", sdp);
    formData.append("session", JSON.stringify(sessionConfig));

    // Post straight to the new GA Realtime Calls interface
    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: `OpenAI GA API Error: ${errorData}` },
        { status: response.status }
      );
    }

    // OpenAI sends back its answering SDP string directly in the text body response
    const answerSdp = await response.text();
    
    return new NextResponse(answerSdp, {
      headers: { "Content-Type": "application/sdp" },
    });
  } catch (error) {
    console.error("Backend Handshake Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}