# mini-fn

The minimal functional programming library.

---

mini-fn provides simple, tiny library having functional features and its type declarations.

## Examples

You can pipe your functions with {@link Cat.Cat | `Cat<T>`}'s {@link Cat.Cat.feed | `feed<U>(f: (t: T) => U): Cat<U>`} method like this:

```ts
import { Cat } from "mini-fn";

const result = Cat.cat(-3)
    .feed((x) => x ** 2)
    .feed((x) => x.toString());
console.log(result.value); // "9"
```

And there are some useful types such as {@link Option | `Option<T>`}, {@link Result | `Result<E, T>`}, and so on.

```ts
import { Option } from "mini-fn";
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
import { Cat, Option } from "mini-fn";

const half = (x: number): Option.Option<number> => {
    if (x % 2 != 0) {
        return Option.none();
    }
    return Option.some(x / 2);
};
const liftedHalf = Option.monad.flatMap(half);

Cat.cat(20)
    .feed(Option.monad.pure)
    .feed(liftedHalf)
    .feed(Cat.log) // some(10)
    .feed(liftedHalf)
    .feed(Cat.log) // some(5)
    .feed(liftedHalf)
    .feed(Cat.log); // none
```
