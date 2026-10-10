import type { Profile } from '../../types/models';
import { numberIn } from '../../utils/calculations';
export function validateProfile(p: Profile) {
  if (!p.name.trim() || p.name.length > 60) throw new Error('Enter a name of 1–60 characters.');
  numberIn(p.age, 'Age', 13, 110); numberIn(p.height, 'Height (cm)', 80, 250); numberIn(p.weight, 'Weight (kg)', 20, 400);
  if (!p.goal || !p.experience || !p.runningExperience || !p.timeAway || !p.equipment.length) throw new Error('Complete your goal, experience and equipment selections.');
  numberIn(p.dumbbellWeight, 'Dumbbell weight', 0, 200); numberIn(p.proteinGoal, 'Protein goal', 1, 400);
  numberIn(p.mealsPerDay, 'Meals per day', 1, 8); numberIn(p.budget, 'Food budget', 1, 1000000);
  numberIn(p.cookingMinutes, 'Cooking time', 1, 240); numberIn(p.workoutMinutes, 'Workout duration', 5, 240);
  numberIn(p.waterGoal, 'Water goal', 250, 10000); numberIn(p.sodiumGoal, 'Sodium reference', 100, 10000);
  if (!Number.isInteger(p.age) || !Number.isInteger(p.mealsPerDay)) throw new Error('Age and meals per day must be whole numbers.');
}
