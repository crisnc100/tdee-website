// Minimal dense-matrix helpers for the 3x3 filter. Matrices are row-major
// arrays of rows; nothing here mutates its inputs.

export type Vec = readonly number[];
export type Mat = readonly (readonly number[])[];

export function matMul(a: Mat, b: Mat): number[][] {
  return a.map((row) => b[0].map((_, j) => row.reduce((sum, aik, k) => sum + aik * b[k][j], 0)));
}

export function matVec(a: Mat, v: Vec): number[] {
  return a.map((row) => row.reduce((sum, aij, j) => sum + aij * v[j], 0));
}

export function transpose(a: Mat): number[][] {
  return a[0].map((_, j) => a.map((row) => row[j]));
}

export function matAdd(a: Mat, b: Mat): number[][] {
  return a.map((row, i) => row.map((aij, j) => aij + b[i][j]));
}

export function identity(n: number): number[][] {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
}

export function diag(values: Vec): number[][] {
  return values.map((v, i) => values.map((_, j) => (i === j ? v : 0)));
}

/** Average with the transpose, removing rounding asymmetry from a covariance. */
export function symmetrize(a: Mat): number[][] {
  return a.map((row, i) => row.map((aij, j) => (aij + a[j][i]) / 2));
}

/** F P F^T + Q */
export function propagate(f: Mat, p: Mat, q: Mat): number[][] {
  return symmetrize(matAdd(matMul(matMul(f, p), transpose(f)), q));
}

export function allFinite(values: Vec | Mat): boolean {
  return values.every((x) => (typeof x === 'number' ? Number.isFinite(x) : allFinite(x)));
}
