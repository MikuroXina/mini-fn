/**
 * This module provides data definition of matrix and its arithmetics.
 *
 * A `Matrix` has owned numbers as a `Float64Array`, so the elements is arranged sequential. But the major axis is row-axis and `strides` express that each fetching steps of axises.
 *
 * @packageDocumentation
 * @module
 */

import { dec as decArray, enc as encArray } from "./array.js";
import { doT } from "./cat.js";
import {
    type Decoder,
    decF64Be,
    decU32Be,
    type Encoder,
    encF64Be,
    encU32Be,
    monadForCodeM,
    monadForDecoder,
} from "./serial.js";
import { type AbelianGroup, abelSymbol } from "./type-class/abelian-group.js";
import type { Monoid } from "./type-class/monoid.js";
import {
    fromPartialEquality,
    type PartialEq,
} from "./type-class/partial-eq.js";
import type { Ring } from "./type-class/ring.js";
import { semiGroupSymbol } from "./type-class/semi-group.js";

/**
 * Strides of dimensions. The first element is steps needed to seek columns, and the second element is steps needed to seek rows.
 */
export type Strides = readonly [columnStep: number, rowStep: number];

/**
 * A numbers matrix that represents coefficients.
 */
export type Matrix = Readonly<{
    /**
     * Array of stored numbers.
     */
    nums: Float64Array;
    /**
     * Strides of dimensions. Either of them must equals to one.
     */
    strides: Strides;
}>;

/**
 * Determines whether two matrices are equal.
 * @param lhs - The left hand item.
 * @param rhs - The right hand item.
 * @returns Whether two items are equal.
 */
export const partialEquality = (lhs: Matrix, rhs: Matrix): boolean => {
    const rowLen = rowLength(lhs);
    const colLen = columnLength(lhs);
    if (rowLen !== rowLength(rhs) || colLen !== columnLength(rhs)) {
        return false;
    }
    for (let rowIdx = 0; rowIdx < colLen; ++rowIdx) {
        const atRow = at(rowIdx);
        for (let colIdx = 0; colIdx < rowLen; ++colIdx) {
            const atRowCol = atRow(colIdx);
            if (atRowCol(lhs) !== atRowCol(rhs)) {
                return false;
            }
        }
    }
    return true;
};
/**
 * A `PartialEq` instance for `Matrix`.
 */
export const partialEq: PartialEq<Matrix> = fromPartialEquality(
    () => partialEquality,
)();

/**
 * Creates an identity matrix with its size.
 *
 * @param rows - The count of rows.
 * @param columns - The count of columns.
 * @returns The identity matrix in `rows` rows and `columns` columns.
 */
export const identity =
    (rows: number) =>
    (columns: number): Matrix => ({
        nums: new Float64Array(rows * columns).map((_, i) =>
            i % (columns + 1) === 0 ? 1 : 0,
        ),
        strides: [columns, 1],
    });

/**
 * Creates a zeroes matrix with its size.
 *
 * @param rows - The count of rows.
 * @param columns - The count of columns.
 * @returns The zeroes matrix in `rows` rows and `columns` columns.
 */
export const zeroes =
    (rows: number) =>
    (columns: number): Matrix => ({
        nums: new Float64Array(rows * columns),
        strides: [columns, 1],
    });
/**
 * Creates a zeros matrix with its size.
 *
 * @param rows - The count of rows.
 * @param columns - The count of columns.
 * @returns The zeros matrix in `rows` rows and `columns` columns.
 */
export const zeros = zeroes;

/**
 * Constructs a matrix with the specified elements. Lacking elements are treated as zeroes.
 *
 * @param rowNums - The array of row numbers.
 * @returns The matrix with specified elements.
 */
export const fromRows = (rowNums: readonly number[][]): Matrix => {
    const columns = Math.max(...rowNums.map((row) => row.length));
    return {
        nums: new Float64Array(
            rowNums.flatMap((row) => {
                const newRow = new Array<number>(columns);
                newRow.fill(0);
                newRow.splice(0, row.length, ...row);
                return newRow;
            }),
        ),
        strides: [columns, 1],
    };
};

/**
 * Constructs a matrix with the specified elements. Lacking elements are treated as zeroes.
 *
 * @param columnNums - The array of column numbers.
 * @returns The matrix with specified elements.
 */
export const fromColumns = (columnNums: readonly number[][]): Matrix => {
    const rows = Math.max(...columnNums.map((col) => col.length));

    return {
        nums: new Float64Array(
            columnNums.flatMap((col) => {
                const newCol = new Array<number>(rows);
                newCol.fill(0);
                newCol.splice(0, col.length, ...col);
                return newCol;
            }),
        ),
        strides: [1, rows],
    };
};

/**
 * Gets the element at (`rowIndex`, `columnIndex`) in the matrix. The indexes start from zero.
 *
 * @param rowIndex - The 0-based index of row to pick.
 * @param columnIndex - The 0-based index of column to pick.
 * @returns The fetched element of the matrix.
 */
