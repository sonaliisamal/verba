// src/app/report/[id]/page.tsx
import { supabaseServer } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Award, MessageSquare, AlertTriangle, Lightbulb } from "lucide-react";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;

  let report;

  // 1. Intercept the Free Simulation ID and populate high-quality sample feedback
  if (id === "mock-free-report-id") {
    report = {
      id: "MOCK-FREE-SESSION-PREVIEW",
      overall_score: 8,
      readiness_level: "Interview Ready",
      fluency: "Great structural flow and consistent articulation pacing throughout the test interaction blocks. Minimal long hesitation patterns detected.",
      confidence: "Maintained a strong tone of voice delivery. Sentence structures remained cohesive and assertive without trailing off.",
      vocabulary: "Clear usage of functional engineering vocabulary terms. Lexicon choice was highly relevant to the simulated internship prompt context.",
      grammar: "Solid grammatical framework overall. Minor structural tense mismatches noted during spontaneous thought expansion segments.",
      strengths: [
        "Strong, engaging opener during the personal introduction segment.",
        "Excellent contextual vocabulary selection tailored for modern tech roles.",
        "Consistent spoken delivery volume and solid conversational sentence pace."
      ],
      areas_to_improve: [
        "Slightly overusing filler conjunctions when transitioning between long points.",
        "Can expand more on specific project outcomes instead of just listing responsibilities."
      ],
      filler_words: ["um", "like", "basically"],
      suggested_focus: "Practice slowing down for half a second when transitioning between thoughts. This will give you time to structure complex sentences without relying on default filler expressions."
    };
  } else {
    // 2. Otherwise, carry out the standard live production Supabase query lookup
    const { data, error } = await supabaseServer
      .from("interview_reports")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      notFound();
    }
    report = data;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Summary Profile */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-extralight tracking-wide text-zinc-100">Interview Performance Report</h1>
            <p className="text-xs font-light text-zinc-400 mt-1">ID: {report.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 font-light px-3 py-1 text-xs">
              {report.readiness_level}
            </Badge>
            <div className="flex items-baseline gap-1 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
              <span className="text-3xl font-light text-zinc-100">{report.overall_score}</span>
              <span className="text-xs text-zinc-500">/10</span>
            </div>
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-zinc-900/40 border-zinc-800/60 text-zinc-100">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Award className="w-4 h-4 text-zinc-400 stroke-[1.5]" />
              <CardTitle className="text-sm font-medium tracking-wide text-zinc-300">Fluency & Confidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs font-light leading-relaxed text-zinc-400">{report.fluency}</p>
              <p className="text-xs font-light leading-relaxed text-zinc-400 border-t border-zinc-800/60 pt-3">{report.confidence}</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/60 text-zinc-100">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <MessageSquare className="w-4 h-4 text-zinc-400 stroke-[1.5]" />
              <CardTitle className="text-sm font-medium tracking-wide text-zinc-300">Vocabulary & Grammar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs font-light leading-relaxed text-zinc-400">{report.vocabulary}</p>
              <p className="text-xs font-light leading-relaxed text-zinc-400 border-t border-zinc-800/60 pt-3">{report.grammar}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actionable Insights Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Strengths */}
          <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-900/40 space-y-4">
            <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-emerald-500" /> Key Strengths
            </h3>
            <ul className="space-y-2">
              {(report.strengths as string[]).map((strength: string, index: number) => (
                <li key={index} className="text-xs font-light text-zinc-400 leading-relaxed bg-zinc-900/40 px-3 py-2 rounded-lg border border-zinc-800/40">
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* Areas to Improve */}
          <div className="p-6 rounded-2xl bg-zinc-900/20 border border-zinc-900/40 space-y-4">
            <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 stroke-[1.5]" /> Areas to Improve
            </h3>
            <ul className="space-y-2">
              {(report.areas_to_improve as string[]).map((area: string, index: number) => (
                <li key={index} className="text-xs font-light text-zinc-400 leading-relaxed bg-zinc-900/40 px-3 py-2 rounded-lg border border-zinc-800/40">
                  {area}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Filler Words & Roadmap Action Plan */}
        <Card className="bg-zinc-900/40 border-zinc-800/60 text-zinc-100">
          <CardHeader>
            <CardTitle className="text-sm font-medium tracking-wide text-zinc-300 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-zinc-400 stroke-[1.5]" /> Practice Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Detected Filler Words</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {(report.filler_words as string[]).length > 0 ? (
                  (report.filler_words as string[]).map((word: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="border-zinc-800 text-zinc-400 font-mono text-[10px] px-2.5 py-0.5 bg-zinc-900/60">
                      "{word}"
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs font-light text-zinc-500">No excessive filler words detected. Good pacing!</span>
                )}
              </div>
            </div>

            <div className="space-y-2 border-t border-zinc-800/60 pt-4">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Suggested Focus</span>
              <p className="text-xs font-light leading-relaxed text-zinc-400">{report.suggested_focus}</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </main>
  );
}