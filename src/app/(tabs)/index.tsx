import { useProfilePhoto } from '../../features/profile-photo/store';
import { useEffect, useState } from 'react';
import { AppState, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Empty, ErrorText, Field, Label, Meter, Row, Screen, Section, messageOf, ResponsiveGrid, StatCard, ExpandableSection, BottomSheet, ProfileAvatar } from '../../components/ui';
import { useTheme } from '../../hooks/use-theme';
import { mutate, useApp } from '../../stores/app';
import { dateKey, id, mealTotals, numberIn, recoverySummary, waterTotal, weekStart } from '../../utils/calculations';

export default function Home() {
  const photo=useProfilePhoto(); const { data, saving } = useApp(); const p = data.profile!; const c = useTheme();
  const [today, setToday] = useState(dateKey()); const [weight, setWeight] = useState(''); const [showWeight, setShowWeight] = useState(false); const [error, setError] = useState('');
  useEffect(() => { const timer = setInterval(() => setToday(dateKey()), 30000); const subscription = AppState.addEventListener('change', () => setToday(dateKey())); return () => { clearInterval(timer); subscription.remove(); }; }, []);
  const total = mealTotals(data.meals.filter(m => m.date === today), data.foods); const water = waterTotal(data.water.filter(w => w.date === today));
  const completed = data.sessions.filter(s => s.status === 'finished' && s.date >= weekStart() && s.date <= today);
  const activeDays = new Set([...completed.map(s=>s.date),...data.runs.filter(r=>r.date>=weekStart()&&r.date<=today).map(r=>r.date)]).size;
  const distance = data.runs.filter(r => r.date >= weekStart() && r.date <= today).reduce((n, r) => n + r.distance, 0);
  const latestWeight = [...data.weights].sort((a,b) => b.date.localeCompare(a.date))[0]?.weight ?? p.weight;
  const latestRecovery = [...data.recovery].filter(r => r.date <= today).sort((a,b) => b.date.localeCompare(a.date))[0];
  const recovery = recoverySummary(latestRecovery);
  const scheduled = data.activities.filter(a => a.date === today && a.status === 'planned');
  const template = data.templates.find(t => scheduled.some(a => a.kind === 'Workout' && a.name === t.name));
  const active = data.sessions.find(s => s.status !== 'finished');
  const activities = [
    ...data.sessions.filter(s => s.status === 'finished').map(s => ({ id: s.id, date: s.date, label: `${s.name} completed`, icon: 'barbell-outline' as const })),
    ...data.runs.map(r => ({ id: r.id, date: r.date, label: `${r.distance.toFixed(2)} km run logged`, icon: 'walk-outline' as const })),
    ...data.meals.map(m => ({ id: m.id, date: m.date, label: `${m.category} · ${data.foods.find(f => f.id === m.foodId)?.name ?? 'Food'}`, icon: 'restaurant-outline' as const })),
  ].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5);
  async function logWeight() { try { const amount = numberIn(weight, 'Weight (kg)', 20, 400); await mutate(d => ({ ...d, weights: [{ id: id(), date: today, weight: amount }, ...d.weights], profile: d.profile ? { ...d.profile, weight: amount } : null })); setShowWeight(false); setWeight(''); } catch(e) { setError(messageOf(e)); } }
  const hour = new Date().getHours(); const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return <Screen title={`${greeting}, ${p.name.split(' ')[0]}.`} subtitle={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} action={<Row><Pressable accessibilityRole="button" accessibilityLabel="Notification settings" onPress={() => router.push('/settings')} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="notifications-outline" size={22} color={c.text} /></Pressable><ProfileAvatar name={p.name} uri={photo.uri} onPress={()=>router.push('/(tabs)/profile')}/></Row>}>
    <Card accent><Label muted style={{ letterSpacing: 2, fontSize: 11 }}>TODAY’S FOCUS</Label><Label large>{active ? active.name : template?.name ?? 'Make today count.'}</Label><Label muted>{active ? 'Your saved session is ready to continue.' : template ? `${template.exercises.length} exercises · ${[...new Set(template.exercises.map(ex => data.exercises.find(e => e.id === ex.exerciseId)?.muscle))].join(', ')} · about ${template.exercises.reduce((s,e) => s + e.sets * 3,0)} min` : scheduled.length ? scheduled.map(a => a.name).join(' · ') : 'Choose a workout or plan a recovery day. Consistency includes rest.'}</Label><Button title={active ? 'Resume workout →' : 'Choose today’s workout →'} onPress={() => active ? router.push({ pathname: '/workout/session', params: { id: active.id } }) : router.push('/(tabs)/train')} /></Card>

    <Section title="Today"><ResponsiveGrid><Meter label="Protein" value={total.protein} target={p.proteinGoal} unit="g" /><Meter label="Water" value={water} target={p.waterGoal} unit="mL" /></ResponsiveGrid><Card><Label style={{fontWeight:'600'}}>Recovery ? {recovery.label}</Label><Label muted>{latestRecovery ? 'Latest check-in: '+latestRecovery.date : 'Check in to see your recovery summary.'}</Label><Button secondary title="Daily check-in" onPress={()=>router.push('/recovery')}/></Card></Section>
    <Section title="Quick actions"><ResponsiveGrid><Button secondary title="Workout" icon="barbell-outline" onPress={()=>router.push('/(tabs)/train')}/><Button secondary title="Log run" icon="walk-outline" onPress={()=>router.push('/(tabs)/run')}/><Button secondary title="Log meal" icon="restaurant-outline" onPress={()=>router.push('/nutrition')}/><Button secondary title="Add water" icon="water-outline" onPress={()=>router.push('/hydration')}/></ResponsiveGrid></Section>
    <Section title="This week"><ResponsiveGrid><StatCard label="Workouts completed" value={completed.length} detail={p.workoutDays.length ? p.workoutDays.length+' preferred training days' : 'Flexible schedule'} /><StatCard label="Running distance" value={distance.toFixed(1)+' km'} detail="From saved runs" /></ResponsiveGrid><Button secondary title="View progress" onPress={()=>router.push('/(tabs)/progress')}/></Section>
    <Card><Label style={{fontWeight:'600'}}>Weekly activity</Label><Label muted>{activeDays} of 7 days with a saved workout or run</Label></Card><Section title="For your next session"><Card><Label muted>{latestRecovery ? recovery.reason : scheduled.length ? 'Your planned activities for today: '+scheduled.map(a=>a.name).join(', ') : 'Plan your next session in Calendar, or choose a workout that fits your day.'}</Label><Button secondary title={latestRecovery?'Review recovery':'Plan an activity'} onPress={()=>router.push(latestRecovery?'/recovery':'/calendar')}/></Card></Section>
    <ExpandableSection title="Weight, sodium & planning"><StatCard label="Latest weight" value={latestWeight+' kg'}/><Button secondary title="Log weight" onPress={()=>{setError('');setShowWeight(true);}}/><Meter label="Known sodium today" value={total.sodium} target={p.sodiumGoal} unit="mg"/>{total.unknownSodium>0&&<Label muted>{total.unknownSodium} entries have unknown sodium.</Label>}<Button secondary title="Open calendar" onPress={()=>router.push('/calendar')}/></ExpandableSection>
    <BottomSheet title="Log weight" visible={showWeight} onClose={()=>setShowWeight(false)}><Field label="Weight (kg)" keyboardType="decimal-pad" value={weight} onChangeText={setWeight}/><ErrorText message={error}/><Button title="Save measurement" busy={saving} onPress={()=>void logWeight()}/></BottomSheet>
    <Section title="Recent activity">{activities.length ? <Card>{activities.map(a => <View key={a.id} style={{ flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 6 }}><Ionicons name={a.icon} color={c.accent} size={22} /><View style={{ flex: 1 }}><Label>{a.label}</Label><Label muted style={{ fontSize: 12 }}>{a.date}</Label></View></View>)}</Card> : <Empty title="A fresh start" detail="Your workouts, runs and meals will appear here as you log them." />}</Section>
  </Screen>;
}
