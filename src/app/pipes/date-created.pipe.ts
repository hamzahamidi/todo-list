import { Pipe, PipeTransform } from '@angular/core';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

@Pipe({ name: 'dateCreated' })
export class DateCreatedPipe implements PipeTransform {
  transform(dateCreated: number | undefined): string {
    if (!dateCreated) {
      return '';
    }
    const diff = Date.now() - dateCreated;
    if (diff > WEEK) return new Date(dateCreated).toDateString();
    if (diff > DAY) return `${Math.round(diff / DAY)} days ago`;
    if (diff > HOUR) return `${Math.round(diff / HOUR)} hours ago`;
    if (diff > MINUTE) return `${Math.round(diff / MINUTE)} minutes ago`;
    if (diff > SECOND) return `${Math.round(diff / SECOND)} seconds ago`;
    return 'one second ago';
  }
}
