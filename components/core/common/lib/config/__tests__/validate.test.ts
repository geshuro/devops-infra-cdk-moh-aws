import { fc, itProp } from 'jest-fast-check';
 import * as classValidator from 'class-validator';
 import { ValidatorOptions } from 'class-validator';
 import { validateSyncForbidUnknownValues } from '../validate'
 
 describe('validateSyncForbidUnknownValues', () => {
   const spy = jest.spyOn(classValidator, 'validateSync');
   itProp(
     'calls validateSync with forbidUnknownValues true for any parameters',
     [
       fc.object(),
       fc.record({
         forbidUnknownValues: fc.option(fc.boolean()),
       }),
     ],
     (object, validatorOptions) => {
       validateSyncForbidUnknownValues(
         object,
         validatorOptions as ValidatorOptions
       );
       expect(spy).toBeCalledWith(object, {
         ...validatorOptions,
         forbidUnknownValues: true,
       });
     }
   );
 });