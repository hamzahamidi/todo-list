import { NgModule } from '@angular/core';
import { ValuePipe, FinishedPipe, DateCreatedPipe } from './';

@NgModule({
    declarations: [ValuePipe,
        FinishedPipe,
        DateCreatedPipe],
    imports: [],
    exports: [ValuePipe,
        FinishedPipe,
        DateCreatedPipe]
})
export class PipesModule { }
