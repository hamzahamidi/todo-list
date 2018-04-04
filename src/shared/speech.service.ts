import { Injectable } from '@angular/core';
import { SpeechRecognition } from '@ionic-native/speech-recognition';


@Injectable()
export class SpeechProvider {

    constructor(private speechRecognition: SpeechRecognition) { }

    // Check feature available
    checkAvailable(): Promise<boolean> {
        if (!document.URL.startsWith('http')) {
            return this.speechRecognition.isRecognitionAvailable()
                .then((available: boolean) => this.checkPermission())
        }
        else return new Promise(resolve => resolve(false));
    }

    // Check permission
    private checkPermission(): Promise<boolean> {
        return this.speechRecognition.hasPermission()
            .then((hasPermission: boolean) => {
                if (hasPermission) return true;
                else return this.requestPermissions()
            })
    }

    // Request permissions
    private requestPermissions(): Promise<boolean> {
        return this.speechRecognition.requestPermission()
            .then(
                () => true,
                () => false
            )
    }

    // Start the recognition process
    startListening() {
        const options = {
            language: 'fr-FR',
            matches: 1
          };
        return this.speechRecognition.startListening(options);
    }

    // Stop the recognition process (iOS only)
    stopListening(): Promise<void> {
        return this.speechRecognition.stopListening();
    }



}
