import { NgModule } from '@angular/core';
import { ValuePipe } from './value.pipe';
import { FinishedPipe } from './finished.pipe';
@NgModule({
	declarations: [ValuePipe,
    FinishedPipe],
	imports: [],
	exports: [ValuePipe,
    FinishedPipe]
})
export class PipesModule {}
