/**
 * Copyright (c) 2021 Koto Furumiya
 * Released under the MIT license
 * https://github.com/kotofurumiya/matrixgl/blob/master/LICENSE.md
 */

// @see https://github.com/kotofurumiya/matrixgl/blob/master/src/matrix.ts

import { Quaternion } from './quaternion'
import { Float32Vector3 } from './vector'

/**
 * An interface for matrices;
 *
 * @interface Matrix
 */
interface Matrix {
  /**
   * Values of the matrix, that is stored in column major order.
   *
   * @type {Float32Array}
   * @memberof Matrix
   */
  readonly values: Float32Array

  /**
   * Returns `values` as string.
   *
   * @return {string}
   * @memberof Matrix
   */
  toString(): string
}

/**
 * 4x4 Matrix of single-precision float numbers.
 * Values are stored in column major order.
 *
 * @export
 * @class Matrix4x4
 * @implements {Matrix}
 */
export class Matrix4x4 implements Matrix {
  #values: Float32Array

  // prettier-ignore
  constructor(
    m11 = 1.0, m12 = 0.0, m13 = 0.0, m14 = 0.0,
    m21 = 0.0, m22 = 1.0, m23 = 0.0, m24 = 0.0,
    m31 = 0.0, m32 = 0.0, m33 = 1.0, m34 = 0.0,
    m41 = 0.0, m42 = 0.0, m43 = 0.0, m44 = 1.0,
  ) {
    this.#values = new Float32Array([
      m11, m12, m13, m14,
      m21, m22, m23, m24,
      m31, m32, m33, m34,
      m41, m42, m43, m44,
    ])
    return this
  }

  /**
   * Returns an identity matrix.
   *
   * @static
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  static identity(): Matrix4x4 {
    return new Matrix4x4()
  }

  /**
   * Returns translation matrix.
   *
   * @static
   * @param {number} tx
   * @param {number} ty
   * @param {number} tz
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  // prettier-ignore
  static translation(tx: number, ty: number, tz: number): Matrix4x4 {
    return new Matrix4x4(
      1.0, 0.0, 0.0, 0.0,
      0.0, 1.0, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      tx, ty, tz, 1.0
    )
  }

  /**
   * Returns scaling matrix.
   *
   * @static
   * @param {number} sx
   * @param {number} sy
   * @param {number} sz
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  // prettier-ignore
  static scaling(sx: number, sy: number, sz: number): Matrix4x4 {
    return new Matrix4x4(
      sx, 0.0, 0.0, 0.0,
      0.0, sy, 0.0, 0.0,
      0.0, 0.0, sz, 0.0,
      0.0, 0.0, 0.0, 1.0
    )
  }

  /**
   * Returns rotation matrix around x-axis.
   *
   * @static
   * @param {number} radian
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  // prettier-ignore
  static rotationX(radian: number): Matrix4x4 {
    const sin = Math.sin(radian)
    const cos = Math.cos(radian)
    
    return new Matrix4x4(
      1.0, 0.0, 0.0, 0.0,
      0.0, cos, sin, 0.0,
      0.0, -sin, cos, 0.0,
      0.0, 0.0, 0.0, 1.0
    )
  }

  /**
   * Returns rotation matrix around y-axis.
   *
   * @static
   * @param {number} radian
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  // prettier-ignore
  static rotationY(radian: number): Matrix4x4 {
    const sin: number = Math.sin(radian)
    const cos: number = Math.cos(radian)

    return new Matrix4x4(
      cos, 0.0, -sin, 0.0,
      0.0, 1.0, 0.0, 0.0,
      sin, 0.0, cos, 0.0,
      0.0, 0.0, 0.0, 1.0
    )
  }

  /**
   * Returns rotation matrix around z-axis.
   *
   * @static
   * @param {number} radian
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  // prettier-ignore
  static rotationZ(radian: number): Matrix4x4 {
    const sin: number = Math.sin(radian)
    const cos: number = Math.cos(radian)

    return new Matrix4x4(
      cos, sin, 0.0, 0.0,
      -sin, cos, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 0.0, 1.0
    )
  }

  /**
   * Returns rotation matrix around `normalizedAxis`. `normalizedAxis` must be normalized.
   *
   * @static
   * @param {Float32Vector3} normalizedAxis
   * @param {number} radian
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  static rotationAround(
    normalizedAxis: Float32Vector3,
    radian: number
  ): Matrix4x4 {
    const q = Quaternion.rotationAround(normalizedAxis, radian)
    return q.toRotationMatrix4()
  }

  /**
   * Returns "look at" matrix.
   *
   * @static
   * @param {Float32Vector3} cameraPosition
   * @param {Float32Vector3} lookAtPosition
   * @param {Float32Vector3} cameraUp
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  // prettier-ignore
  static lookAt(
    cameraPosition: Float32Vector3,
    lookAtPosition: Float32Vector3,
    cameraUp: Float32Vector3
  ): Matrix4x4 {
    const zAxis: Float32Vector3 = cameraPosition.sub(lookAtPosition).normalize()
    const xAxis: Float32Vector3 = cameraUp.cross(zAxis).normalize()
    const yAxis: Float32Vector3 = zAxis.cross(xAxis).normalize()

    return new Matrix4x4(
      xAxis.x, yAxis.x, zAxis.x, 0.0,
      xAxis.y, yAxis.y, zAxis.y, 0.0,
      xAxis.z, yAxis.z, zAxis.z, 0.0,
      -cameraPosition.dot(xAxis), -cameraPosition.dot(yAxis), -cameraPosition.dot(zAxis), 1.0
    )
  }

  /**
   * Returns an orthographic projection matrix.
   *
   * @static
   * @param {{top: number; bottom: number; left: number; right: number; near: number; far: number}} argsObject
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  // prettier-ignore
  static orthographic(argsObject: {
    top: number
    bottom: number
    left: number
    right: number
    near: number
    far: number
  }): Matrix4x4 {
    const top: number = argsObject.top
    const bottom: number = argsObject.bottom
    const left: number = argsObject.left
    const right: number = argsObject.right
    const near: number = argsObject.near
    const far: number = argsObject.far

    return new Matrix4x4(
      2 / (right - left), 0.0, 0.0, 0.0,
      0.0, 2 / (top - bottom), 0.0, 0.0,
      0.0, 0.0, -2 / (far - near), 0.0,
      -(right + left) / (right - left), -(top + bottom) / (top - bottom), -(far + near) / (far - near), 1.0
    )
  }

  /**
   * Returns a frustrum projection matrix.
   *
   * @static
   * @param {{ top: number; bottom: number; left: number; right: number; near: number; far: number }} argsObject
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  // prettier-ignore
  static frustum(argsObject: {
    top: number
    bottom: number
    left: number
    right: number
    near: number
    far: number
  }): Matrix4x4 {
    const top: number = argsObject.top
    const bottom: number = argsObject.bottom
    const left: number = argsObject.left
    const right: number = argsObject.right
    const near: number = argsObject.near
    const far: number = argsObject.far

    return new Matrix4x4(
      (2 * near) / (right - left), 0.0, 0.0, 0.0,
      0.0, (2 * near) / (top - bottom), 0.0, 0.0,
      (right + left) / (right - left), (top + bottom) / (top - bottom), -(far + near) / (far - near), -1.0,
      0.0, 0.0, (-2 * far * near) / (far - near), 0.0
    )
  }

  /**
   * Returns a perspective projection matrix.
   *
   * @static
   * @param {{ fovYRadian: number; aspectRatio: number; near: number; far: number }} argsObject
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  static perspective(argsObject: {
    fovYRadian: number
    aspectRatio: number
    near: number
    far: number
  }): Matrix4x4 {
    const top = argsObject.near * Math.tan(argsObject.fovYRadian * 0.5)
    const height = top * 2
    const width = argsObject.aspectRatio * height
    const left = -0.5 * width
    const right = left + width
    const bottom = top - height

    return Matrix4x4.frustum({
      top,
      bottom,
      left,
      right,
      near: argsObject.near,
      far: argsObject.far,
    })
  }

  /**
   * Multiply by `other` matrix and returns a product.
   * This method does not mutate the matrix.
   *
   * @param {Matrix4x4} other
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  mulByMatrix4x4(other: Matrix4x4): Matrix4x4 {
    const m11 = this.#values[0]
    const m12 = this.#values[1]
    const m13 = this.#values[2]
    const m14 = this.#values[3]
    const m21 = this.#values[4]
    const m22 = this.#values[5]
    const m23 = this.#values[6]
    const m24 = this.#values[7]
    const m31 = this.#values[8]
    const m32 = this.#values[9]
    const m33 = this.#values[10]
    const m34 = this.#values[11]
    const m41 = this.#values[12]
    const m42 = this.#values[13]
    const m43 = this.#values[14]
    const m44 = this.#values[15]

    const M11 = other.values[0]
    const M12 = other.values[1]
    const M13 = other.values[2]
    const M14 = other.values[3]
    const M21 = other.values[4]
    const M22 = other.values[5]
    const M23 = other.values[6]
    const M24 = other.values[7]
    const M31 = other.values[8]
    const M32 = other.values[9]
    const M33 = other.values[10]
    const M34 = other.values[11]
    const M41 = other.values[12]
    const M42 = other.values[13]
    const M43 = other.values[14]
    const M44 = other.values[15]

    // Cik = Σ Aij * Bjk
    let result: number[] = []

    // C11 = Σ A1j * Bj1
    result[0] = M11 * m11 + M12 * m21 + M13 * m31 + M14 * m41
    // C12 = Σ A1j * Bj2
    result[1] = M11 * m12 + M12 * m22 + M13 * m32 + M14 * m42
    // C13 = Σ A1j * Bj3
    result[2] = M11 * m13 + M12 * m23 + M13 * m33 + M14 * m43
    // C14 = Σ A1j * Bj4
    result[3] = M11 * m14 + M12 * m24 + M13 * m34 + M14 * m44

    // C21 = Σ A2j * Bj1
    result[4] = M21 * m11 + M22 * m21 + M23 * m31 + M24 * m41
    // C22 = Σ A2j * Bj2
    result[5] = M21 * m12 + M22 * m22 + M23 * m32 + M24 * m42
    // C23 = Σ A2j * Bj3
    result[6] = M21 * m13 + M22 * m23 + M23 * m33 + M24 * m43
    // C24 = Σ A2j * Bj4
    result[7] = M21 * m14 + M22 * m24 + M23 * m34 + M24 * m44

    // C31 = Σ A3j * Bj1
    result[8] = M31 * m11 + M32 * m21 + M33 * m31 + M34 * m41
    // C32 = Σ A3j * Bj2
    result[9] = M31 * m12 + M32 * m22 + M33 * m32 + M34 * m42
    // C33 = Σ A3j * Bj3
    result[10] = M31 * m13 + M32 * m23 + M33 * m33 + M34 * m43
    // C34 = Σ A3j * Bj4
    result[11] = M31 * m14 + M32 * m24 + M33 * m34 + M34 * m44

    // C41 = Σ A4j * Bj1
    result[12] = M41 * m11 + M42 * m21 + M43 * m31 + M44 * m41
    // C42 = Σ A4j * Bj2
    result[13] = M41 * m12 + M42 * m22 + M43 * m32 + M44 * m42
    // C43 = Σ A4j * Bj3
    result[14] = M41 * m13 + M42 * m23 + M43 * m33 + M44 * m43
    // C44 = Σ A4j * Bj4
    result[15] = M41 * m14 + M42 * m24 + M43 * m34 + M44 * m44

    return new Matrix4x4(...result)
  }

  /**
   * Translate the matrix and returns new `Matrix4x4`.
   * This method does not mutate the matrix.
   *
   * @param {number} tx
   * @param {number} ty
   * @param {number} tz
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  translate(tx: number, ty: number, tz: number): Matrix4x4 {
    const t = Matrix4x4.translation(tx, ty, tz)
    return this.mulByMatrix4x4(t)
  }

  /**
   * Scale the matrix and returns new `Matrix4x4`.
   *
   * @param {number} sx
   * @param {number} sy
   * @param {number} sz
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  scale(sx: number, sy: number, sz: number): Matrix4x4 {
    const s = Matrix4x4.scaling(sx, sy, sz)
    return this.mulByMatrix4x4(s)
  }

  /**
   * Rotate the matrix around x-axis and returns new `Matrix4x4`.
   * This method does not mutate the matrix.
   *
   * @param {number} radian
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  rotateX(radian: number): Matrix4x4 {
    const rx = Matrix4x4.rotationX(radian)
    return this.mulByMatrix4x4(rx)
  }

  /**
   * Rotate the matrix around y-axis and returns new `Matrix4x4`.
   * This method does not mutate the matrix.
   *
   * @param {number} radian
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  rotateY(radian: number): Matrix4x4 {
    const ry = Matrix4x4.rotationY(radian)
    return this.mulByMatrix4x4(ry)
  }

  /**
   * Rotate the matrix around z-axis and returns new `Matrix4x4`.
   * This method does not mutate the matrix.
   *
   * @param {number} radian
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  rotateZ(radian: number): Matrix4x4 {
    const rz = Matrix4x4.rotationZ(radian)
    return this.mulByMatrix4x4(rz)
  }

  /**
   * Rotate the matrix around the `normalizedAxis` and return new Matrix4x4.
   * This method does not mutate the matrix.
   *
   * @param {Float32Vector3} normalizedAxis
   * @param {number} radian
   * @return {Matrix4x4}
   * @memberof Matrix4x4
   */
  rotateAround(normalizedAxis: Float32Vector3, radian: number): Matrix4x4 {
    const r = Matrix4x4.rotationAround(normalizedAxis, radian)
    return this.mulByMatrix4x4(r)
  }

  get values(): Float32Array {
    return this.#values
  }

  toString(): string {
    return this.#values.toString()
  }
}

