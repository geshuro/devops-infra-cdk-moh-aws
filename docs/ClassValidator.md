# class-validator

## Validation

Provides annotations to validate class data by length, type etc. For example

```ts
import { validate, Length } from 'class-validator';
export class Foo {
  @Length(10)
  bar: string;
}
const foo = new Foo();
foo.bar = 'bar';
validate(foo, {
  forbidUnknownValues: true,
  whitelist: true,
  forbidNonWhitelisted: true,
}).then(errors => console.log(errors));
```

An error is output for the `@Length` constraint violation. Note that validation sets to true `transform`, `whitelist`, `forbidNonWhitelisted` and `forbidUnknownValues` to avoid [security issues](https://github.com/typestack/class-validator/issues/1350) such as [SQL injection and XSS](https://github.com/advisories/GHSA-fj58-h2fr-3pp2).



## Transformation

Integration with `class-transformer` includes transformation functions such as

* `instanceToInstance`, converting an instance to a new object with properties transformed according to their annotation; for example `@Expose` changes the name of a property.
* `instanceToPlain`, performing the same transformation but yielding a literal object rather than class instance
* `plainToInstance`, the reverse of `instanceToPlain`, transforming a literal object to a new object according to their notation

Options include

* `excludeExtraneousValues`, removing values that do not belong to the target class
* `enableImplicitConversion`, using TypeScript information to implicitly convert data

For example, consider the following lambda, created using CDK

```ts
import { Function } from '@aws-cdk/aws-lambda';
const classValidatorLambda = new Function({ environment: { newBar: '0987654321' },
...
```

The lambda executes the following code 

```ts
import { instanceToPlain, Expose, instanceToInstance, excludeExtraneousValues } from 'class-transformer';
import { validate, Length } from 'class-validator';
export class Foo {
  @Expose({ name: 'newBar' })
  @Length(10)
  @IsString()
  bar: string;
  fooBar: string;
}
const foo = new Foo();
foo.bar = '1234567890';
console.log(foo);
console.log(instanceToInstance(foo));
console.log(instanceToPlain(foo));
console.log(plainToInstance(Foo, { bar: '1234567890', fooBar: 'a' }));
console.log(plainToInstance(Foo, { newBar: '1234567890', fooBar: 'a' }));
console.log(plainToInstance(Foo, { newBar: '1234567890', fooBar: 'a' }, { excludeExtraneousValues: true }));
console.log(plainToInstance(Foo, { newBar: 1234567890 }, { enableImplicitConversion: false }));
console.log(plainToInstance(Foo, { newBar: 1234567890 }, { enableImplicitConversion: true }));
console.log(plainToInstance(Foo, process.env);
```

The output is

```bash
Foo { bar: '1234567890' }               // The original Foo object
Foo { newBar: '1234567890' }            // @Expose annotation renames bar as newBar
{ newBar: '1234567890' }                // @Expose annotation renames bar as newBar, output as literal object
Foo { bar: undefined, fooBar: 'a' }     // @Expose annotation renames bar as newBar, so bar in the parameter object is ignored
Foo { bar: '1234567890', fooBar: 'a' }  // @Expose annotation renames bar as newBar, so newBar in the parameter object is used to set bar
Foo { bar: '1234567890' }               // excludeExtraneousValues is true, so fooBar is not 
Foo { bar: 1234567890 }                 // enableImplicitConversion is false (default), so fooBar is not converted to string
Foo { bar: '1234567890' }               // enableImplicitConversion is true, so fooBar is converted to string
Foo { bar: '0987654321' }               // classValidatorLambda is initialized with environment variable newBar
                                        // set to 0987654321, accessed via process.env when plainToInstance is called 
```
