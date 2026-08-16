import { z } from "zod";

export const GENDERS = ["male", "female", "other"];
export const ACTIVITY_LEVELS = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
];
export const DIETARY_PREFS = [
  "none",
  "vegetarian",
  "vegan",
  "eggetarian",
  "pescatarian",
  "keto",
  "halal",
  "jain",
];

const nullableEnum = (values) => z.enum(values).nullish();

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.email("Enter a valid email").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  age: z.number().int().min(10).max(120).nullish(),
  gender: nullableEnum(GENDERS),
  heightCm: z.number().min(80).max(260).nullish(),
  weightKg: z.number().min(20).max(400).nullish(),
  targetWeightKg: z.number().min(20).max(400).nullish(),
  activityLevel: nullableEnum(ACTIVITY_LEVELS),
  healthConditions: z.string().trim().max(500).nullish(),
  dietaryPref: nullableEnum(DIETARY_PREFS),
  targetCalories: z.number().int().min(800).max(10000).optional(),
  targetProtein: z.number().int().min(0).max(1000).optional(),
  targetCarbs: z.number().int().min(0).max(2000).optional(),
  targetFat: z.number().int().min(0).max(1000).optional(),
  // When true the server recomputes targets from the metrics above and ignores
  // any target* values sent by the client.
  autoCalculate: z.boolean().optional(),
});

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const mealSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  calories: z.number().int().min(0).max(20000),
  protein: z.number().min(0).max(2000),
  carbs: z.number().min(0).max(2000),
  fat: z.number().min(0).max(2000),
  date: dateSchema,
});

export const parseFoodSchema = z.object({
  text: z.string().trim().min(2, "Describe what you ate").max(500),
});

export const suggestSchema = z.object({
  date: dateSchema,
});

/**
 * Shape the AI is asked to return, re-checked here even though Gemini was given
 * a responseSchema — a model response is untrusted input like any other.
 */
export const aiParsedItemsSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        calories: z.number().min(0).max(20000),
        protein: z.number().min(0).max(2000),
        carbs: z.number().min(0).max(2000),
        fat: z.number().min(0).max(2000),
      })
    )
    .min(1)
    .max(15),
});

export const aiSuggestionsSchema = z.object({
  suggestions: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        portion: z.string().trim().min(1).max(120),
        calories: z.number().min(0).max(20000),
        protein: z.number().min(0).max(2000),
        carbs: z.number().min(0).max(2000),
        fat: z.number().min(0).max(2000),
        reason: z.string().trim().min(1).max(400),
      })
    )
    .min(1)
    .max(5),
});

/** Flatten a ZodError into { field: "message" } for form display. */
export function fieldErrors(error) {
  const out = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
