/** Original _global.times phase. It belongs to the simulation, not animations. */
export class RootClock{
 private current:number;
 constructor(phase=0){if(!Number.isInteger(phase)||phase<0||phase>30)throw new RangeError('Root clock phase must be an integer from 0 to 30.');this.current=phase;}
 get phase(){return this.current;}
 step(){if(this.current>=30){this.current=0;return true;}this.current++;return false;}
}
