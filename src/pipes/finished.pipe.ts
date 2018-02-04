import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the FinishedPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'finished',
})
export class FinishedPipe implements PipeTransform {
  transform(value) {
    return value ? 'Finished' : 'Doing';
  }
}