export const at =
    (rowIndex: number) =>
    (columnIndex: number) =>
    (mat: Matrix): number => {
        if (rowIndex < 0 || rowIndex >= columnLength(mat)) {
            throw new RangeError("`rowIndex` is out of range");
        }
        if (columnIndex < 0 || columnIndex >= rowLength(mat)) {
            throw new RangeError("`columnIndex` is out of range");
        }
        return atUnchecked(rowIndex)(columnIndex)(mat);
    };

/**
 * Gets the element at (`columnIndex`, `rowIndex`) in the matrix with no check. The indexes start from zero.
 *
 * If the indexes is out of range, your code may occur unsound behaviors.
 *
 * @param rowIndex - The 0-based index of row to pick.
 * @param columnIndex - The 0-based index of column to pick.
 * @returns The fetched element of the matrix.
 */
export const atUnchecked =
    (rowIndex: number) =>
    (columnIndex: number) =>
    (mat: Matrix): number =>
        mat.nums.at(rowIndex * mat.strides[0] + columnIndex * mat.strides[1])!;

/**
 * Extracts the internal numbers from the matrix. The layout of numbers may not intuitive order because of its strides.
 *
 * @param mat - The matrix.
 * @returns The internal numbers data.
 */
export const rawNums = (mat: Matrix): Float64Array => mat.nums;

/**
 * Extracts the internal strides from the matrix.
 * @param mat - The matrix.
 * @returns The internal strides.
 */
export const strides = (
    mat: Matrix,
): readonly [columnStep: number, rowStep: number] => mat.strides;

/**
 * Gets the length of row-axis, or count of the columns.
 *
 * @param mat - The matrix.
 * @returns The length of rows.
 */
export const rowLength = (mat: Matrix): number =>
    mat.strides[1] === 1
        ? mat.strides[0]
        : Math.ceil(mat.nums.length / mat.strides[1]);

/**
 * Gets the length of column-axis, or count of the rows.
 *
 * @param mat - The matrix.
 * @returns The length of columns.
 */
export const columnLength = (mat: Matrix): number =>
    mat.strides[0] === 1
        ? mat.strides[1]
        : Math.ceil(mat.nums.length / mat.strides[0]);

/**
 * Checks whether the numbers of matrix are arranged by row-major order.
 *
 * @param mat - The matrix.
 * @returns Whether the numbers are arranged by row-major order.
 */
export const isMajorAxisRow = (mat: Matrix): boolean => mat.strides[1] === 1;

/**
 * Finds the trace value, sum of the diagonal elements of the matrix.
 *
 * @param mat - The matrix to find its trace.
 * @returns The trace of matrix.
 */
export const trace = (mat: Matrix): number => {
    const shorterLen = Math.min(rowLength(mat), columnLength(mat));
    let res = 0;
    for (let i = 0; i < shorterLen; ++i) {
        res += at(i)(i)(mat);
    }
    return res;
};

/**
 * Transposes the matrix. Exchanges axises of the matrix.
 *
 * @param mat - The matrix to transpose.
 * @returns The transposed matrix.
 */
export const transpose = (mat: Matrix): Matrix => ({
    ...mat,
    strides: [mat.strides[1], mat.strides[0]],
});

/**
 * Multiplies the coefficient `alpha` to all stored numbers.
 *
 * @param alpha - The coefficient to multiply.
 * @returns The scaled matrix.
 */
export const scalarProduct =
    (alpha: number) =>
    (mat: Matrix): Matrix => ({
        ...mat,
        nums: mat.nums.map((num) => alpha * num),
    });

/**
 * Swaps the major axises of stored numbers. It is useful to transform matrices for efficient arithmetic implementation. You can check which the major axis is by function `isMajorAxisRow`.
 *
 * @param mat - The matrix to interchange axises.
 * @returns The transformed matrix.
 */
export const interchangeMajorAxis = (mat: Matrix): Matrix => {
    if (isMajorAxisRow(mat)) {
        // interchange major axis from row-axis into column-axis
        const columns = columnLength(mat);
        const rows = rowLength(mat);
        const transformed = new Float64Array(mat.nums.length);
        for (let colIdx = 0; colIdx < columns; ++colIdx) {
            for (let rowIdx = 0; rowIdx < rows; ++rowIdx) {
                transformed.set(
                    [mat.nums.at(rowIdx + colIdx * rows)!],
                    colIdx + rowIdx * columns,
                );
            }
        }
        return {
            nums: transformed,
            strides: [1, mat.nums.length / rows],
        };
    }

    // interchange major axis from column-axis into row-axis
    const columns = columnLength(mat);
    const rows = rowLength(mat);
    const transformed = new Float64Array(mat.nums.length);
    for (let rowIdx = 0; rowIdx < rows; ++rowIdx) {
        for (let colIdx = 0; colIdx < columns; ++colIdx) {
            transformed.set(
                [mat.nums.at(colIdx + rowIdx * columns)!],
                rowIdx + colIdx * rows,
            );
        }
    }
    return {
        nums: transformed,
        strides: [mat.nums.length / columns, 1],
    };
};

/**
 * Adds two matrices by element wise. Throws if the shapes of them are unequal.
 *
 * @param left - The left hand term.
 * @param right - The right hand term.
 * @returns The sum matrix of two.
 */
