import { expect, test } from "vitest";

import { none, some } from "../option.js";
import { type GroupExceptZero, powiEZ, subtractEZ } from "./group.js";
import { semiGroupSymbol } from "./semi-group.js";

type Matrix = [a: number, b: number, c: number, d: number];

const matrixGroup: GroupExceptZero<Matrix> = {
    identity: [1, 0, 0, 1],
    combine([l11, l12, l21, l22], [r11, r12, r21, r22]) {
        return [
            l11 * r11 + l12 * r21,
            l11 * r12 + l12 * r22,
            l21 * r11 + l22 * r21,
            l21 * r12 + l22 * r22,
        ];
    },
    invert([m11, m12, m21, m22]) {
        const det = m11 * m22 - m12 * m21;
        if (det == 0) {
            return none();
        }
        return some([m22 / det, -m12 / det, -m21 / det, m11 / det]);
    },
    [semiGroupSymbol]: true,
};

test("subtract", () => {
    expect(subtractEZ(matrixGroup)([1, 2, 3, 4])([5, 6, 7, 8])).toEqual(some([3, -2, 2, -1]));
});

test("powi", () => {
    expect(powiEZ(matrixGroup)([1, 2, 3, 4])(17)).toEqual(
        some([617852597821, 900475124662, 1350712686993, 1968565284814]),
    );
});
