import {
  validateSync,
  ValidationError,
  ValidatorOptions,
} from 'class-validator';

/**
 * @describe                Calls validateSync with SQL injection / XSS vulnerability mitigated via forbidUnknownValues;
 *                          this causes validation to fail unless the object parameter is not anonymous and at least one of
 *                          its properties are decorated with class-validator decorators such as IsString. Properties that are not
 *                          in the target class are tolerated. For example
 *                          class A { x: string; y: string }
 *                          const a = new A();
 *                          a.x = 'x';
 *                          a.y = 'y';
 *                          class B {
 *                            @IsString()
 *                            x: string;
 *                            y: string
 *                          }
 *                          const b = new B();
 *                          b.x = 'x';
 *                          b.y = 'y';
 *                          validateSync({ x: 'x', y: 'y'}, { forbidUnknownValues: true});  // Errors since object class is anonymous
 *                          validateSync(a, { forbidUnknownValues: true});                  // Errors since object class has no annotated properties
 *                          validateSync(b, { forbidUnknownValues: true});                  // No errors since object class has an annotated property
 *                          b.z = 'z';
 *                          validateSync(b, { forbidUnknownValues: true});                  // No errors despite b having property z that is not in class B
 * @param object            to validate
 * @param validatorOptions  for validation with forbidUnknownValues forced to true
 * @returns                 validateSync results
 * @see                     {@link https://github.com/advisories/GHSA-fj58-h2fr-3pp2|GitHub}
 * @see                     {@link https://github.com/typestack/class-validator/issues/305} */
export const validateSyncForbidUnknownValues = (
  object: object,
  validatorOptions?: ValidatorOptions
): ValidationError[] =>
  validateSync(object, {
    ...validatorOptions,
    forbidUnknownValues: true,
  });