export const add =
    (left: Matrix) =>
    (right: Matrix): Matrix => {
        if (
            left.nums.length !== right.nums.length ||
            rowLength(left) !== rowLength(right)
        ) {
            throw new TypeError("unmatched matrix size");
        }

        if (!isMajorAxisRow(left)) {
            left = interchangeMajorAxis(left);
        }
        if (!isMajorAxisRow(right)) {
            right = interchangeMajorAxis(right);
        }
        return {
            strides: left.strides,
            nums: left.nums.map((l, i) => l + right.nums.at(i)!),
        };
    };

/**
 * Multiplies two matrices in the linear algebra way. Throws if column length of the left term does not equal to row length of the right term.
 *
 * @param left - The left hand term.
 * @param right - The right hand term.
 * @returns The product matrix of two.
 */
export const mul =
    (left: Matrix) =>
    (right: Matrix): Matrix => {
        const vecLen = columnLength(left);
        if (vecLen !== rowLength(right)) {
            throw new TypeError(
                "column length of left does not equal to row length of right",
            );
        }

        const resRowLen = rowLength(left);
        const resColLen = columnLength(right);
        const nums = new Float64Array(resRowLen * resColLen);
        for (let colIdx = 0; colIdx < resColLen; ++colIdx) {
            for (let rowIdx = 0; rowIdx < resRowLen; ++rowIdx) {
                let sum = 0.0;
                for (let idx = 0; idx < vecLen; ++idx) {
                    sum += at(colIdx)(idx)(left) * at(idx)(rowIdx)(right);
                }
                nums.set([sum], rowIdx + resRowLen * colIdx);
            }
        }
        return {
            nums,
            strides: [resRowLen, 1],
        };
    };

/**
 * Multiplies two matrices by element wise. Throws if the shapes of them are unequal.
 *
 * @param left - The left hand term.
 * @param right - The right hand term.
 * @returns The product matrix of two.
 */
export const mulElementWise =
    (left: Matrix) =>
    (right: Matrix): Matrix => {
        if (
            left.nums.length !== right.nums.length ||
            rowLength(left) !== rowLength(right)
        ) {
            throw new TypeError("unmatched matrix size");
        }

        if (!isMajorAxisRow(left)) {
            left = interchangeMajorAxis(left);
        }
        if (!isMajorAxisRow(right)) {
            right = interchangeMajorAxis(right);
        }
        return {
            strides: left.strides,
            nums: left.nums.map((l, i) => l * right.nums.at(i)!),
        };
    };

/**
 * Creates the monoid instance about matrix addition.
 *
 * @param rows - The count of rows.
 * @param columns - The count of columns.
 * @returns The `Monoid` instance of addition.
 */
export const addMonoid =
    (rows: number) =>
    (columns: number): Monoid<Matrix> => ({
        identity: zeroes(rows)(columns),
        combine: (l, r) => add(l)(r),
        [semiGroupSymbol]: true,
    });

/**
 * Creates the abelian group instance about matrix addition.
 *
 * @param rows - The count of rows.
 * @param columns - The count of columns.
 * @returns The `AbelianGroup` instance of addition.
 */
export const addGroup =
    (rows: number) =>
    (columns: number): AbelianGroup<Matrix> => ({
        identity: zeroes(rows)(columns),
        combine: (l, r) => add(l)(r),
        invert: scalarProduct(-1),
        [semiGroupSymbol]: true,
        [abelSymbol]: true,
    });

/**
 * Creates the monoid instance about matrix multiplication.
 *
 * @param rows - The count of rows.
 * @param columns - The count of columns.
 * @returns The `Monoid` instance of multiplication.
 */
export const mulMonoid =
    (rows: number) =>
    (columns: number): Monoid<Matrix> => ({
        identity: identity(rows)(columns),
        combine: (l, r) => mul(l)(r),
        [semiGroupSymbol]: true,
    });

/**
 * Creates the ring instance about matrix arithmetics.
 *
 * @param rows - The count of rows.
 * @param columns - The count of columns.
 * @returns The `Ring` instance of addition and multiplication.
 */
export const ring =
    (rows: number) =>
    (columns: number): Ring<Matrix> => ({
        additive: addGroup(rows)(columns),
        multiplication: mulMonoid(rows)(columns),
    });

/**
 * The `Encoder` implementation for `Matrix`.
 */
export const enc: Encoder<Matrix> = (mat: Matrix) =>
    doT(monadForCodeM)
        .run(encU32Be(mat.strides[0]))
        .run(encU32Be(mat.strides[1]))
        .run(encArray(encF64Be)([...mat.nums]))
        .finish(() => []);
/**
 * The `Decoder` implementation for `Matrix`.
 */
export const dec = (): Decoder<Matrix> =>
    doT(monadForDecoder)
        .addM("stride0", decU32Be())
        .addM("stride1", decU32Be())
        .addM("nums", decArray(decF64Be()))
        .finish(({ stride0, stride1, nums }) => ({
            nums: new Float64Array(nums),
            strides: [stride0, stride1],
        }));
