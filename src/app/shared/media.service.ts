import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Injectable({ providedIn: 'root' })
export class MediaService {
  takePicture(): Promise<string | null> {
    return this.capture(CameraSource.Camera);
  }

  pickFromLibrary(): Promise<string | null> {
    return this.capture(CameraSource.Photos);
  }

  private async capture(source: CameraSource): Promise<string | null> {
    try {
      const photo = await Camera.getPhoto({
        source,
        resultType: CameraResultType.DataUrl,
        quality: 60,
        width: 300,
        height: 300,
        correctOrientation: true,
      });
      return photo.dataUrl ?? null;
    } catch {
      // The user dismissed the picker.
      return null;
    }
  }
}
