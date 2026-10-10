import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Card, ErrorText, Field, Label, Row, Screen, confirmDelete, messageOf, ExpandableSection } from '../../components/ui';
import { mutate, useApp } from '../../stores/app';
import type { WorkoutSession, WorkoutSet } from '../../types/models';
import { clock, elapsed, id, numberIn, volume } from '../../utils/calculations';

function SetRow({ set, index, onSave, onRemove }: { set: WorkoutSet; index: number; onSave: (s: WorkoutSet) => Promise<void>; onRemove: () => void }) {
  const [reps, setReps] = useState(String(set.reps)); const [weight, setWeight] = useState(String(set.weight)); const [notes, setNotes] = useState(set.notes); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function save(toggle: boolean) {
    try { setBusy(true); setError(''); const r = numberIn(reps, 'Repetitions', 1, 500); if (!Number.isInteger(r)) throw new Error('Repetitions must be whole numbers.'); await onSave({ ...set, reps: r, weight: numberIn(weight, 'Weight', 0, 1000), notes, completed: toggle ? !set.completed : set.completed }); }
    catch (e) { setError(messageOf(e)); } finally { setBusy(false); }
  }
  return <Card><Label muted>SET {index + 1} · {set.completed ? 'COMPLETED' : 'PLANNED'}</Label><Row><Field label="Repetitions" keyboardType="number-pad" value={reps} onChangeText={setReps} /><Field label="Weight (kg)" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} /></Row><ExpandableSection title="Set notes"><Field label="Set / exercise notes" value={notes} onChangeText={setNotes} /></ExpandableSection><ErrorText message={error} /><Row><Button busy={busy} title={set.completed ? 'Mark planned' : 'Complete set'} onPress={() => void save(true)} /><Button secondary busy={busy} title="Save edits" onPress={() => void save(false)} /><Button danger title="Remove set" onPress={onRemove} /></Row></Card>;
}
export default function Session() {
  const { id: sessionId } = useLocalSearchParams<{ id: string }>(); const { data, saving } = useApp();
  const session = data.sessions.find(s => s.id === sessionId); const [now, setNow] = useState(Date.now()); const [restUntil, setRestUntil] = useState<number | null>(null); const [error, setError] = useState('');
  const [notes, setNotes] = useState(session?.notes ?? ''); const [duration, setDuration] = useState(String((session?.duration ?? 0) / 60000));
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  async function update(patch: Partial<WorkoutSession>) { await mutate(d => ({ ...d, sessions: d.sessions.map(s => s.id === sessionId ? { ...s, ...patch } : s) })); }
  function act(action: () => Promise<void>) { void Promise.resolve().then(action).catch(e => setError(messageOf(e))); }
  if (!session) return <Screen back title="Workout unavailable"><Label>This session was removed.</Label></Screen>;
  const finished = session.status === 'finished'; const exerciseIds = [...new Set(session.sets.map(s => s.exerciseId))];
  return <Screen back title={session.name} subtitle={`${session.date} · ${finished ? 'Completed workout' : 'Your session is saved on this device'}`}>
    <Card accent><Label muted>{finished ? 'SESSION DURATION' : 'SESSION TIMER'}</Label><Label style={{ fontSize: 52, lineHeight: 64, fontWeight: '800' }}>{clock(finished ? session.duration : elapsed(session))}</Label><Label>{session.sets.filter(s => s.completed).length} / {session.sets.length} sets completed · {volume(session.sets).toLocaleString()} kg volume</Label>
    {!finished && <Row><Button secondary busy={saving} title={session.status === 'paused' ? 'Resume' : 'Pause'} onPress={() => act(() => update(session.status === 'paused' ? { status: 'active', startedAt: Date.now() } : { status: 'paused', accumulated: elapsed(session), startedAt: null }))} /><Button title="Finish workout" busy={saving} onPress={() => act(async () => { if (!session.sets.some(s => s.completed)) throw new Error('Complete at least one set before finishing.'); const duration = elapsed(session); await update({ status: 'finished', duration, accumulated: duration, startedAt: null, notes }); })} /></Row>}
    </Card>
    {!finished && <Card><Label>Rest timer · {restUntil ? clock(Math.max(0, restUntil - now)) : 'Ready'}</Label><Row>{[30,60,90].map(seconds => <Button secondary key={seconds} title={`${seconds}s`} onPress={() => setRestUntil(Date.now() + seconds * 1000)} />)}<Button secondary title="Clear rest" onPress={() => setRestUntil(null)} /></Row></Card>}
    <ExpandableSection title="Session details" initiallyOpen={finished}><Field label="Session notes" value={notes} multiline onChangeText={setNotes} />{finished && <Field label="Duration (minutes)" keyboardType="decimal-pad" value={duration} onChangeText={setDuration} />}
    <Button secondary title="Save session details" busy={saving} onPress={() => act(() => update({ notes, ...(finished ? { duration: numberIn(duration, 'Duration', 0.01, 1440) * 60000 } : {}) }))} />
    </ExpandableSection><ErrorText message={error} />
    {exerciseIds.map(exerciseId => <Card key={exerciseId}><Label style={{ fontSize: 20, fontWeight: '700' }}>{data.exercises.find(e => e.id === exerciseId)?.name}</Label>{session.sets.filter(s => s.exerciseId === exerciseId).map((set, i) => <SetRow key={set.id} set={set} index={i} onSave={async updated => { await mutate(d => ({ ...d, sessions: d.sessions.map(s => s.id === session.id ? { ...s, sets: s.sets.map(x => x.id === updated.id ? updated : x) } : s) })); if (!finished && updated.completed) setRestUntil(Date.now() + 60000); }} onRemove={() => confirmDelete('Remove this set?', () => act(() => mutate(d => ({ ...d, sessions: d.sessions.map(s => s.id === session.id ? { ...s, sets: s.sets.filter(x => x.id !== set.id) } : s) }))))} />)}<Button secondary title="Add set" onPress={() => act(() => mutate(d => ({ ...d, sessions: d.sessions.map(s => s.id === session.id ? { ...s, sets: [...s.sets, { id: id(), exerciseId, reps: 10, weight: 0, completed: false, notes: '' }] } : s) })))} /></Card>)}
    <Button danger title={finished ? 'Delete session' : 'Discard workout'} onPress={() => confirmDelete('Delete this workout session?', () => act(async () => { await mutate(d => ({ ...d, sessions: d.sessions.filter(s => s.id !== session.id) })); router.back(); }))} />
  </Screen>;
}
