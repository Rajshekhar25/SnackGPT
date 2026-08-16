import { GoogleGenAI, Type } from "@google/genai";
import { aiParsedItemsSchema, aiSuggestionsSchema } from "./validation.js";

// "gemini-flash-latest" is Google's rolling alias for the current free-tier Flash
// model; pinned versions (e.g. gemini-2.5-flash) get retired for new API keys.
const MODEL = process.env.AI_MODEL || "gemini-flash-latest";
const RETRY_DELAY_MS = 1200;

/** Thrown for every AI failure so routes can answer with one clean shape. */
export class AiError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "AiError";
    this.status = status;
  }
}

let client = null;
function getClient() {
  if (!process.env.AI_API_KEY) {
    throw new AiError("AI is not configured on this server.", 503);
  }
  if (!client) client = new GoogleGenAI({ apiKey: process.env.AI_API_KEY });
  return client;
}

const macroFields = {
  calories: { type: Type.NUMBER },
  protein: { type: Type.NUMBER },
  carbs: { type: Type.NUMBER },
  fat: { type: Type.NUMBER },
};

const parsedItemsResponseSchema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { name: { type: Type.STRING }, ...macroFields },
        required: ["name", "calories", "protein", "carbs", "fat"],
        propertyOrdering: ["name", "calories", "protein", "carbs", "fat"],
      },
    },
  },
  required: ["items"],
};

const suggestionsResponseSchema = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          portion: { type: Type.STRING },
          ...macroFields,
          reason: { type: Type.STRING },
        },
        required: ["title", "portion", "calories", "protein", "carbs", "fat", "reason"],
        propertyOrdering: [
          "title",
          "portion",
          "calories",
          "protein",
          "carbs",
          "fat",
          "reason",
        ],
      },
    },
  },
  required: ["suggestions"],
};

/**
 * Turn an error from the Gemini SDK into an AiError the UI can show verbatim.
 * The 429 case is worth naming: Google's free tier allows a fixed number of
 * requests per model per day, which is a different ceiling from this app's
 * own 5-per-hour limiter and is not fixed by waiting a minute.
 */
function upstreamError(err, busyMessage) {
  console.error("[gemini] request failed:", err?.message ?? err);

  if (err?.status === 429) {
    return new AiError(
      "The AI provider's daily free quota is used up. Add food manually, or try again tomorrow.",
      429
    );
  }
  return new AiError(busyMessage ?? "The AI service is unavailable right now.");
}

async function generateJson({ prompt, systemInstruction, responseSchema, zodSchema }) {
  const request = {
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.4,
    },
  };

  let raw;
  try {
    raw = (await getClient().models.generateContent(request)).text;
  } catch (err) {
    if (err instanceof AiError) throw err;
    // Free-tier Flash returns a transient 503 under load often enough to be worth
    // one retry before we give up and fall back to manual entry. The pause matters:
    // an immediate retry lands inside the same overload window and fails again.
    // A 429 is Google's own quota, not ours, and retrying cannot clear it.
    if (err?.status !== 503) throw upstreamError(err);

    try {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      raw = (await getClient().models.generateContent(request)).text;
    } catch (retryErr) {
      throw upstreamError(retryErr, "The AI service is busy. Try again in a moment.");
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AiError("The AI returned a response we could not read.");
  }

  // responseSchema is a strong hint, not a guarantee — validate before trusting.
  const checked = zodSchema.safeParse(parsed);
  if (!checked.success) {
    console.error("[gemini] response failed validation:", checked.error.issues);
    throw new AiError("The AI returned an unexpected response.");
  }
  return checked.data;
}

export async function parseFoodText(text) {
  const { items } = await generateJson({
    systemInstruction:
      "You are a nutrition estimator. Given a free-text description of food a person ate, " +
      "break it into individual items and estimate the nutrition of the stated portion. " +
      "Use realistic values for common Indian and Western foods. If no portion is given, " +
      "assume one typical serving. Include the quantity in the item name (e.g. '2 boiled eggs'). " +
      "Calories are kcal; protein, carbs and fat are grams. Never return zero items — if the " +
      "text is not food, return a single item named after the text with all values 0.",
    prompt: `Food eaten: ${text}`,
    responseSchema: parsedItemsResponseSchema,
    zodSchema: aiParsedItemsSchema,
  });

  return items.map((item) => ({
    name: item.name,
    calories: Math.round(item.calories),
    protein: Math.round(item.protein * 10) / 10,
    carbs: Math.round(item.carbs * 10) / 10,
    fat: Math.round(item.fat * 10) / 10,
  }));
}

export async function suggestMeals({ remaining, healthConditions, dietaryPref }) {
  const constraints = [
    dietaryPref && dietaryPref !== "none"
      ? `Dietary preference: ${dietaryPref}. Every suggestion must comply.`
      : "Dietary preference: none.",
    healthConditions
      ? `Health conditions: ${healthConditions}. Suggestions must be appropriate for these.`
      : "Health conditions: none reported.",
  ].join("\n");

  const { suggestions } = await generateJson({
    systemInstruction:
      "You are a practical dietitian. Suggest exactly 3 real, easy-to-prepare meals or snacks " +
      "that fit within the user's remaining daily macro budget. Do not exceed the remaining " +
      "calories. If a remaining value is negative the user has already overshot it — keep that " +
      "macro as low as possible. Give a specific portion (e.g. '150 g' or '1 medium bowl') and " +
      "a one-sentence reason tying the choice to their budget and health context. " +
      "Calories are kcal; protein, carbs and fat are grams.",
    prompt:
      `Remaining today:\n` +
      `- Calories: ${remaining.calories} kcal\n` +
      `- Protein: ${remaining.protein} g\n` +
      `- Carbs: ${remaining.carbs} g\n` +
      `- Fat: ${remaining.fat} g\n\n${constraints}`,
    responseSchema: suggestionsResponseSchema,
    zodSchema: aiSuggestionsSchema,
  });

  return suggestions.slice(0, 3).map((s) => ({
    title: s.title,
    portion: s.portion,
    calories: Math.round(s.calories),
    protein: Math.round(s.protein * 10) / 10,
    carbs: Math.round(s.carbs * 10) / 10,
    fat: Math.round(s.fat * 10) / 10,
    reason: s.reason,
  }));
}
