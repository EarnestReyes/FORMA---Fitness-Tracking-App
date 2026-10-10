import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { Button, Card, Choices, ErrorText, Field, Label, Row, Screen, confirmDelete, messageOf, ExpandableSection } from '../../components/ui';
import { mutate, useApp } from '../../stores/app';
import type { PlannedExercise } from '../../types/models';
import { id, numberIn } from '../../utils/calculations';

export default function Template() {
  const { id: templateId, add } = useLocalSearchParams<{ id?: string; add?: string }>();
  const { data, saving } = useApp(); const existing = data.templates.find(t => t.id === templateId);
  const [name, setName] = useState(existing?.name ?? ''); const [notes, setNotes] = useState(existing?.notes ?? '');
  const [exercises, setExercises] = useState<PlannedExercise[]>(existing?.exercises ?? (add ? [{ id: id(), exerciseId: add, sets: 3, reps: 10, weight: 0, notes: '' }] : []));
  const [search, setSearch] = useState(''); const [error, setError] = useState('');
  function update(exId: string, patch: Partial<PlannedExercise>) { setExercises(list => list.map(e => e.id === exId ? { ...e, ...patch } : e)); }
  async function save() {
    try {
      if (!name.trim() || name.length > 80) throw new Error('Enter a workout name of 1–80 characters.');
      if (!exercises.length) throw new Error('Add at least one exercise.');
      for (const ex of exercises) { numberIn(ex.sets, 'Sets', 1, 30); numberIn(ex.reps, 'Repetitions', 1, 500); numberIn(ex.weight, 'Weight', 0, 1000); if (!Number.isInteger(ex.sets) || !Number.isInteger(ex.reps)) throw new Error('Sets and reps must be whole numbers.'); }
      const template = { id: existing?.id ?? id(), name: name.trim(), notes, exercises };
      await mutate(d => ({ ...d, templates: [template, ...d.templates.filter(t => t.id !== template.id)] })); router.back();
    } catch (e) { setError(messageOf(e)); }
  }
  return <Screen back title={existing ? 'Edit workout' : 'Create workout'} subtitle="Make this session your own."><Field label="Workout name" value={name} onChangeText={setName} /><Field label="Workout notes" multiline value={notes} onChangeText={setNotes} />
    {exercises.map((ex, index) => <Card key={ex.id}><Label style={{ fontWeight: '700' }}>{index + 1}. {data.exercises.find(x => x.id === ex.exerciseId)?.name}</Label><Row>{(['sets', 'reps', 'weight'] as const).map(key => <Field key={key} label={key === 'weight' ? 'Weight (kg; 0 for bodyweight)' : key} keyboardType="decimal-pad" value={Number.isNaN(ex[key]) ? '' : String(ex[key])} onChangeText={v => update(ex.id, { [key]: v.trim() ? Number(v) : NaN })} />)}</Row><Field label="Exercise notes" value={ex.notes} onChangeText={v => update(ex.id, { notes: v })} /><Row><Button secondary title="Move up" disabled={index === 0} onPress={() => setExercises(list => { const copy = [...list]; [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]]; return copy; })} /><Button secondary title="Move down" disabled={index === exercises.length - 1} onPress={() => setExercises(list => { const copy = [...list]; [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]]; return copy; })} /><Button danger title="Remove" onPress={() => confirmDelete('Remove this exercise?',()=>setExercises(list => list.filter(x => x.id !== ex.id)),'This removes the exercise from your draft workout.')} /></Row></Card>)}
    <ExpandableSection title="Add exercises"><Field label="Search exercises to add" value={search} onChangeText={setSearch} /><Choices selected="" options={data.exercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase())).map(ex => ex.name)} onChange={name => { const ex = data.exercises.find(ex => ex.name === name); if (ex) setExercises(list => [...list, { id: id(), exerciseId: ex.id, sets: ex.sets, reps: ex.reps, weight: 0, notes: '' }]); }} /></ExpandableSection>
    <ErrorText message={error} /><Button title="Save workout" busy={saving} onPress={() => void save()} />
    {existing && <Button danger title="Delete template" onPress={() => confirmDelete('Delete this workout template?', () => { void mutate(d => ({ ...d, templates: d.templates.filter(t => t.id !== existing.id) })).then(() => router.back()).catch(e => setError(messageOf(e))); })} />}
  </Screen>;
}
