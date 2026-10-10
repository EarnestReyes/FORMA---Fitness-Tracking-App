import { router } from 'expo-router';
import { useState } from 'react';
import { Button, Card, Choices, ErrorText, Field, Label, Row, Screen, messageOf, Empty, BottomSheet } from '../../components/ui';
import { mutate, useApp } from '../../stores/app';
import { id } from '../../utils/calculations';

export default function Library() {
  const { data, saving } = useApp(); const [search, setSearch] = useState(''); const [filter, setFilter] = useState('All'); const [error, setError] = useState(''); const [custom, setCustom] = useState(false);
  const [name, setName] = useState(''); const [muscle, setMuscle] = useState('Full Body'); const [equipment, setEquipment] = useState('Bodyweight'); const [instructions, setInstructions] = useState('');
  const muscles = ['Chest','Back','Shoulders','Arms','Legs','Glutes','Core','Full Body'];
  async function create() {
    try { if (!name.trim() || !instructions.trim()) throw new Error('Enter a name and instructions.'); if (data.exercises.some(e => e.name.toLowerCase() === name.trim().toLowerCase())) throw new Error('An exercise with this name already exists.'); await mutate(d => ({ ...d, exercises: [...d.exercises, { id: id(), name: name.trim(), muscle, secondary: 'User-defined', equipment, instructions, difficulty: 'Custom', tips: 'Use a comfortable range and controlled movement.', mistakes: 'Avoid moving through pain.', sets: 3, reps: 10 }] })); setCustom(false); setName(''); setInstructions(''); }
    catch(e) { setError(messageOf(e)); }
  }
  return <Screen back title="Exercise library" subtitle={`${data.exercises.length} movements. Find your next rep.`}><Field label="Search exercises" value={search} onChangeText={setSearch} /><Choices options={['All','Favorites', ...muscles,'Dumbbells','Bodyweight','Resistance Bands']} selected={filter} onChange={setFilter} /><Button secondary title={custom ? 'Close custom exercise form' : 'Create custom exercise'} onPress={() => setCustom(!custom)} />
    <BottomSheet title="Custom exercise" visible={custom} onClose={()=>setCustom(false)}><ErrorText message={error}/><Field label="Exercise name" value={name} onChangeText={setName} /><Choices options={muscles} selected={muscle} onChange={setMuscle} /><Choices options={['Bodyweight','Dumbbells','Resistance Bands','Full Gym']} selected={equipment} onChange={setEquipment} /><Field label="Instructions" multiline value={instructions} onChangeText={setInstructions} /><Button title="Save custom exercise" busy={saving} onPress={() => void create()} /></BottomSheet>
    <ErrorText message={error} />
    {!data.exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) && (filter === 'All' || filter === 'Favorites' && data.favorites.includes(e.id) || filter === e.muscle || filter === e.equipment)).length&&<Empty title="No matching exercises" detail="Try another search or filter, or create your own exercise."/>}
    {data.exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) && (filter === 'All' || filter === 'Favorites' && data.favorites.includes(e.id) || filter === e.muscle || filter === e.equipment)).map(ex => <Card key={ex.id}><Label style={{ fontSize: 19, fontWeight: '700' }}>{ex.name}</Label><Label muted>{ex.muscle} · {ex.equipment} · {ex.difficulty}</Label><Row><Button secondary title="View movement" onPress={() => router.push({ pathname: '/exercise/detail', params: { id: ex.id } })} /><Button secondary title={data.favorites.includes(ex.id) ? '★ Saved' : '☆ Favorite'} onPress={() => { void mutate(d => ({ ...d, favorites: d.favorites.includes(ex.id) ? d.favorites.filter(x => x !== ex.id) : [...d.favorites, ex.id] })).catch(e => setError(messageOf(e))); }} /></Row></Card>)}
  </Screen>;
}
