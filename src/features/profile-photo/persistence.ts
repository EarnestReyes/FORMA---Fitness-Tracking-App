import { type PickedPhoto, validatePersistentPhoto } from './types';
export const photoKey='forma.profile-photo.v1';
export type PhotoStorage={getItem:(key:string)=>Promise<string|null>;setItem:(key:string,value:string)=>Promise<void>;removeItem:(key:string)=>Promise<void>};
export type PhotoFiles={persist:(photo:PickedPhoto)=>Promise<string>;discard:(uri:string)=>Promise<void>};
export async function readPhoto(storage:PhotoStorage){const uri=await storage.getItem(photoKey);if(uri)validatePersistentPhoto(uri);return uri;}
export async function replacePhoto(photo:PickedPhoto,previous:string|null,storage:PhotoStorage,files:PhotoFiles){
  const uri=await files.persist(photo);
  try{validatePersistentPhoto(uri);await storage.setItem(photoKey,uri);}catch(error){await files.discard(uri).catch(()=>{});throw error;}
  // Metadata commits before cleanup so a failed cleanup cannot invalidate the photo.
  if(previous&&previous!==uri)await files.discard(previous).catch(()=>{});
  return uri;
}
export async function clearPhoto(previous:string|null,storage:PhotoStorage,files:PhotoFiles){await storage.removeItem(photoKey);if(previous)await files.discard(previous).catch(()=>{});}
