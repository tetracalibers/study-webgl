export class Matrix4 {
    // prettier-ignore
    #mat = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ];
    // prettier-ignore
    constructor(m11 = 1, m12 = 0, m13 = 0, m14 = 0, m21 = 0, m22 = 1, m23 = 0, m24 = 0, m31 = 0, m32 = 0, m33 = 1, m34 = 0, m41 = 0, m42 = 0, m43 = 0, m44 = 1) {
        this.#mat = [
            m11, m12, m13, m14,
            m21, m22, m23, m24,
            m31, m32, m33, m34,
            m41, m42, m43, m44,
        ];
        return this;
    }
    // prettier-ignore
    identity() {
        this.#mat = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
        return this;
    }
    multiply2(mat1, mat2) {
        let result = [];
        const m11 = mat1[0];
        const m12 = mat1[1];
        const m13 = mat1[2];
        const m14 = mat1[3];
        const m21 = mat1[4];
        const m22 = mat1[5];
        const m23 = mat1[6];
        const m24 = mat1[7];
        const m31 = mat1[8];
        const m32 = mat1[9];
        const m33 = mat1[10];
        const m34 = mat1[11];
        const m41 = mat1[12];
        const m42 = mat1[13];
        const m43 = mat1[14];
        const m44 = mat1[15];
        const M11 = mat2[0];
        const M12 = mat2[1];
        const M13 = mat2[2];
        const M14 = mat2[3];
        const M21 = mat2[4];
        const M22 = mat2[5];
        const M23 = mat2[6];
        const M24 = mat2[7];
        const M31 = mat2[8];
        const M32 = mat2[9];
        const M33 = mat2[10];
        const M34 = mat2[11];
        const M41 = mat2[12];
        const M42 = mat2[13];
        const M43 = mat2[14];
        const M44 = mat2[15];
        // Cik = Σ Aij * Bjk
        // C11 = Σ A1j * Bj1
        result[0] = M11 * m11 + M12 * m21 + M13 * m31 + M14 * m41;
        // C12 = Σ A1j * Bj2
        result[1] = M11 * m12 + M12 * m22 + M13 * m32 + M14 * m42;
        // C13 = Σ A1j * Bj3
        result[2] = M11 * m13 + M12 * m23 + M13 * m33 + M14 * m43;
        // C14 = Σ A1j * Bj4
        result[3] = M11 * m14 + M12 * m24 + M13 * m34 + M14 * m44;
        // C21 = Σ A2j * Bj1
        result[4] = M21 * m11 + M22 * m21 + M23 * m31 + M24 * m41;
        // C22 = Σ A2j * Bj2
        result[5] = M21 * m12 + M22 * m22 + M23 * m32 + M24 * m42;
        // C23 = Σ A2j * Bj3
        result[6] = M21 * m13 + M22 * m23 + M23 * m33 + M24 * m43;
        // C24 = Σ A2j * Bj4
        result[7] = M21 * m14 + M22 * m24 + M23 * m34 + M24 * m44;
        // C31 = Σ A3j * Bj1
        result[8] = M31 * m11 + M32 * m21 + M33 * m31 + M34 * m41;
        // C32 = Σ A3j * Bj2
        result[9] = M31 * m12 + M32 * m22 + M33 * m32 + M34 * m42;
        // C33 = Σ A3j * Bj3
        result[10] = M31 * m13 + M32 * m23 + M33 * m33 + M34 * m43;
        // C34 = Σ A3j * Bj4
        result[11] = M31 * m14 + M32 * m24 + M33 * m34 + M34 * m44;
        // C41 = Σ A4j * Bj1
        result[12] = M41 * m11 + M42 * m21 + M43 * m31 + M44 * m41;
        // C42 = Σ A4j * Bj2
        result[13] = M41 * m12 + M42 * m22 + M43 * m32 + M44 * m42;
        // C43 = Σ A4j * Bj3
        result[14] = M41 * m13 + M42 * m23 + M43 * m33 + M44 * m43;
        // C44 = Σ A4j * Bj4
        result[15] = M41 * m14 + M42 * m24 + M43 * m34 + M44 * m44;
        this.#mat = result;
        return this;
    }
    multiply(mat2) {
        return this.multiply2(this.#mat, mat2);
    }
    get m11() {
        return this.#mat[0];
    }
    get m12() {
        return this.#mat[1];
    }
    get m13() {
        return this.#mat[2];
    }
    get m14() {
        return this.#mat[3];
    }
    get m21() {
        return this.#mat[4];
    }
    get m22() {
        return this.#mat[5];
    }
    get m23() {
        return this.#mat[6];
    }
    get m24() {
        return this.#mat[7];
    }
    get m31() {
        return this.#mat[8];
    }
    get m32() {
        return this.#mat[9];
    }
    get m33() {
        return this.#mat[10];
    }
    get m34() {
        return this.#mat[11];
    }
    get m41() {
        return this.#mat[12];
    }
    get m42() {
        return this.#mat[13];
    }
    get m43() {
        return this.#mat[14];
    }
    get m44() {
        return this.#mat[15];
    }
    get result() {
        return this.#mat;
    }
}
