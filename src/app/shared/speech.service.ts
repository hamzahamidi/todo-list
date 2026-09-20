import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

@Injectable({ providedIn: 'root' })
export class SpeechService {
  async isReady(): Promise<boolean> {
    if (!Capacitor.isPluginAvailable('SpeechRecognition')) {
      return false;
    }
    const { available } = await SpeechRecognition.available();
    return available ? this.ensurePermission() : false;
  }

  /** Resolves with the best match, or an empty string if nothing was heard. */
  async listen(): Promise<string> {
    const { matches } = await SpeechRecognition.start({
      language: 'fr-FR',
      maxResults: 1,
      partialResults: false,
      popup: false,
    });
    return matches?.[0] ?? '';
  }

  stop(): Promise<void> {
    return SpeechRecognition.stop();
  }

  private async ensurePermission(): Promise<boolean> {
    const status = await SpeechRecognition.checkPermissions();
    if (status.speechRecognition === 'granted') {
      return true;
    }
    const requested = await SpeechRecognition.requestPermissions();
    return requested.speechRecognition === 'granted';
  }
}
