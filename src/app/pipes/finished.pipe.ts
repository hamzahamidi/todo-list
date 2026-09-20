import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'finished' })
export class FinishedPipe implements PipeTransform {
  transform(value: boolean | undefined): string {
    return value ? 'Finished' : 'Doing';
  }
}
