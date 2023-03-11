// @see https://wgld.org/d/webgl/w028.html

import { utils } from '../common/js/utils.js'
import { Matrix4x4 } from '../common/js/dist/matrix.js'
import { Float32Vector3 } from '../common/js/dist/vector.js'

/** @type {HTMLCanvasElement | null} */
let canvas = null
/** @type {WebGL2RenderingContext | null} */
let gl = null
/** @type {WebGLProgram | null} */
let program = null
/** @type {WebGLTexture | null} */
let texture0 = null
/** @type {WebGLTexture | null} */
let texture1 = null

/** @type {number[]} */
let index = []

/** @type {Matrix4x4} */
let pvMatrix

let count = 0

/**
 * 適切な頂点シェーダーとフラグメントシェーダーでプログラムを作成する関数
 */
const initProgram = async () => {
  const vertexShader = await utils.loadShader(gl, './index.vert')
  const fragmentShader = await utils.loadShader(gl, './index.frag')

  program = utils.getProgram(gl, vertexShader, fragmentShader)

  program.aVertexPosition = gl.getAttribLocation(program, 'a_position')
  program.aVertexColor = gl.getAttribLocation(program, 'a_color')
  program.aTextureCoord = gl.getAttribLocation(program, 'a_textureCoord')

  program.uMvpMatrix = gl.getUniformLocation(program, 'u_mvpMatrix')
  program.uTexture0 = gl.getUniformLocation(program, 'u_texture0')
  program.uTexture1 = gl.getUniformLocation(program, 'u_texture1')

  gl.useProgram(program)
}

/**
 * バッファを準備する関数
 */
const initBuffers = async () => {
  // 頂点位置
  // 原点を中心に、アルファベットの Z を描くような順序で頂点を定義
  // prettier-ignore
  const vertexPosition = [
    -1.0, 1.0, 0.0,
    1.0, 1.0, 0.0,
    -1.0, -1.0, 0.0,
    1.0, -1.0, 0.0,
  ]

  // 頂点色
  // 全て不透明な白
  // prettier-ignore
  const vertexColor = [
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
  ]

  // テクスチャ座標
  const textureCoord = [-0.75, -0.75, 1.75, -0.75, -0.75, 1.75, 1.75, 1.75]

  // 頂点インデックス
  // prettier-ignore
  index = [
    0, 1, 2,
    3, 2, 1
  ]

  // 頂点位置VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, vertexPosition),
    location: program.aVertexPosition,
    stride: 3 // vec3型
  })

  // 頂点色VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, vertexColor),
    location: program.aVertexColor,
    stride: 4 // vec4型
  })

  // テクスチャ座標VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, textureCoord),
    location: program.aTextureCoord,
    stride: 2 // vec2型（xy座標）
  })

  // IBO
  const ibo = utils.getIBO(gl, index)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)

  // ビュー座標変換行列
  const vMatrix = Matrix4x4.lookAt(
    new Float32Vector3(0.0, 0.0, 12.0), // 三次元空間を映し出すカメラを置く
    new Float32Vector3(0.0, 0.0, 0.0), // 原点を注視点として見つめる
    new Float32Vector3(0.0, 1.0, 0.0) // カメラの上方向は Y 軸の方向に指定
  )
  // プロジェクション座標変換行列
  const pMatrix = Matrix4x4.perspective({
    fovYRadian: 45, // 視野角を 45 度
    aspectRatio: canvas.width / canvas.height, // アスペクト比は canvas のサイズそのまま
    near: 0.1, // ニアクリップ
    far: 100 // ファークリップ
  })
  // 共通の変換行列を作っておく
  pvMatrix = pMatrix.mulByMatrix4x4(vMatrix)

  // テクスチャを生成
  texture0 = await utils.getTexture(gl, './img/sky-128x128.jpg')
  texture1 = await utils.getTexture(gl, './img/tetra-128x128.jpg')
}

/**
 * 指定した変換を表すモデル行列を生成して描画する関数
 *
 * @param {number[]} translate
 * @param {number} rotateRad
 */
const transformDraw = (translate, rotateRad) => {
  const mMatrix = Matrix4x4.identity()
    .translate(...translate)
    .rotateY(rotateRad)
  const mvpMatrix = pvMatrix.mulByMatrix4x4(mMatrix)
  gl.uniformMatrix4fv(program.uMvpMatrix, false, mvpMatrix.values)

  // インデックスを用いた描画命令
  gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)
}

/**
 * canvasに描画する関数
 */
const draw = () => {
  // canvasを初期化
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // カウンタをインクリメント
  count++

  // カウンタを元にラジアンを算出
  const rad = ((count % 360) * Math.PI) / 180

  // 1枚目のテクスチャ
  gl.bindTexture(gl.TEXTURE_2D, texture0)
  gl.uniform1i(program.uTexture0, 0)
  gl.activeTexture(gl.TEXTURE0)

  // 2枚目のテクスチャ
  gl.bindTexture(gl.TEXTURE_2D, texture1)
  gl.uniform1i(program.uTexture1, 1)
  gl.activeTexture(gl.TEXTURE1)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  transformDraw([-6.25, 2.0, 0.0], rad)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  transformDraw([-3.75, 2.0, 0.0], rad)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  transformDraw([-1.25, 2.0, 0.0], rad)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  transformDraw([1.25, 2.0, 0.0], rad)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  transformDraw([3.75, 2.0, 0.0], rad)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  transformDraw([6.25, 2.0, 0.0], rad)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  transformDraw([-2.5, -2.0, 0.0], rad)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT)
  transformDraw([0.0, -2.0, 0.0], rad)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  transformDraw([2.5, -2.0, 0.0], rad)

  // コンテキストの再描画
  // 画面上にレンダリングされたモデルを描画するためには、コンテキストをリフレッシュする必要がある
  gl.flush()
}

/**
 * 再描画ループのコールバック
 */
const render = () => {
  requestAnimationFrame(render)
  draw()
}

/**
 * アプリケーションの初期化関数
 */
const init = async () => {
  canvas = utils.getCanvas('webgl-canvas')

  canvas.width = 750
  canvas.height = 450

  gl = utils.getGLContext(canvas)

  // canvasを初期化する色を設定する
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  // canvasを初期化する際の深度を設定する
  gl.clearDepth(1.0)

  // 深度テストを有効にする
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)

  // 適切な順序で関数を呼び出す
  await initProgram()
  await initBuffers()
  render()
}

window.onload = init
