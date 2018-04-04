import { Injectable } from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Platform } from 'ionic-angular';


@Injectable()
export class MediaProvider {

  stream: MediaStream;
  video: any;
  canvas: any;
  options: CameraOptions = {
    destinationType: this.camera.DestinationType.DATA_URL,
    sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
    encodingType: this.camera.EncodingType.JPEG,
    mediaType: this.camera.MediaType.PICTURE,
    targetHeight: 300
  }
  constructor(private plt: Platform, private camera: Camera) { }

  /**
   * get picture wih camera
   */
  getPictureMedia(): Promise<string | boolean> {
    if (!document.URL.startsWith('http')) {
      return this.nativeGetPictureMedia();
    }
    // on a desktop device.
    else return this.browserReadyGetPictureMedia();
  }

  private nativeGetPictureMedia(): Promise<string> {
    this.options.sourceType = this.camera.PictureSourceType.CAMERA;
    this.options.correctOrientation = true;
    return this.imgToString();
  }
  private imgToString(): Promise<string> {
    return this.camera.getPicture(this.options).then((imageData) => {
      return `data:image/jpeg;base64,${imageData}`;
    }, (err) => {
      return `${err}`;
    }).then(res => this.loadImageNative(res));
  }

  private browserReadyGetPictureMedia(): Promise<boolean> {
    document.getElementById('camera-browser').style.display = 'unset';
    document.getElementById('task-description').style.display = 'none';
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: 533, height: 300 }
    }).then(stream => {
      this.stream = stream;
      this.video = document.getElementById('video');
      this.canvas = document.getElementById('picture');
      this.video.srcObject = stream;
      this.video.play();
      return false;
    }).catch(err => {
      alert("there was an error " + err);
      return err;
    });
  }

  browserGetPicture(): Promise<string> {
    return new Promise(resolve => {
      this.canvas.getContext("2d").drawImage(this.video, 0, 0, 300, 300);
      const img: string = this.canvas.toDataURL('image/jpeg', 0.6);
      resolve(img);
    });
  }

  cancelTakePicture() {
    if (this.stream) this.stream.getTracks().forEach(track => track.stop());
    document.getElementById('camera-browser').style.display = 'none';
    document.getElementById('task-description').style.display = 'unset';
  }

  /**
   * get picture from library
   */
  getPictureLibrary(): Promise<string> {
    if (!document.URL.startsWith('http')) {
      return this.nativeGetPictureLibrary();
    }
    // on a desktop device.
    else return this.browserReadyGetPictureLibrary();
  }

  private nativeGetPictureLibrary(): Promise<string> {
    this.options.sourceType = this.camera.PictureSourceType.PHOTOLIBRARY;
    return this.imgToString();
  }
  private browserReadyGetPictureLibrary(): Promise<string> {
    const imgInput = document.getElementById('imgInput');
    return new Promise(resolve => {
      imgInput.onchange = evt => {
        const tgt = evt.target || window.event.srcElement;
        const files = (<any>tgt).files;
        let fr = new FileReader();
        let img = new Image;
        this.canvas = document.getElementById('picture');
        fr.onload = _ => {
          img.onload = _ => {
            this.canvas.getContext("2d").drawImage(img, 0, 0, 300, 300);
            resolve(this.canvas.toDataURL('image/jpeg', 0.6));
          };
          img.src = fr.result;
        }
        fr.readAsDataURL(files[0]);
      }
      imgInput.click();
    });
  }

  private loadImageNative(_img: string): Promise<string> {
    return new Promise(resolve => {
      const img = new Image;
      const canvas: any = document.getElementById('picture');
      img.onload = _ => {
        canvas.getContext("2d").drawImage(img, 0, 0, 300, 300);
      }
      img.src = _img;
      resolve(_img);
    });
  }
}
