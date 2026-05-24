// src/app/api/report/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { conversationTranscript } = await request.json();

    if (!conversationTranscript) {
      return NextResponse.json(
        { error: "Transcript content is missing" },
        { status: 400 }
      );
    }

    // 1. Prompt OpenAI to generate a highly structured performance assessment matching our schema
    const aiAnalysis = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective model for text parsing and extraction
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert English communication evaluator and HR analyst. Analyze the provided interview transcript.
          You must respond with a raw JSON object containing the exact structure below. Do not add markdown wrapping or backticks.
          
          Required JSON keys and types:
          {
            "overall_score": number (1 to 10),
            "fluency": "string analyzing user pace, pauses, and speech delivery patterns",
            "confidence": "string evaluating assertion level and sentence continuity under pressure",
            "vocabulary": "string outlining lexicon choice, repetitions, and variety constraints",
            "grammar": "string reviewing structural syntax correctness and structural mistakes",
            "communication_style": "string detailing systemic soft skills delivery and response relevance",
            "strengths": ["array", "of", "strings", "outlining", "concrete", "wins"],
            "areas_to_improve": ["array", "of", "strings", "detailing", "actionable", "fixes"],
            "filler_words": ["array", "of", "strings", "listing", "detected", "fillers", "like", "um", "like"],
            "suggested_focus": "string with specific tailored roadmap points to study",
            "readiness_level": "Beginner" | "Improving" | "Interview Ready" | "Strong Communicator"
          }`
        },
        {
          role: "user",
          content: `Review the following text transcript lines from the mock session:\n\n${conversationTranscript}`
        }
      ],
    });

    const parsedData = JSON.parse(aiAnalysis.choices[0].message.content || "{}");

    // 2. Insert the structured response payload straight into your Supabase database table
    const { data, error } = await supabaseServer
      .from("interview_reports")
      .insert([
        {
          overall_score: parsedData.overall_score,
          fluency: parsedData.fluency,
          confidence: parsedData.confidence,
          vocabulary: parsedData.vocabulary,
          grammar: parsedData.grammar,
          communication_style: parsedData.communication_style,
          strengths: parsedData.strengths,
          areas_to_improve: parsedData.areas_to_improve,
          filler_words: parsedData.filler_words,
          suggested_focus: parsedData.suggested_focus,
          readiness_level: parsedData.readiness_level,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Supabase Error: ${error.message}` }, { status: 500 });
    }

    // 3. Return the saved report record metadata back to the client UI handler
    return NextResponse.json({ success: true, reportId: data.id });
  } catch (error) {
    console.error("Report generation failure:", error);
    return NextResponse.json(
      { error: "Internal server error occurred processing analytics evaluation" },
      { status: 500 }
    );
  }
}