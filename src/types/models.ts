export type ThemeMode = 'system' | 'light' | 'dark';
export interface Profile {
  name: string; age: number; height: number; weight: number;
  goal: string; experience: string; equipment: string[]; dumbbellWeight: number;
  runningExperience: string; timeAway: string; proteinGoal: number;
  diet: string; allergies: string; mealsPerDay: number; budget: number; budgetPeriod: string;
  cookingEquipment: string; cookingMinutes: number; workoutDays: string[]; runningDays: string[];
  workoutMinutes: number; reminders: boolean; waterGoal: number; sodiumGoal: number;
}
export interface Exercise {
  id: string; name: string; muscle: string; secondary: string; equipment: string;
  difficulty: string; instructions: string; tips: string; mistakes: string;
  sets: number; reps: number;
}
export interface PlannedExercise { id: string; exerciseId: string; sets: number; reps: number; weight: number; notes: string }
export interface WorkoutTemplate { id: string; name: string; notes: string; exercises: PlannedExercise[] }
export interface WorkoutSet { id: string; exerciseId: string; reps: number; weight: number; completed: boolean; notes: string }
export interface WorkoutSession {
  id: string; name: string; date: string; duration: number; notes: string;
  sets: WorkoutSet[]; status: 'active' | 'paused' | 'finished'; startedAt: number | null; accumulated: number;
}
export interface Run { id: string; date: string; distance: number; duration: number; effort: number; notes: string }
export interface WaterLog { id: string; date: string; amount: number }
export interface WeightLog { id: string; date: string; weight: number }
export interface Food { id: string; name: string; serving: string; calories: number; protein: number; carbs: number; fat: number; sodium: number | null }
export interface Meal { id: string; date: string; category: string; foodId: string; quantity: number; sodium: number | null }
export interface Recovery { id: string; date: string; sleep: number; quality: number; soreness: number; energy: number; fatigue: number; readiness: number; rest: boolean }
export interface Activity { id: string; date: string; name: string; kind: string; status: 'planned' | 'completed' | 'skipped' }
export interface IngredientPrice { id: string; cost: number; servings: number }
export interface Recipe { id: string; name: string; ingredients: { foodId: string; quantity: number }[]; minutes: number; equipment: string; diets: string[]; allergens: string[]; instructions: string }
export interface MealPlan { id: string; name: string; start: string; days: number; budget: number; proteinGoal: number; mealsPerDay: number; diet: string; allergies: string; maxMinutes: number; equipment: string[]; entries: { id: string; day: number; recipeId: string }[]; pantry: Record<string, number>; purchased: string[]; groceryOverrides: Record<string, number> }
export interface AppData {
  profile: Profile | null; templates: WorkoutTemplate[]; exercises: Exercise[]; favorites: string[];
  sessions: WorkoutSession[]; runs: Run[]; water: WaterLog[]; weights: WeightLog[];
  foods: Food[]; meals: Meal[]; recovery: Recovery[]; activities: Activity[];
  prices: IngredientPrice[]; mealPlans: MealPlan[];
}
