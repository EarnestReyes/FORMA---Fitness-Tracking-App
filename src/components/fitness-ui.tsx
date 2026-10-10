import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Label } from './ui';
import { useTheme } from '../hooks/use-theme';

type Icon = keyof typeof Ionicons.glyphMap;
export function SegmentedControl({options,value,onChange}:{options:string[];value:string;onChange:(value:string)=>void}) {
  const c=useTheme();
  return <View style={[styles.segments,{backgroundColor:c.surface,borderColor:c.border}]}>{options.map(option=><Pressable key={option} accessibilityRole="tab" accessibilityState={{selected:value===option}} onPress={()=>onChange(option)} style={({pressed})=>[styles.segment,{backgroundColor:value===option?c.soft:'transparent',opacity:pressed?0.7:1}]}><Label style={{fontSize:13,lineHeight:20,fontWeight:value===option?'700':'500',color:value===option?c.accent:c.muted,textAlign:'center'}}>{option}</Label></Pressable>)}</View>;
}
export function IconBadge({icon,size=44}:{icon:Icon;size?:number}) {const c=useTheme();return <View style={{width:size,height:size,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:c.soft}}><Ionicons name={icon} size={22} color={c.accent}/></View>;}
export function SummaryTile({label,value,unit,icon}:{label:string;value:string|number;unit?:string;icon:Icon}) {
  const c=useTheme();
  return <View style={[styles.summary,{backgroundColor:c.surface,borderColor:c.border}]}>
    <View style={{flexDirection:'row',alignItems:'center',gap:7}}><Ionicons name={icon} size={16} color={c.accent}/><Label muted style={{flex:1,fontSize:12,lineHeight:17}}>{label}</Label></View>
    <View style={{flexDirection:'row',alignItems:'baseline',flexWrap:'wrap',gap:5}}><Label style={{fontSize:26,lineHeight:32,fontWeight:'700',flexShrink:1}}>{value}</Label>{unit&&<Label muted style={{fontSize:12,lineHeight:18}}>{unit}</Label>}</View>
  </View>;
}
export function DetailRow({title,detail,icon,onPress}:{title:string;detail:string;icon:Icon;onPress?:()=>void}) {const c=useTheme();const content=<><IconBadge icon={icon} size={40}/><View style={{flex:1,minWidth:0,gap:3}}><Label style={{fontWeight:'600'}}>{title}</Label><Label muted style={{fontSize:12,lineHeight:18}}>{detail}</Label></View>{onPress&&<Ionicons name="chevron-forward" color={c.muted} size={19}/>}</>;return onPress?<Pressable accessibilityRole="button" onPress={onPress} style={({pressed})=>[styles.detail,{borderColor:c.border,opacity:pressed?0.65:1}]}>{content}</Pressable>:<View style={[styles.detail,{borderColor:c.border}]}>{content}</View>;}
const styles=StyleSheet.create({segments:{flexDirection:'row',borderWidth:1,borderRadius:18,padding:4,gap:3},segment:{flex:1,minHeight:44,borderRadius:14,paddingHorizontal:4,paddingVertical:10,justifyContent:'center'},summary:{borderRadius:18,borderWidth:1,padding:14,gap:10,minWidth:0},detail:{flexDirection:'row',gap:12,alignItems:'center',paddingVertical:14,borderBottomWidth:1,minHeight:72}});
