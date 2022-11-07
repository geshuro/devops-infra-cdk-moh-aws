# TypeScript Decorators

* Functions that run before any other code
* May
  * Optionally return function, which is called after the decorator function runs
  * Attach to
    * Class
    * Constructor
    * Method
    * Parameter
    * Property
    * Getter
* Example

```ts
const f = (a): any => {
  console.log(a);
  return (x, y, z) => console.log(`${z} ${y} ${x}`);
};

@f(2)
class C {
  @f(1)
  p: number;
  constructor(@f(3) p: number) {
    this.p = p;
  }
}
console.log('A');
const c = new C(1);
console.log('B');
```

Output:

```bash
1
2
3
undefined p Object...
0 undefined Class C...
undefined undefined Class C...
A
B
```

Note that decorators

* run
  * before code executes
  * twice
    * first to fetch the returned function
    * then to execute it
* pass different parameters to function they call depending on whether they are attached to class, parameter, ...
