import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Button, Card, Choices, ErrorText, Field, Label, Row, Screen, messageOf } from '../components/ui';
import { days, equipmentOptions, experienceOptions, goals, runningOptions } from '../constants/theme';
import { mutate, useApp } from '../stores/app';
import type { Profile } from '../types/models';
import { dateKey, id, numberIn } from '../utils/calculations';
import { validateProfile } from '../features/profile/validation';

const initial: Profile = { name: '', age: 0, height: 0, weight: 0, goal: '', experience: '', equipment: [], dumbbellWeight: 0, runningExperience: '', timeAway: '', proteinGoal: 0, diet: 'No restriction', allergies: '', mealsPerDay: 3, budget: 0, budgetPeriod: 'Weekly', cookingEquipment: '', cookingMinutes: 30, workoutDays: [], runningDays: [], workoutMinutes: 30, reminders: false, waterGoal: 2000, sodiumGoal: 2000 };
const titles = ['Make room for stronger.', 'A little about you', 'Find your direction', 'Your starting point', 'Your training space', 'Your running story', 'Fuel your everyday', 'Make it a habit', 'Your plan starts here'];
type NumericKey = 'age' | 'height' | 'weight' | 'dumbbellWeight' | 'proteinGoal' | 'mealsPerDay' | 'budget' | 'cookingMinutes' | 'workoutMinutes' | 'waterGoal' | 'sodiumGoal';
export default function Onboarding() {
  const { data, saving } = useApp(); const { edit, step: initialStep } = useLocalSearchParams<{ edit?: string; step?: string }>();
  const [step, setStep] = useState(edit ? Math.min(7,Math.max(1,Number(initialStep)||1)) : 0);
  const [p, setP] = useState<Profile>(data.profile ?? initial);
  const [numbers, setNumbers] = useState<Record<NumericKey, string>>(() => Object.fromEntries((['age','height','weight','dumbbellWeight','proteinGoal','mealsPerDay','budget','cookingMinutes','workoutMinutes','waterGoal','sodiumGoal'] as NumericKey[]).map(k => [k, (data.profile ?? initial)[k] ? String((data.profile ?? initial)[k]) : ''])) as Record<NumericKey, string>);
  const [error, setError] = useState('');
  function field(key: NumericKey, label: string) { return <Field key={key} label={label} keyboardType="decimal-pad" value={numbers[key]} onChangeText={value => setNumbers(n => ({ ...n, [key]: value }))} />; }
  function select(key: keyof Profile, options: string[]) { return <Choices options={options} selected={String(p[key])} onChange={v => setP({ ...p, [key]: v })} />; }
  function multi(key: 'equipment' | 'workoutDays' | 'runningDays', options: string[]) { return <Choices multiple options={options} selected={p[key]} onChange={v => setP({ ...p, [key]: p[key].includes(v) ? p[key].filter(x => x !== v) : [...p[key], v] })} />; }
  function validated() { const parsed = { ...p }; for (const key of Object.keys(numbers) as NumericKey[]) parsed[key] = numbers[key].trim() === '' && key === 'dumbbellWeight' ? 0 : Number(numbers[key]); validateProfile(parsed); return parsed; }
  async function next() {
    setError('');
    try {
      if (step === 1) { if (!p.name.trim()) throw new Error('Enter your preferred name.'); numberIn(numbers.age, 'Age', 13, 110); numberIn(numbers.height, 'Height', 80, 250); numberIn(numbers.weight, 'Weight', 20, 400); }
      if (step === 2 && !p.goal) throw new Error('Choose your fitness goal.');
      if (step === 3 && !p.experience) throw new Error('Choose your training experience.');
      if (step === 4 && !p.equipment.length) throw new Error('Select your available equipment.');
      if (step === 5 && (!p.runningExperience || !p.timeAway)) throw new Error('Select your running experience and time away.');
      if (step === 6) { numberIn(numbers.proteinGoal, 'Protein goal', 1, 400); numberIn(numbers.budget, 'Budget', 1, 1000000); numberIn(numbers.mealsPerDay, 'Meals per day', 1, 8); numberIn(numbers.cookingMinutes, 'Cooking time', 1, 240); }
      if (step === 7) validated();
      if (step < 8) { setStep(step + 1); return; }
      const profile = validated();
      await mutate(d => ({ ...d, profile: { ...profile, name: profile.name.trim() }, weights: !d.profile || d.profile.weight !== profile.weight ? [{ id: id(), date: dateKey(), weight: profile.weight }, ...d.weights] : d.weights }));
      router.replace('/(tabs)');
    } catch (e) { setError(messageOf(e)); }
  }
  return <Screen back={step>0 || !!edit} onBack={()=>{setError('');if(step>1||(!edit&&step>0))setStep(step-1);else router.back();}} title={titles[step]} subtitle={step ? `YOUR PROFILE · ${step} OF 8` : 'A stronger routine. Built around you.'}>
    <View style={{ flexDirection: 'row', gap: 5 }}>{titles.map((_, i) => <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= step ? '#7BAA46' : '#293241' }} />)}</View>
    {step === 0 && <Card accent><Label style={{ fontSize: 64, lineHeight: 76, fontWeight: '900', fontStyle: 'italic', letterSpacing: -4 }}>FORMA</Label><Label large>Train Smarter.{ '\n' }Eat Better.{ '\n' }Become Stronger.</Label><Label muted>Your workouts, food and progress, together on your device. No account needed.</Label></Card>}
    {step === 1 && <Card><Field label="Preferred name" autoComplete="given-name" value={p.name} onChangeText={name => setP({ ...p, name })} />{field('age', 'Age (years)')}{field('height', 'Height (cm)')}{field('weight', 'Current weight (kg)')}</Card>}
    {step === 2 && <Card><Label muted>What would you like to work toward?</Label>{select('goal', goals)}</Card>}
    {step === 3 && <Card><Label muted>We’ll keep your starting point in mind.</Label>{select('experience', experienceOptions)}</Card>}
    {step === 4 && <Card>{multi('equipment', equipmentOptions)}{p.equipment.includes('Dumbbells') && field('dumbbellWeight', 'Weight per dumbbell (kg; optional)')}</Card>}
    {step === 5 && <Card>{select('runningExperience', runningOptions)}<Label>When did you last train consistently?</Label>{select('timeAway', ['Currently consistent', 'Less than 1 month', '1–3 months', '3–6 months', 'More than 6 months', 'New to training'])}</Card>}
    {step === 6 && <Card>{field('proteinGoal', 'Your daily protein goal (g)')}<Label muted>Choose a personal target; this app does not prescribe one.</Label>{select('diet', ['No restriction', 'Vegetarian', 'Vegan', 'Pescatarian'])}<Field label="Food allergies (comma separated)" value={p.allergies} onChangeText={allergies => setP({ ...p, allergies })} />{field('mealsPerDay', 'Meals per day')}{field('budget', 'Food budget (PHP)')}{select('budgetPeriod', ['Weekly', 'Monthly'])}<Field label="Available cooking equipment" value={p.cookingEquipment} onChangeText={cookingEquipment => setP({ ...p, cookingEquipment })} />{field('cookingMinutes', 'Maximum cooking time (minutes)')}</Card>}
    {step === 7 && <Card><Label>Strength days</Label>{multi('workoutDays', days)}<Label>Running days</Label>{multi('runningDays', days)}<Label muted>You can leave days empty and train flexibly.</Label>{field('workoutMinutes', 'Workout duration (minutes)')}{field('waterGoal', 'Personal water goal (mL)')}{field('sodiumGoal', 'Sodium reference (mg)')}<Label muted>Goals are configurable references, not medical requirements. Individual needs vary.</Label><Choices options={['Save reminder interest', 'No reminders']} selected={p.reminders ? 'Save reminder interest' : 'No reminders'} onChange={v => setP({ ...p, reminders: v === 'Save reminder interest' })} /><Label muted>Reminder interest is saved. Device notification scheduling is pending.</Label></Card>}
    {step === 8 && <Card accent><Label large>{p.name}, meet your routine.</Label>{[1,2,3,4,5,6,7].map(n => <View key={n} style={{ gap: 8 }}><Label>{n === 1 ? `${numbers.age} years · ${numbers.height} cm · ${numbers.weight} kg` : n === 2 ? p.goal : n === 3 ? p.experience : n === 4 ? `${p.equipment.join(', ')} · ${numbers.dumbbellWeight || 0} kg dumbbells` : n === 5 ? `${p.runningExperience} · ${p.timeAway}` : n === 6 ? `${numbers.proteinGoal} g protein · PHP ${numbers.budget}/${p.budgetPeriod.toLowerCase()} · ${p.diet} · Allergies: ${p.allergies || 'None entered'} · ${numbers.mealsPerDay} meals · ${p.cookingEquipment || 'No cooking equipment entered'} · ${numbers.cookingMinutes} min cooking` : `Strength: ${p.workoutDays.join(', ') || 'Flexible'} · Run: ${p.runningDays.join(', ') || 'Flexible'} · ${numbers.workoutMinutes} min · Water ${numbers.waterGoal} mL · Sodium ${numbers.sodiumGoal} mg · Reminder interest ${p.reminders ? 'yes' : 'no'}`}</Label><Button secondary title={`Edit ${['', 'personal information', 'goal', 'experience', 'equipment', 'running', 'nutrition', 'routine'][n]}`} onPress={() => setStep(n)} /></View>)}</Card>}
    <ErrorText message={error} /><Button title={step === 0 ? 'Get started →' : step === 8 ? 'Save my profile →' : 'Continue →'} onPress={() => void next()} busy={saving} />
    {edit && <Button secondary title="Cancel editing" onPress={() => router.back()} />}
  </Screen>;
}
