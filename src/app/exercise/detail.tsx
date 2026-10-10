import { useLocalSearchParams, router } from 'expo-router';
import { Button, Card, Label, Screen, Section } from '../../components/ui';
import { useApp } from '../../stores/app';
export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { data } = useApp(); const ex = data.exercises.find(e => e.id === id);
  if (!ex) return <Screen back title="Exercise unavailable"><Label>This exercise was removed.</Label></Screen>;
  return <Screen back title={ex.name} subtitle={`${ex.equipment} · ${ex.difficulty}`}><Card accent><Label>Primary: {ex.muscle}</Label><Label muted>Secondary: {ex.secondary}</Label><Label>{ex.sets} sets × {ex.reps} reps · adjustable starting suggestion</Label></Card><Section title="How to perform"><Label>{ex.instructions}</Label></Section><Section title="Form cues"><Label>{ex.tips}</Label></Section><Section title="Common mistakes"><Label>{ex.mistakes}</Label></Section><Button title="Build a workout with this exercise" onPress={() => router.push({ pathname: '/workout/template', params: { add: ex.id } })} /></Screen>;
}
