// src/app/api/session/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is missing in environment variables" },
        { status: 500 }
      );
    }

    // Request an ephemeral session token from OpenAI Realtime API
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview",
        voice: "alloy", // Options: alloy, echo, shimmer
        modalities: ["audio", "text"],
        instructions: "You are a professional interviewer. Keep your responses brief and natural.",
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: `OpenAI API error: ${errorData}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the token to the frontend safely
    return NextResponse.json({
      clientSecret: data.client_secret.value,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}