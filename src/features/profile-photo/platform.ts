import { requireOptionalNativeModule } from 'expo';
import { Directory, File, Paths } from 'expo-file-system';
import { type PickedPhoto, type PhotoSource, validatePhotoSize } from './types';
type Picker = { requestCameraPermissionsAsync:()=>Promise<{granted:boolean}>; launchCameraAsync:(options:object)=>Promise<Result>; launchImageLibraryAsync:(options:object)=>Promise<Result> };
type Result = {canceled:boolean;assets?:{uri:string;fileSize?:number}[]};
// Expo Go bundles this module. Custom builds need expo-image-picker installed.
export async function pickPhoto(source: PhotoSource): Promise<PickedPhoto|null> {
  const picker=requireOptionalNativeModule<Picker>('ExponentImagePicker');if(!picker)throw new Error('Photo selection needs the Expo ImagePicker native module. Use Expo Go, or install expo-image-picker and rebuild this app.');
  if(source==='camera'&&!(await picker.requestCameraPermissionsAsync()).granted)throw new Error('Camera access was denied. You can choose an existing photo instead, or allow camera access in device settings.');
  const options={mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:0.8};
  const result=await (source==='camera'?picker.launchCameraAsync(options):picker.launchImageLibraryAsync(options));if(result.canceled)return null;const asset=result.assets?.[0];if(!asset)throw new Error('No image was returned. Please try again.');if(asset.fileSize!==undefined)validatePhotoSize(asset.fileSize);return {uri:asset.uri,size:asset.fileSize};
}
export async function persistPhoto(photo: PickedPhoto) {const directory=new Directory(Paths.document,'profile-photos');directory.create({idempotent:true,intermediates:true});const destination=new File(directory,`avatar-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);try{await new File(photo.uri).copy(destination);validatePhotoSize(destination.size);return destination.uri;}catch(error){if(destination.exists)destination.delete();throw error;}}
export async function discardPhoto(uri: string) {const directory=new Directory(Paths.document,'profile-photos');if(!uri.startsWith(directory.uri.endsWith('/')?directory.uri:directory.uri+'/'))return;const file=new File(uri);if(file.exists)await file.delete();}
