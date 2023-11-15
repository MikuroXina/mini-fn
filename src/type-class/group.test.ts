import { assertEquals, assertThrows } from "../../deps.ts";
import { none, some } from "../option.ts";
import { type GroupExceptZero, powiEZ, subtractEZ } from "./group.ts";
import { semiGroupSymbol } from "./semi-group.ts";

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

Deno.test("subtract", () => {
    assertEquals(
        subtractEZ(matrixGroup)([1, 2, 3, 4])([5, 6, 7, 8]),
        some([3, -2, 2, -1] as Matrix),
    );
});

Deno.test("powi", () => {
    assertEquals(
        powiEZ(matrixGroup)([1, 2, 3, 4])(11),
        some([25699957, 37455814, 56183721, 81883678] as Matrix),
    );
    assertEquals(
        powiEZ(matrixGroup)([1, 2, 3, 4])(4),
        some([199, 290, 435, 634] as Matrix),
    );
    assertEquals(
        powiEZ(matrixGroup)([1, 2, 3, 4])(0),
        some([1, 0, 0, 1] as Matrix),
    );
    assertEquals(
        powiEZ(matrixGroup)([1, 2, 3, 4])(-9),
        some(
            [
                -1418567 / 256,
                648891 / 256,
                1946673 / 512,
                -890461 / 512,
            ] as Matrix,
        ),
    );
    assertThrows(() => {
        powiEZ(matrixGroup)([1, 2, 3, 4])(0.5);
    }, "`exp` must be an integer");
});