export class Matrix4 {
  // prettier-ignore
  #mat = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]

  // prettier-ignore
  constructor(
    m11 = 1, m12 = 0, m13 = 0, m14 = 0,
    m21 = 0, m22 = 1, m23 = 0, m24 = 0,
    m31 = 0, m32 = 0, m33 = 1, m34 = 0,
    m41 = 0, m42 = 0, m43 = 0, m44 = 1,
  ) {
    this.#mat = [
      m11, m12, m13, m14,
      m21, m22, m23, m24,
      m31, m32, m33, m34,
      m41, m42, m43, m44,
    ]
    return this
  }

  // prettier-ignore
  identity() {
    this.#mat = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]
    return this
  }

  multiply2(mat1: number[], mat2: number[]) {
    let result: number[] = []

    const m11 = mat1[0]
    const m12 = mat1[1]
    const m13 = mat1[2]
    const m14 = mat1[3]
    const m21 = mat1[4]
    const m22 = mat1[5]
    const m23 = mat1[6]
    const m24 = mat1[7]
    const m31 = mat1[8]
    const m32 = mat1[9]
    const m33 = mat1[10]
    const m34 = mat1[11]
    const m41 = mat1[12]
    const m42 = mat1[13]
    const m43 = mat1[14]
    const m44 = mat1[15]

    const M11 = mat2[0]
    const M12 = mat2[1]
    const M13 = mat2[2]
    const M14 = mat2[3]
    const M21 = mat2[4]
    const M22 = mat2[5]
    const M23 = mat2[6]
    const M24 = mat2[7]
    const M31 = mat2[8]
    const M32 = mat2[9]
    const M33 = mat2[10]
    const M34 = mat2[11]
    const M41 = mat2[12]
    const M42 = mat2[13]
    const M43 = mat2[14]
    const M44 = mat2[15]

    // Cik = Σ Aij * Bjk

    // C11 = Σ A1j * Bj1
    result[0] = M11 * m11 + M12 * m21 + M13 * m31 + M14 * m41
    // C12 = Σ A1j * Bj2
    result[1] = M11 * m12 + M12 * m22 + M13 * m32 + M14 * m42
    // C13 = Σ A1j * Bj3
    result[2] = M11 * m13 + M12 * m23 + M13 * m33 + M14 * m43
    // C14 = Σ A1j * Bj4
    result[3] = M11 * m14 + M12 * m24 + M13 * m34 + M14 * m44

    // C21 = Σ A2j * Bj1
    result[4] = M21 * m11 + M22 * m21 + M23 * m31 + M24 * m41
    // C22 = Σ A2j * Bj2
    result[5] = M21 * m12 + M22 * m22 + M23 * m32 + M24 * m42
    // C23 = Σ A2j * Bj3
    result[6] = M21 * m13 + M22 * m23 + M23 * m33 + M24 * m43
    // C24 = Σ A2j * Bj4
    result[7] = M21 * m14 + M22 * m24 + M23 * m34 + M24 * m44

    // C31 = Σ A3j * Bj1
    result[8] = M31 * m11 + M32 * m21 + M33 * m31 + M34 * m41
    // C32 = Σ A3j * Bj2
    result[9] = M31 * m12 + M32 * m22 + M33 * m32 + M34 * m42
    // C33 = Σ A3j * Bj3
    result[10] = M31 * m13 + M32 * m23 + M33 * m33 + M34 * m43
    // C34 = Σ A3j * Bj4
    result[11] = M31 * m14 + M32 * m24 + M33 * m34 + M34 * m44

    // C41 = Σ A4j * Bj1
    result[12] = M41 * m11 + M42 * m21 + M43 * m31 + M44 * m41
    // C42 = Σ A4j * Bj2
    result[13] = M41 * m12 + M42 * m22 + M43 * m32 + M44 * m42
    // C43 = Σ A4j * Bj3
    result[14] = M41 * m13 + M42 * m23 + M43 * m33 + M44 * m43
    // C44 = Σ A4j * Bj4
    result[15] = M41 * m14 + M42 * m24 + M43 * m34 + M44 * m44

    this.#mat = result
    return this
  }

  multiply(mat2: number[]) {
    return this.multiply2(this.#mat, mat2)
  }

  scale(x: number = 1, y: number = 1, z: number = 1) {
    let result = this.#mat

    result[0] *= x
    result[1] *= x
    result[2] *= x

    result[3] *= y
    result[4] *= y
    result[5] *= y

    result[6] *= z
    result[7] *= z
    result[8] *= z

    this.#mat = result
    return this
  }

  translate(x: number = 0, y: number = 0, z: number = 0) {
    const mat = this.#mat
    let result = this.#mat

    result[12] += mat[0] * x + mat[4] * y + mat[8] * z
    result[13] += mat[1] * x + mat[5] * y + mat[9] * z
    result[14] += mat[2] * x + mat[6] * y + mat[10] * z
    result[15] += mat[3] * x + mat[7] * y + mat[11] * z

    this.#mat = result
    return this
  }

  get m11() {
    return this.#mat[0]
  }

  get m12() {
    return this.#mat[1]
  }

  get m13() {
    return this.#mat[2]
  }

  get m14() {
    return this.#mat[3]
  }

  get m21() {
    return this.#mat[4]
  }

  get m22() {
    return this.#mat[5]
  }

  get m23() {
    return this.#mat[6]
  }

  get m24() {
    return this.#mat[7]
  }

  get m31() {
    return this.#mat[8]
  }

  get m32() {
    return this.#mat[9]
  }

  get m33() {
    return this.#mat[10]
  }

  get m34() {
    return this.#mat[11]
  }

  get m41() {
    return this.#mat[12]
  }

  get m42() {
    return this.#mat[13]
  }

  get m43() {
    return this.#mat[14]
  }

  get m44() {
    return this.#mat[15]
  }

  get result() {
    return this.#mat
  }
}
