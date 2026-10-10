import type { Food, Meal, Recovery, WorkoutSet } from '../types/models';

export const id = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
export function dateKey(value: Date | string = new Date()): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00`);
  return Number.isFinite(d.getTime()) && dateKey(d) === value;
}
export function numberIn(value: string | number, label: string, min: number, max: number): number {
  if (String(value).trim() === '') throw new Error(`${label} is required.`);
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${label} must be between ${min} and ${max}.`);
  return n;
}
export function pace(minutes: number, km: number): string {
  if (!Number.isFinite(minutes) || !Number.isFinite(km) || km <= 0 || minutes <= 0) return '—';
  const seconds = Math.round(minutes * 60 / km);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
export const volume = (sets: WorkoutSet[]) => sets.reduce((sum, set) => sum + (set.completed ? set.reps * set.weight : 0), 0);
export function nutrients(food: Food, quantity: number) {
  return { calories: food.calories * quantity, protein: food.protein * quantity, carbs: food.carbs * quantity, fat: food.fat * quantity, sodium: food.sodium === null ? null : food.sodium * quantity };
}
export function mealTotals(meals: Meal[], foods: Food[]) {
  return meals.reduce((total, meal) => {
    const food = foods.find(f => f.id === meal.foodId);
    if (!food) return { ...total, unknownSodium: total.unknownSodium + 1 };
    const n = nutrients(food, meal.quantity);
    return { calories: total.calories + n.calories, protein: total.protein + n.protein, carbs: total.carbs + n.carbs, fat: total.fat + n.fat, sodium: total.sodium + (meal.sodium ?? 0), unknownSodium: total.unknownSodium + (meal.sodium === null ? 1 : 0) };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, unknownSodium: 0 });
}
export const waterTotal = (logs: { amount: number }[]) => logs.reduce((sum, log) => sum + log.amount, 0);
export function recoverySummary(log?: Recovery) {
  if (!log) return { label: 'Check in with yourself', reason: 'Log sleep, energy and soreness to see your recovery summary.' };
  if (log.sleep < 6 || log.fatigue >= 4 || log.soreness >= 4 || log.readiness <= 2) return { label: 'Consider Rest', reason: 'Your recent check-in includes short sleep, high fatigue or soreness, or low readiness. Consider an easier day.' };
  if (log.sleep >= 7 && log.energy >= 4 && log.quality >= 4 && log.soreness <= 2) return { label: 'Well Rested', reason: 'You reported sufficient sleep, good sleep quality and energy, and low soreness.' };
  return { label: 'Moderate Recovery', reason: 'Your check-in suggests mixed readiness. Adjust intensity to how you feel.' };
}
export function weekStart() { const d = new Date(); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return dateKey(d); }
export const elapsed = (s: { accumulated: number; startedAt: number | null }) => s.accumulated + (s.startedAt === null ? 0 : Math.max(0, Date.now() - s.startedAt));
export function clock(ms: number) { const secs = Math.floor(ms / 1000); return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`; }
