import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, BottomSheet, Card, Empty, ErrorText, Field, Label, Screen, SectionHeader, ResponsiveGrid, messageOf } from '../../components/ui';
import { SegmentedControl, IconBadge, SummaryTile, DetailRow } from '../../components/fitness-ui';
import { useTheme } from '../../hooks/use-theme';
import { mutate, useApp } from '../../stores/app';
import { dateKey, id, volume, weekStart } from '../../utils/calculations';
import type { WorkoutTemplate } from '../../types/models';

export default function Train() {
  const [view,setView]=useState('Workouts'); const { data, saving } = useApp(); const [error,setError]=useState('');
  const [search,setSearch]=useState(''); const [preview,setPreview]=useState<string|null>(null);
  const c=useTheme();const {width}=useWindowDimensions();
  const active=data.sessions.find(s=>s.status!=='finished');
  async function start(template: WorkoutTemplate) {
    try {
      if (active) { setPreview(null); router.push({ pathname: '/workout/session', params: { id: active.id } }); return; }
      const sessionId = id();
      await mutate(d => {
        if (d.sessions.some(s => s.status !== 'finished')) throw new Error('A workout is already active. Resume it before starting another.');
        return { ...d, sessions: [{ id: sessionId, name: template.name, date: dateKey(), duration: 0, notes: '', status: 'active', accumulated: 0, startedAt: Date.now(), sets: template.exercises.flatMap(ex => Array.from({ length: ex.sets }, () => ({ id: id(), exerciseId: ex.exerciseId, reps: ex.reps, weight: ex.weight, completed: false, notes: ex.notes }))) }, ...d.sessions] };
      });
      setPreview(null);
      router.push({ pathname: '/workout/session', params: { id: sessionId } });
    } catch (e) { setError(messageOf(e)); }
  }

  const history=data.sessions.filter(s=>s.status==='finished').sort((a,b)=>b.date.localeCompare(a.date));
  const sets=history.flatMap(s=>s.sets).filter(s=>s.completed);
  const weekly=history.filter(s=>s.date>=weekStart()&&s.date<=dateKey());
  const collection=data.templates.filter(t=>t.name.toLowerCase().includes(search.toLowerCase()));
  const selected=data.templates.find(t=>t.id===preview);
  return <Screen title="Training" action={<Button secondary title="Create" icon="add" onPress={()=>router.push('/workout/template')}/>}>
    <View style={{gap:6}}><Label large>Your next strong day.</Label><Label muted>Choose a session. Make it yours.</Label></View>
    {active?<Card accent><View style={{flexDirection:'row',alignItems:'center',gap:12}}><IconBadge icon="play"/><View style={{flex:1}}><Label style={{color:c.accent,fontSize:12,fontWeight:'700'}}>READY TO CONTINUE</Label><Label style={{fontSize:20,lineHeight:28,fontWeight:'700'}}>{active.name}</Label></View></View><Button title="Resume session" icon="play" onPress={()=>router.push({pathname:'/workout/session',params:{id:active.id}})}/></Card>:<ResponsiveGrid><SummaryTile icon="checkmark-circle-outline" label="Sessions this week" value={weekly.length}/><SummaryTile icon="time-outline" label="Training this week" value={Math.round(weekly.reduce((sum,s)=>sum+s.duration,0)/60000)} unit="min"/></ResponsiveGrid>}
    <ErrorText message={error}/>
    <SegmentedControl options={['Workouts','Records','History']} value={view} onChange={setView}/>
    {view==='Workouts'&&<View style={{gap:16}}>
      <Field label="Find a workout" placeholder="Search your collection" value={search} onChangeText={setSearch}/>
      <SectionHeader title="Your collection" action={<Label muted style={{fontSize:13}}>{collection.length} workouts</Label>}/>
      <View style={{flexDirection:'row',flexWrap:'wrap',alignItems:'flex-start',gap:14}}>{collection.map((template,index)=><View key={template.id} style={{width:width>=740?'48.5%':'100%'}}><Card style={{padding:16,gap:12}}>
        <View style={{flexDirection:'row',alignItems:'center',gap:12}}><IconBadge icon="barbell-outline"/><View style={{flex:1,minWidth:0}}><Label muted style={{fontSize:11,letterSpacing:1}}>SESSION {String(index+1).padStart(2,'0')}</Label><Label style={{fontWeight:'700',fontSize:19,lineHeight:27}}>{template.name}</Label></View><Pressable accessibilityRole="button" accessibilityLabel={'Edit '+template.name} onPress={()=>router.push({pathname:'/workout/template',params:{id:template.id}})} style={{width:44,height:44,justifyContent:'center',alignItems:'center'}}><Ionicons name="ellipsis-horizontal" size={22} color={c.muted}/></Pressable></View>
        <Label muted style={{fontSize:13}}>{template.exercises.length} exercises  /  ~{template.exercises.reduce((sum,e)=>sum+e.sets*3,0)} min</Label>
        <Label numberOfLines={2} style={{fontSize:13,lineHeight:20}}>{[...new Set(template.exercises.map(e=>data.exercises.find(x=>x.id===e.exerciseId)?.muscle))].filter(Boolean).join(' ? ')}</Label>
        <View style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={{flex:1}}><Button secondary title="Preview session" onPress={()=>setPreview(template.id)}/></View><Pressable accessibilityRole="button" accessibilityLabel={active?'Resume active workout':'Start '+template.name} disabled={saving} accessibilityState={{disabled:saving}} onPress={()=>void start(template)} style={({pressed})=>({width:50,height:50,borderRadius:16,backgroundColor:c.accent,alignItems:'center',justifyContent:'center',opacity:saving?0.5:pressed?0.7:1})}><Ionicons name="play" size={21} color={c.accentText}/></Pressable></View>
      </Card></View>)}</View>
      {!collection.length&&<Empty title="No workouts found" detail="Try a different name or create your own session."/>}
      <DetailRow icon="search-outline" title="Explore the exercise library" detail="Find movements, form cues and favorites" onPress={()=>router.push('/exercise')}/>
    </View>}
    {view==='Records'&&<View style={{gap:16}}><SectionHeader title="Your personal bests"/><Label muted>Based on completed sets and finished workouts.</Label><ResponsiveGrid><SummaryTile icon="barbell-outline" label="Heaviest set" value={sets.length?Math.max(...sets.map(s=>s.weight)):'?'} unit="kg"/><SummaryTile icon="repeat-outline" label="Most repetitions" value={sets.length?Math.max(...sets.map(s=>s.reps)):'?'} unit="reps"/></ResponsiveGrid><Card><Label muted>Best session volume</Label><Label large>{history.length?Math.max(...history.map(s=>volume(s.sets))).toLocaleString():'?'} <Label muted>kg</Label></Label><Label muted>{history.length} completed sessions in your history</Label></Card>{!sets.length&&<Empty title="Build your first benchmark" detail="Complete a workout to start seeing your personal bests."/>}</View>}
    {view==='History'&&<View style={{gap:12}}><SectionHeader title="Completed sessions" action={<Label muted>{history.length}</Label>}/>{history.length?<Card style={{paddingVertical:4}}>{history.map(session=><DetailRow key={session.id} icon="checkmark-outline" title={session.name} detail={session.date+' ? '+Math.round(session.duration/60000)+' min ? '+session.sets.filter(s=>s.completed).length+' sets ? '+volume(session.sets).toLocaleString()+' kg'} onPress={()=>router.push({pathname:'/workout/session',params:{id:session.id}})}/>)}</Card>:<Empty title="Your first session starts here" detail="Completed workouts will appear here."/>}</View>}
    <BottomSheet title={selected?.name??'Session preview'} visible={!!selected} onClose={()=>setPreview(null)}>{selected&&<><Label muted>{selected.exercises.length} exercises ? estimated {selected.exercises.reduce((sum,e)=>sum+e.sets*3,0)} minutes</Label>{!!selected.notes&&<Label>{selected.notes}</Label>}{selected.exercises.map((ex,index)=><DetailRow key={ex.id} icon="barbell-outline" title={(index+1)+'. '+(data.exercises.find(e=>e.id===ex.exerciseId)?.name??'Exercise')} detail={ex.sets+' sets ? '+ex.reps+' reps ? '+ex.weight+' kg'}/>)}<ErrorText message={error}/><Button title={active?'Resume active workout':'Start session'} icon="play" busy={saving} onPress={()=>void start(selected)}/><Button secondary title="Edit workout" onPress={()=>{setPreview(null);router.push({pathname:'/workout/template',params:{id:selected.id}});}}/></>}</BottomSheet>
  </Screen>;
}
