export type PhotoSource = 'library' | 'camera';
export type PickedPhoto = { uri: string; size?: number };
export function validatePhotoSize(size: number) { if(!Number.isFinite(size)||size<=0||size>8*1024*1024) throw new Error('Choose an image smaller than 8 MB.'); }
export function validatePersistentPhoto(uri: string) { if(!uri.startsWith('data:image/jpeg;base64,') && !uri.startsWith('file://')) throw new Error('The photo could not be saved permanently. Please choose it again.'); }
