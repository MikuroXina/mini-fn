import { fromGetSet } from "../lens.js";

export const average = fromGetSet(
    (store: readonly number[]) => store.reduce((acc, val) => acc + val, 0) / store.length,
)((store: readonly number[]) => (newAverage: number) => {
    const avg = store.reduce((acc, val) => acc + val, 0) / store.length;
    return store.map((val) => val - avg + newAverage);
});
