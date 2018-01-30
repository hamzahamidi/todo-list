import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the ValuePipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'value',
})
export class ValuePipe implements PipeTransform {

  transform(object: any, args?: any[]): any[] {
    if (!object || object === null) return [];
    let values = (<any>Object).values(object);
    return values;
  }


}
