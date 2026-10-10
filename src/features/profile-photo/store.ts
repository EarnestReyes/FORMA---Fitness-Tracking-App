import { useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistPhoto, discardPhoto } from './platform';
import { type PickedPhoto } from './types';
import { readPhoto, replacePhoto, clearPhoto } from './persistence';
let state={uri:null as string|null,ready:false,error:''};const listeners=new Set<()=>void>();let loading:Promise<void>|undefined;
function emit(patch:Partial<typeof state>){state={...state,...patch};listeners.forEach(fn=>fn());}
function load(){return loading??=(async()=>{try{const uri=await readPhoto(AsyncStorage);emit({uri,ready:true,error:''});}catch{emit({ready:true,error:'Your saved photo could not be loaded. You can choose another image.'});}})();}
export function useProfilePhoto(){useEffect(()=>{void load();},[]);return useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},()=>state,()=>state);}
const files={persist:persistPhoto,discard:discardPhoto};
export async function saveProfilePhoto(photo:PickedPhoto){const uri=await replacePhoto(photo,state.uri,AsyncStorage,files);emit({uri,error:''});}
export async function removeProfilePhoto(){await clearPhoto(state.uri,AsyncStorage,files);emit({uri:null,error:''});}
