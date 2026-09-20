import type { AlertInput } from '@ionic/angular';

export interface CustomAlert {
  title?: string;
  message?: string;
  inputs?: AlertInput[];
  noText?: string;
  yesText?: string;
  yesToastThen?: string;
  yesToastCatch?: string;
  yesFunction?: (data?: Record<string, string>) => Promise<unknown>;
}
