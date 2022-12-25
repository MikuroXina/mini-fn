# mini-fn

The minimal functional programming library.

[![codecov](https://codecov.io/github/MikuroXina/mini-fn/branch/main/graph/badge.svg?token=3HZ2Y5T1A2)](https://codecov.io/github/MikuroXina/mini-fn)

---

mini-fn provides simple, tiny library having functional features and its type declarations.

## Examples

You can pipe your functions with `Cat<T>`'s `feed<U>(f: (t: T) => U): Cat<U>` method like this:

```ts
import { cat } from "mini-fn/cat.js";

const result = cat(-3)
    .feed((x) => x ** 2)
    .feed((x) => x.toString());
console.log(result.value); // "9"
```

And there are some useful types such as `Option<T>`, `Result<E, T>`, and so on.

```ts
import * as Option from "mini-fn/option.js";
const sqrtThenToString = (num: number): Option.Option<string> => {
    if (num < 0) {
        return Option.none();
    }
    return Option.some(Math.sqrt(num).toString());
};

const applied = Option.andThen(sqrtThenToString);
applied(Option.some(4)); // some("2")
applied(Option.some(-1)); // none
applied(Option.none()); // none
```

Some of them also provides its monad implementation, so you can combine and transform them like this:

```ts
import { cat, log } from "mini-fn/cat.js";
import * as Option from "mini-fn/option.js";

const half = (x: number): Option.Option<number> => {
    if (x % 2 != 0) {
        return Option.none();
    }
    return Option.some(x / 2);
};
const liftedHalf = Option.monad.flatMap(half);

cat(20)
    .feed(Option.monad.pure)
    .feed(liftedHalf)
    .feed(log) // some(10)
    .feed(liftedHalf)
    .feed(log) // some(5)
    .feed(liftedHalf)
    .feed(log); // none
```
