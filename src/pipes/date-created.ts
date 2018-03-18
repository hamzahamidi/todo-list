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
    if (diff > 7 * 24 * 3600 * 1000) return new Date(dateCreated).toDateString();
    else if (diff > 24 * 3600 * 1000) return Math.round(diff / (24 * 3600 * 1000)).toString() + " days ago";
    else if (diff > 3600 * 1000) return Math.round(diff / (3600 * 1000)).toString() + " hours ago";
    else if (diff > 60 * 1000) return Math.round(diff / (60 * 1000)).toString() + " minutes ago";
    else if (diff > 1000) return Math.round(diff / (1000)).toString() + " seconds ago";
  }
}
