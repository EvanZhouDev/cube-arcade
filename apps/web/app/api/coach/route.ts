import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

function fallbackCoach(prompt: string): string {
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(prompt) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  const game = `${payload.game ?? "this game"}`;
  const lastMove = payload.lastMove
    ? `Last smartcube turn: ${payload.lastMove}.`
    : "";
  const controls = Array.isArray(payload.controls)
    ? payload.controls
        .map((control) =>
          typeof control === "object" && control
            ? `${(control as Record<string, string>).move}: ${(control as Record<string, string>).effect}`
            : "",
        )
        .filter(Boolean)
        .join(" ")
    : "";

  return [
    `Control briefing for ${game}: keep white on top, green facing you, and red on the right.`,
    controls || "Use the current face-turn legend shown beside the cube.",
    lastMove,
    "Quarter turns are safer than half turns for consistent inputs. If the virtual cube drifts, solve your physical cube and use the resync control before continuing.",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function POST(request: Request) {
  const body = (await request.json()) as { prompt?: string };
  const prompt = body.prompt ?? "{}";

  if (!process.env.OPENAI_API_KEY) {
    return new Response(fallbackCoach(prompt), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const result = streamText({
    model: openai(process.env.CUBE_ARCADE_COACH_MODEL ?? "gpt-4o-mini"),
    prompt,
    system:
      "You are the control coach for a smartcube arcade. Answer in 3 short paragraphs max. Focus on how to play the selected game with the cube, mention the visible white, red, and green control faces, and keep advice concrete.",
    temperature: 0.4,
  });

  return result.toTextStreamResponse();
}
