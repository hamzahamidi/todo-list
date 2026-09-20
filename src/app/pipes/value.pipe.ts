import { Pipe, PipeTransform } from '@angular/core';

/** Firebase returns keyed objects where the templates want an array. */
@Pipe({ name: 'value' })
export class ValuePipe implements PipeTransform {
  transform<T>(object: Record<string, T> | undefined | null): T[] {
    return object ? Object.values(object) : [];
  }
}
