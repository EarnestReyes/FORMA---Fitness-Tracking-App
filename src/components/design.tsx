import { useFloatingTabInset } from '../hooks/floating-tab-inset';
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren, type ReactNode } from 'react';
import { AccessibilityInfo, ActivityIndicator, Alert, Animated, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, type TextInputProps, type TextProps, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/use-theme';

const SheetContext = createContext(false);
type Icon = keyof typeof Ionicons.glyphMap;
export function Label({ children, muted, large, style, ...props }: TextProps & { muted?: boolean; large?: boolean }) {
  const c = useTheme();
  return <Text {...props} style={[{ color: muted ? c.muted : c.text, fontSize: large ? 28 : 15, lineHeight: large ? 36 : 23, fontWeight: large ? '700' : '400' }, style]}>{children}</Text>;
}
export function IconButton({ icon, label, onPress, disabled }: { icon: Icon; label: string; onPress: () => void; disabled?: boolean }) {
  const c = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => ({ width: 46, height: 46, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: pressed ? c.soft : 'transparent', opacity: disabled ? 0.4 : 1 })}><Ionicons name={icon} size={23} color={c.text} /></Pressable>;
}
export function AppHeader({ title, back, action, fallback = '/(tabs)', onBack }: { onBack?: () => void; title: string; back?: boolean; action?: ReactNode; fallback?: Href }) {
  const c = useTheme();
  return <View style={[styles.headerBorder, { borderColor: c.border, backgroundColor: c.background }]}><View style={styles.header}>
    {back ? <IconButton icon="chevron-back" label="Go back" onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.replace(fallback))} /> : <View style={{ width: 5, height: 24, borderRadius: 3, backgroundColor: c.accent }} />}
    <Label accessibilityRole="header" numberOfLines={1} style={{ flex: 1, fontSize: 20, lineHeight: 28, fontWeight: '700' }}>{title}</Label>{action}
  </View></View>;
}
export function Screen({ title, subtitle, children, back, action, fallback, onBack, heading = true }: PropsWithChildren<{ onBack?: () => void; title: string; subtitle?: string; back?: boolean; action?: ReactNode; fallback?: Href; heading?: boolean }>) {
  const c = useTheme(); const { width } = useWindowDimensions(); const insets = useSafeAreaInsets(); const floatingInset = useFloatingTabInset();
  return <SafeAreaView edges={['top','left','right']} style={{ flex: 1, backgroundColor: c.background }}>
    <AppHeader title={title} back={back} action={action} fallback={fallback} onBack={onBack} />
    <KeyboardAvoidingView style={{ flex: 1, minHeight: 0 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView scrollIndicatorInsets={{bottom:floatingInset}} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} contentContainerStyle={[styles.page, { paddingHorizontal: width < 390 ? 16 : 24, paddingBottom: Math.max(28, insets.bottom + 16, floatingInset) }]}>
        {heading && subtitle && <Label muted style={{ marginBottom: 2 }}>{subtitle}</Label>}{children}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function Card({ children, style, accent }: PropsWithChildren<{ style?: ViewStyle; accent?: boolean }>) {
  const c = useTheme(); return <View style={[styles.card, { backgroundColor: accent ? c.soft : c.surface, borderColor: accent ? c.accent : c.border }, style]}>{children}</View>;
}
export function Button({ title, onPress, secondary, danger, disabled, busy, icon }: { title: string; onPress: () => void; secondary?: boolean; danger?: boolean; disabled?: boolean; busy?: boolean; icon?: Icon }) {
  const c = useTheme(); const color = danger ? c.danger : secondary ? c.text : c.accentText;
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: !!disabled || !!busy, busy: !!busy }} disabled={disabled || busy} onPress={() => { Keyboard.dismiss(); onPress(); }} style={({ pressed }) => [styles.button, { backgroundColor: secondary || danger ? c.surface : c.accent, borderColor: danger ? c.danger : secondary ? c.border : c.accent, opacity: disabled || busy ? 0.5 : pressed ? 0.75 : 1, ...(danger ? { alignSelf: 'flex-start', marginTop: 12 } : {}) }]}>
    {busy ? <><ActivityIndicator color={color} /><Text style={{ color, fontWeight: '600' }}>Saving…</Text></> : <>{icon && <Ionicons name={icon} size={20} color={color} />}<Text style={{ color, fontSize: 15, fontWeight: '600', textAlign: 'center', flexShrink: 1 }}>{title}</Text></>}
  </Pressable>;
}
export function PrimaryButton(props: React.ComponentProps<typeof Button>) { return <Button {...props} />; }
export function SecondaryButton(props: React.ComponentProps<typeof Button>) { return <Button {...props} secondary />; }
export function Field({ label, style, ...props }: TextInputProps & { label: string }) {
  const c = useTheme(); const [focused,setFocused] = useState(false);
  return <View style={{ gap: 7, flexGrow: 1, minWidth: 120 }}><Label style={{ fontSize: 14, fontWeight: '600' }}>{label}</Label><TextInput accessibilityLabel={label} placeholder={props.placeholder ?? (props.keyboardType === 'decimal-pad' || props.keyboardType === 'number-pad' ? '0' : undefined)} placeholderTextColor={c.muted} returnKeyType={props.multiline ? 'default' : 'done'} {...props} onFocus={event => { setFocused(true); props.onFocus?.(event); }} onBlur={event => { setFocused(false); props.onBlur?.(event); }} style={[styles.input, { color: c.text, backgroundColor: c.background, borderColor: focused ? c.accent : c.border, ...(props.multiline ? { minHeight: 96, textAlignVertical: 'top' as const } : {}) },style]} /></View>;
}
export function Choices({ options, selected, onChange, multiple }: { options: string[]; selected: string | string[]; onChange: (value: string) => void; multiple?: boolean }) {
  const c = useTheme(); const insideSheet=useContext(SheetContext); const [open,setOpen] = useState(false); const [query,setQuery] = useState('');
  if(options.length > 12) {
    const content=<><Field label="Search options" value={query} onChangeText={setQuery}/>{options.filter(option=>option.toLowerCase().includes(query.toLowerCase())).map((option,i)=><Button key={i} secondary title={((Array.isArray(selected)?selected.includes(option):selected===option)?'Selected: ':'')+option} onPress={()=>{onChange(option);if(!multiple)setOpen(false);}}/>)}{!options.some(option=>option.toLowerCase().includes(query.toLowerCase()))&&<Label muted>No matching options. Try another search.</Label>}{multiple&&<Button title="Done" onPress={()=>setOpen(false)}/>}</>;
    return <><Button secondary title={Array.isArray(selected) ? selected.length + ' selected - choose options' : selected || 'Choose an option'} onPress={()=>setOpen(!open)} />{insideSheet ? open&&<View style={{gap:10}}>{content}</View> : <BottomSheet title="Choose an option" visible={open} onClose={()=>setOpen(false)}>{content}</BottomSheet>}</>;
  }
  return <View style={styles.wrap}>{options.map((option,i) => { const active = Array.isArray(selected) ? selected.includes(option) : selected === option;
    return <Pressable key={`${option}-${i}`} accessibilityLabel={option} accessibilityRole={multiple ? 'checkbox' : 'radio'} accessibilityState={multiple ? { checked: active } : { selected: active }} onPress={() => onChange(option)} style={({pressed}) => [styles.chip, { borderColor: active ? c.accent : c.border, backgroundColor: active ? c.soft : c.surface, opacity: pressed ? 0.7 : 1 }]}>{active && <Ionicons name="checkmark" size={15} color={c.accent} />}<Text style={{ color: active ? c.accent : c.muted, fontSize: 14, fontWeight: active ? '700' : '500', flexShrink: 1 }}>{option}</Text></Pressable>;
  })}</View>;
}
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) { return <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><Label accessibilityRole="header" style={{ flex: 1, fontSize: 18, fontWeight: '700' }}>{title}</Label>{action}</View>; }
export function Section({ title, children }: PropsWithChildren<{ title: string }>) { return <View style={{ gap: 12 }}><SectionHeader title={title} />{children}</View>; }
export function Row({ children }: PropsWithChildren) { return <View style={styles.row}>{children}</View>; }
export function ResponsiveGrid({ children, columns = 2 }: PropsWithChildren<{ columns?: number }>) {
  const {width} = useWindowDimensions(); const count = width >= 700 ? columns : 2;
  return <View style={styles.wrap}>{Array.isArray(children) ? children.flat().filter(Boolean).map((child,i) => <View key={i} style={{ flexBasis: count === 3 ? '31%' : '47%', flexGrow: 1, minWidth: 0 }}>{child}</View>) : children}</View>;
}
export function StatCard({ label, value, detail, icon }: { label: string; value: string | number; detail?: string; icon?: Icon }) {
  const c = useTheme(); return <Card>{icon && <Ionicons name={icon} size={20} color={c.accent} />}<Label muted style={{ fontSize: 13 }}>{label}</Label><Label style={{ fontSize: 27, lineHeight: 34, fontWeight: '700' }}>{value}</Label>{detail && <Label muted style={{ fontSize: 12, lineHeight: 18 }}>{detail}</Label>}</Card>;
}
export function useReducedMotion() {
  const [reduced,setReduced] = useState(true);
  useEffect(() => { let alive = true; void AccessibilityInfo.isReduceMotionEnabled().then(v => { if (alive) setReduced(v); }); const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced); return () => { alive = false; subscription.remove(); }; },[]);
  return reduced;
}
function ProgressBar({ value, target }: { value: number; target: number }) {
  const c = useTheme(); const reduced = useReducedMotion(); const ratio = target > 0 ? Math.min(1,Math.max(0,value/target)) : 0; const progress = useRef(new Animated.Value(ratio)).current;
  useEffect(() => { const animation = Animated.timing(progress,{ toValue: ratio, duration: reduced ? 0 : 240, useNativeDriver: false }); animation.start(); return () => animation.stop(); },[ratio,reduced,progress]);
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0,max: target,now: Math.min(value,target),text: `${Math.round(value)} of ${target}` }} style={{ height: 7,borderRadius: 4,backgroundColor: c.border,overflow: 'hidden' }}><Animated.View style={{ width: progress.interpolate({inputRange:[0,1],outputRange:['0%','100%']}),height: 7,backgroundColor: c.accent,borderRadius: 4 }} /></View>;
}
export function Meter({ value,target,label,unit }: { value: number;target: number;label: string;unit: string }) {
  return <Card><Label style={{ fontSize: 14,fontWeight: '600' }}>{label}</Label><Label style={{ fontSize: 25,fontWeight: '700',lineHeight: 32 }}>{Math.round(value).toLocaleString()} <Label muted>{unit}</Label></Label><ProgressBar value={value} target={target} /><Label muted style={{fontSize:12,lineHeight:18}}>{Math.max(0,Math.round(target-value)).toLocaleString()} {unit} remaining · goal {target.toLocaleString()}</Label></Card>;
}
export const ProgressCard = Meter;
export function Ring({value,target,unit}: {value:number;target:number;unit:string}) {
  const c = useTheme(); const ratio = target>0?Math.min(1,Math.max(0,value/target)):0;
  return <View accessible accessibilityLabel={`${Math.round(value)} of ${target} ${unit}`} style={{width:144,height:144,alignItems:'center',justifyContent:'center',alignSelf:'center',margin:8}}>{Array.from({length:60},(_,i)=><View key={i} importantForAccessibility="no-hide-descendants" style={{position:'absolute',height:144,width:4,transform:[{rotate:`${i*6}deg`}]}}><View style={{height:10,width:4,borderRadius:2,backgroundColor:i<Math.floor(ratio*60)?c.accent:c.border}}/></View>)}<Label style={{fontSize:30,lineHeight:38,fontWeight:'700'}}>{Math.round(value)}</Label><Label muted style={{fontSize:12}}>{unit} / {target}</Label></View>;
}
export function ProfileAvatar({ name, uri, size = 48, onPress }: { name: string; uri?: string | null; size?: number; onPress?: () => void }) {
  const c = useTheme(); const [failed,setFailed] = useState(false); useEffect(() => setFailed(false),[uri]);
  const content = uri && !failed ? <Image accessibilityLabel={`${name}'s profile photo`} source={{uri}} style={{width:size,height:size,borderRadius:size/2}} onError={() => setFailed(true)} /> : <Label style={{color:c.accent,fontSize:size*0.32,lineHeight:size*0.45,fontWeight:'700'}}>{name.split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase()}</Label>;
  const style = {width:size,height:size,borderRadius:size/2,backgroundColor:c.soft,alignItems:'center' as const,justifyContent:'center' as const,borderWidth:2,borderColor:c.border};
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel="Open your profile" onPress={onPress} style={({pressed})=>[style,{opacity:pressed?0.7:1}]}>{content}</Pressable> : <View style={style}>{content}</View>;
}
export function SettingsRow({ title, detail, icon, onPress }: { title: string; detail?: string; icon: Icon; onPress?: () => void }) {
  const c = useTheme(); const content = <><View style={{width:38,height:38,borderRadius:12,backgroundColor:c.soft,alignItems:'center',justifyContent:'center'}}><Ionicons name={icon} size={20} color={c.accent}/></View><View style={{flex:1,minWidth:0}}><Label style={{fontWeight:'600'}}>{title}</Label>{detail && <Label muted style={{fontSize:13,lineHeight:19}}>{detail}</Label>}</View>{onPress && <Ionicons name="chevron-forward" size={18} color={c.muted}/>}</>;
  const style:ViewStyle = {flexDirection:'row',alignItems:'center',gap:13,paddingVertical:13,minHeight:64,borderBottomWidth:1,borderBottomColor:c.border};
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={`${title}${detail?`, ${detail}`:''}`} onPress={onPress} style={({pressed})=>[style,{opacity:pressed?0.65:1}]}>{content}</Pressable> : <View style={style}>{content}</View>;
}
export function Empty({title,detail}: {title:string;detail:string}) { const c = useTheme(); return <Card style={{alignItems:'center',paddingVertical:26}}><Ionicons name="leaf-outline" color={c.accent} size={28}/><Label style={{fontWeight:'600',textAlign:'center'}}>{title}</Label><Label muted style={{textAlign:'center',maxWidth:360}}>{detail}</Label></Card>; }
export function ErrorText({message}: {message:string}) { const c = useTheme(); return message ? <View accessibilityRole="alert" style={{padding:12,borderLeftWidth:3,borderColor:c.danger}}><Label style={{color:c.danger}}>{message}</Label></View> : null; }
export function SuccessText({message}: {message:string}) { const c = useTheme(); return message ? <Label accessibilityLiveRegion="polite" style={{color:c.accent}}>✓ {message}</Label> : null; }
export function LoadingState({label='Loading…'}: {label?:string}) { const c=useTheme();return <View style={{padding:24,gap:12,alignItems:'center'}}><ActivityIndicator color={c.accent}/><Label muted>{label}</Label></View>; }
export function ExpandableSection({title,children,initiallyOpen=false}: PropsWithChildren<{title:string;initiallyOpen?:boolean}>) {
  const [open,setOpen] = useState(initiallyOpen); const c = useTheme();
  return <View style={{gap:12}}><Pressable accessibilityRole="button" accessibilityState={{expanded:open}} accessibilityLabel={`${title}, ${open?'collapse':'expand'}`} onPress={()=>setOpen(!open)} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,paddingVertical:12,minHeight:48,borderBottomWidth:1,borderBottomColor:c.border}}><Label style={{fontSize:17,fontWeight:'600',flex:1}}>{title}</Label><Ionicons name={open?'chevron-up':'chevron-down'} color={c.muted} size={20}/></Pressable>{open&&children}</View>;
}
export function BottomSheet({title,visible,onClose,children}: PropsWithChildren<{title:string;visible:boolean;onClose:()=>void}>) {
  const c=useTheme();const {width}=useWindowDimensions();const reduced=useReducedMotion();const insets=useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType={reduced?'none':width>=700?'fade':'slide'} onRequestClose={onClose} statusBarTranslucent><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1,justifyContent:width>=700?'center':'flex-end',alignItems:'center',backgroundColor:'rgba(0,0,0,0.55)'}}><Pressable accessibilityLabel="Close dialog" accessibilityRole="button" onPress={onClose} style={StyleSheet.absoluteFill}/><View accessibilityViewIsModal style={{width:'100%',maxWidth:600,maxHeight:'90%',backgroundColor:c.surface,borderTopLeftRadius:24,borderTopRightRadius:24,...(width>=700?{borderBottomLeftRadius:24,borderBottomRightRadius:24}:{}),paddingBottom:Math.max(16,insets.bottom)}}><View style={{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:20,paddingTop:12,borderBottomWidth:1,borderBottomColor:c.border}}><Label accessibilityRole="header" style={{flex:1,fontSize:20,fontWeight:'700'}}>{title}</Label><IconButton icon="close" label={`Close ${title}`} onPress={onClose}/></View><ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{padding:20,gap:18}}><SheetContext.Provider value={true}>{children}</SheetContext.Provider></ScrollView></View></KeyboardAvoidingView></Modal>;
}
type Confirmation = {title:string;action:()=>void;detail?:string};
let requestConfirmation: ((value:Confirmation)=>void) | null = null;
export function ConfirmationModal({request,onClose}: {request:Confirmation|null;onClose:()=>void}) {
  return <BottomSheet title={request?.title??'Confirm action'} visible={!!request} onClose={onClose}><Label>{request?.detail??'This action changes the saved data on this device. It cannot be undone.'}</Label><Button secondary title="Cancel" onPress={onClose}/><Button danger title="Confirm" onPress={()=>{const action=request?.action;onClose();action?.();}}/></BottomSheet>;
}
export function OverlayProvider({children}:PropsWithChildren) { const [request,setRequest]=useState<Confirmation|null>(null);useEffect(()=>{requestConfirmation=setRequest;return()=>{requestConfirmation=null;};},[]);return <>{children}<ConfirmationModal request={request} onClose={()=>setRequest(null)}/></>; }
export function confirmDelete(title:string,action:()=>void,detail?:string) { if(requestConfirmation)requestConfirmation({title,action,detail});else if(Platform.OS==='web'){if(window.confirm(title))action();}else Alert.alert(title,detail??'This changes saved data on this device.',[{text:'Cancel',style:'cancel'},{text:'Confirm',style:'destructive',onPress:action}]); }
export const messageOf = (error:unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';
export const EmptyState=Empty;
export const FormInput=Field;
export const SelectionCard=Choices;
export const ProgressRing=Ring;
const styles=StyleSheet.create({
  headerBorder:{borderBottomWidth:1},header:{minHeight:68,width:'100%',maxWidth:1000,alignSelf:'center',paddingHorizontal:16,flexDirection:'row',gap:12,alignItems:'center'},
  page:{width:'100%',maxWidth:1000,alignSelf:'center',paddingTop:22,gap:22},
  card:{borderRadius:20,padding:18,borderWidth:1,gap:10,minWidth:0,maxWidth:'100%'},
  button:{minHeight:50,paddingHorizontal:18,paddingVertical:13,borderRadius:14,borderWidth:1,flexDirection:'row',justifyContent:'center',alignItems:'center',gap:8,maxWidth:'100%'},
  input:{minHeight:50,borderWidth:1,borderRadius:12,paddingHorizontal:14,paddingVertical:12,fontSize:16},
  row:{flexDirection:'row',flexWrap:'wrap',gap:10,alignItems:'center'},wrap:{flexDirection:'row',flexWrap:'wrap',gap:10},
  chip:{minHeight:44,maxWidth:'100%',borderWidth:1,borderRadius:12,paddingHorizontal:13,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:6},
});
