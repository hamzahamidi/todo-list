import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the DateCreatedPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'dateCreated',
})
export class DateCreatedPipe implements PipeTransform {
  /**
   * Takes a value and makes it lowercase.
   */
  transform(dateCreated: number, ...args) {
    if (!dateCreated) return '';
    const diff: number = Date.now() - dateCreated;
    return diff > 7 * 24 * 3600 * 1000 ? new Date(dateCreated).toDateString() : diff > 24 * 3600 * 1000 ?
      `${Math.round(diff / (24 * 3600 * 1000)).toString()} days ago` : diff > 3600 * 1000 ?
       `${Math.round(diff / (3600 * 1000)).toString()} hours ago` : diff > 60 * 1000 ?
          `${Math.round(diff / (60 * 1000)).toString()} minutes ago` : diff > 1000 ?
            `${Math.round(diff / (1000)).toString()} seconds ago ` : ' one second ago';
  }
}
