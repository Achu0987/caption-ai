import { NextResponse } from "next/server";

// Module-level cache — model stays loaded across requests in dev mode
let transcriber = null;

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const pcmBlob = formData.get("pcm");
    const language = formData.get("language") || "auto"; // auto | en | ta | hi | te | ml

    if (!pcmBlob) {
      return NextResponse.json({ error: "No audio data provided" }, { status: 400 });
    }

    // Lazy-load multilingual Whisper model (supports Tamil, Hindi, Telugu, Malayalam, English, etc.)
    if (!transcriber) {
      console.log("[transcribe] Loading Xenova/whisper-small multilingual model for high accuracy...");
      const { pipeline, env } = await import("@xenova/transformers");
      env.allowLocalModels = false;
      // whisper-small (multilingual) — highly accurate for regional languages like Tamil, Hindi
      transcriber = await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-small"
      );
      console.log("[transcribe] Model ready.");
    }

    // Convert received PCM blob back to Float32Array
    const arrayBuffer = await pcmBlob.arrayBuffer();
    const float32Array = new Float32Array(arrayBuffer);

    console.log(`[transcribe] language="${language}", samples=${float32Array.length}`);

    // Build inference options
    const inferenceOptions = {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: "word",
    };

    const langMap = {
      "ta": "tamil",
      "hi": "hindi",
      "te": "telugu",
      "ml": "malayalam",
      "en": "english"
    };

    if (language === "en") {
      // "English" mode: translate any audio (Tamil, Hindi, etc.) → English text
      inferenceOptions.task = "translate";
      inferenceOptions.language = "english";
    } else if (language !== "auto") {
      // Specific language: transcribe in that language
      inferenceOptions.task = "transcribe";
      inferenceOptions.language = langMap[language] || language;
    }
    // "auto" mode: no language/task set — Whisper auto-detects

    const result = await transcriber(float32Array, inferenceOptions);

    console.log("[transcribe] Done. Chunks:", result?.chunks?.length ?? 0, "| Text:", result?.text?.slice(0, 80));
    return NextResponse.json(result);

  } catch (err) {
    console.error("[transcribe] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
