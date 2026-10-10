import { type PickedPhoto, type PhotoSource, validatePhotoSize } from './types';
export function pickPhoto(source: PhotoSource): Promise<PickedPhoto|null> {
  return new Promise((resolve,reject)=>{
    const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';if(source==='camera')input.setAttribute('capture','user');
    input.style.display='none';document.body.appendChild(input);
    const cleanup=()=>input.remove();
    input.addEventListener('cancel',()=>{cleanup();resolve(null);},{once:true});
    input.onchange=()=>{const file=input.files?.[0];cleanup();if(!file){resolve(null);return;}
      try {validatePhotoSize(file.size);if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a JPEG, PNG or WebP image.');}catch(error){reject(error);return;}
      const reader=new FileReader();reader.onerror=()=>reject(new Error('Unable to read this image. Try another file.'));
      reader.onload=()=>{const image=new Image();image.onerror=()=>reject(new Error('This image could not be opened.'));image.onload=()=>{
        try{const canvas=document.createElement('canvas');const side=512;canvas.width=side;canvas.height=side;const context=canvas.getContext('2d');if(!context)throw new Error('Image preview is unavailable in this browser.');const crop=Math.min(image.width,image.height);context.drawImage(image,(image.width-crop)/2,(image.height-crop)/2,crop,crop,0,0,side,side);resolve({uri:canvas.toDataURL('image/jpeg',0.85),size:file.size});}catch(error){reject(error);}
      };image.src=String(reader.result);};reader.readAsDataURL(file);
    };input.click();
  });
}
export async function persistPhoto(photo: PickedPhoto) {if(!photo.uri.startsWith('data:image/jpeg;base64,'))throw new Error('Please select the image again.');return photo.uri;}
export async function discardPhoto(_uri: string) {}
