export declare class Matrix4 {
    #private;
    constructor(m11?: number, m12?: number, m13?: number, m14?: number, m21?: number, m22?: number, m23?: number, m24?: number, m31?: number, m32?: number, m33?: number, m34?: number, m41?: number, m42?: number, m43?: number, m44?: number);
    identity(): this;
    multiply2(mat1: number[], mat2: number[]): this;
    multiply(mat2: number[]): this;
    get m11(): number;
    get m12(): number;
    get m13(): number;
    get m14(): number;
    get m21(): number;
    get m22(): number;
    get m23(): number;
    get m24(): number;
    get m31(): number;
    get m32(): number;
    get m33(): number;
    get m34(): number;
    get m41(): number;
    get m42(): number;
    get m43(): number;
    get m44(): number;
    get result(): number[];
}
