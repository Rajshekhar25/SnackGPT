/**
 * TDEE / macro engine.
 *
 * BMR uses Mifflin-St Jeor (Mifflin MD et al., Am J Clin Nutr 1990;51:241-7),
 * which is the formula the ACSM recommends over Harris-Benedict for healthy adults.
 */

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS = {
  sedentary: "Sedentary (little or no exercise)",
  light: "Light (1-3 days/week)",
  moderate: "Moderate (3-5 days/week)",
  active: "Active (6-7 days/week)",
  very_active: "Very active (physical job or 2x/day training)",
};

// 30% protein / 40% carbs / 30% fat, a common balanced split for body-recomposition.
const MACRO_SPLIT = { protein: 0.3, carbs: 0.4, fat: 0.3 };
const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 };

// Floor recommended by most clinical guidance for unsupervised dieting.
const MIN_CALORIES = 1200;

export function calculateBmr({ weightKg, heightCm, age, gender }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "female" ? base - 161 : base + 5;
}

export function calculateTdee({ weightKg, heightCm, age, gender, activityLevel }) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? ACTIVITY_MULTIPLIERS.sedentary;
  return calculateBmr({ weightKg, heightCm, age, gender }) * multiplier;
}

/**
 * Turn a profile into daily targets.
 *
 * Calories start at TDEE and shift by a fixed amount toward the goal weight:
 * a 500 kcal/day deficit is the classic ~0.5 kg/week loss, and a 300 kcal/day
 * surplus is a lean-gain pace. Returns null when the profile is incomplete.
 */
export function calculateTargets(profile) {
  const { weightKg, heightCm, age, gender, activityLevel, targetWeightKg } = profile;

  if (!weightKg || !heightCm || !age || !gender || !activityLevel) return null;

  const tdee = calculateTdee({ weightKg, heightCm, age, gender, activityLevel });

  let calories = tdee;
  if (targetWeightKg && targetWeightKg < weightKg - 0.5) calories = tdee - 500;
  else if (targetWeightKg && targetWeightKg > weightKg + 0.5) calories = tdee + 300;

  calories = Math.max(MIN_CALORIES, Math.round(calories));

  return {
    targetCalories: calories,
    targetProtein: Math.round((calories * MACRO_SPLIT.protein) / KCAL_PER_GRAM.protein),
    targetCarbs: Math.round((calories * MACRO_SPLIT.carbs) / KCAL_PER_GRAM.carbs),
    targetFat: Math.round((calories * MACRO_SPLIT.fat) / KCAL_PER_GRAM.fat),
  };
}
