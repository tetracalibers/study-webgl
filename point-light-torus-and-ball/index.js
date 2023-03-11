// @see https://wgld.org/d/webgl/w025.html

import { utils } from '../common/js/utils.js'
import { Matrix4x4 } from '../common/js/dist/matrix.js'
import { Float32Vector3 } from '../common/js/dist/vector.js'
import { torus, sphere } from './shape.js'

/** @type {HTMLCanvasElement | null} */
let canvas = null
/** @type {WebGL2RenderingContext | null} */
let gl = null
/** @type {WebGLProgram | null} */
let program = null

/** @type {Matrix4x4} */
let pvMatrix

// 視線
const eyeDirection = [0.0, 0.0, 20.0]
// トーラス
const torusData = torus(64, 64, 0.5, 1.5, [0.75, 0.25, 0.25, 1.0])
// 球体
const sphereData = sphere(64, 64, 2.0, [0.25, 0.25, 0.75, 1.0])

let count = 0

/**
 * 適切な頂点シェーダーとフラグメントシェーダーでプログラムを作成する関数
 */
const initProgram = async () => {
  const vertexShader = await utils.loadShader(gl, './index.vert')
  const fragmentShader = await utils.loadShader(gl, './index.frag')

  program = utils.getProgram(gl, vertexShader, fragmentShader)

  program.aVertexPosition = gl.getAttribLocation(program, 'a_position')
  program.aNormal = gl.getAttribLocation(program, 'a_normal')
  program.aVertexColor = gl.getAttribLocation(program, 'a_color')

  program.uMMatrix = gl.getUniformLocation(program, 'u_mMatrix')
  program.uMvpMatrix = gl.getUniformLocation(program, 'u_mvpMatrix')
  program.uMInvMatrix = gl.getUniformLocation(program, 'u_mInvMatrix')
  program.uLightDirection = gl.getUniformLocation(program, 'u_lightPosition')
  program.uEyeDirection = gl.getUniformLocation(program, 'u_eyeDirection')
  program.uAmbientColor = gl.getUniformLocation(program, 'u_ambientColor')

  gl.useProgram(program)
}

/**
 * 特定のオブジェクトの描画のためのバッファを準備する関数
 *
 * @param {Object} shape
 * @param {number[]} shape.positions
 * @param {number[]} shape.normals
 * @param {number[]} shape.colors,
 * @param {number[]} shape.index
 */
const setShapeBuffers = (shape) => {
  // 頂点位置情報VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, shape.positions),
    location: program.aVertexPosition,
    stride: 3 // vec3型
  })

  // 法線情報VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, shape.normals),
    location: program.aNormal,
    stride: 3
  })

  // 頂点色情報VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, shape.colors),
    location: program.aVertexColor,
    stride: 4 // vec4型
  })

  // IBO
  const ibo = utils.getIBO(gl, shape.index)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
}

/**
 * バッファを準備する関数
 */
const initBuffers = () => {
  // ビュー座標変換行列
  const vMatrix = Matrix4x4.lookAt(
    new Float32Vector3(...eyeDirection), // 三次元空間を映し出すカメラを置く
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
}

/**
 * トーラスを描画する関数
 *
 * @param {number} tx
 * @param {number} ty
 * @param {number} tz
 * @param {number} rad
 */
const drawTorus = (tx, ty, tz, rad) => {
  const shape = torusData

  setShapeBuffers(shape)

  const mMatrix = Matrix4x4.identity()
    .translate(tx, -ty, -tz)
    .rotateAround(new Float32Vector3(0.0, 1.0, 1.0).normalize(), -rad)
  gl.uniformMatrix4fv(program.uMMatrix, false, mMatrix.values)

  const mvpMatrix = pvMatrix.mulByMatrix4x4(mMatrix)
  gl.uniformMatrix4fv(program.uMvpMatrix, false, mvpMatrix.values)

  // モデルの逆行列
  const mInvMatrix = mMatrix.inverse()
  gl.uniformMatrix4fv(program.uMInvMatrix, false, mInvMatrix.values)

  // インデックスを用いた描画命令
  gl.drawElements(gl.TRIANGLES, shape.index.length, gl.UNSIGNED_SHORT, 0)
}

const drawSphere = (tx, ty, tz, rad) => {
  const shape = sphereData

  setShapeBuffers(shape)

  const mMatrix = Matrix4x4.identity().translate(-tx, ty, tz)
  gl.uniformMatrix4fv(program.uMMatrix, false, mMatrix.values)

  const mvpMatrix = pvMatrix.mulByMatrix4x4(mMatrix)
  gl.uniformMatrix4fv(program.uMvpMatrix, false, mvpMatrix.values)

  // モデルの逆行列
  const mInvMatrix = mMatrix.inverse()
  gl.uniformMatrix4fv(program.uMInvMatrix, false, mInvMatrix.values)

  // インデックスを用いた描画命令
  gl.drawElements(gl.TRIANGLES, shape.index.length, gl.UNSIGNED_SHORT, 0)
}

/**
 * canvasに描画する関数
 */
const draw = () => {
  // canvasを初期化
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // 点光源の位置
  gl.uniform3fv(program.uLightPosition, [0.0, 0.0, 0.0])
  // 視線ベクトル
  gl.uniform3fv(program.uEyeDirection, eyeDirection)
  // 環境光の色
  gl.uniform4fv(program.uAmbientColor, [0.1, 0.1, 0.1, 1.0])

  // カウンタをインクリメント
  count++

  // カウンタを元にラジアンを算出
  const rad = ((count % 360) * Math.PI) / 180

  // 各種座標を算出
  const tx = Math.cos(rad) * 3.5
  const ty = Math.sin(rad) * 3.5
  const tz = Math.sin(rad) * 3.5

  drawTorus(tx, ty, tz, rad)
  drawSphere(tx, ty, tz, rad)

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

  canvas.width = 500
  canvas.height = 300

  gl = utils.getGLContext(canvas)

  // canvasを初期化する色を設定する
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  // canvasを初期化する際の深度を設定する
  gl.clearDepth(1.0)

  // カリングと深度テストを有効にする
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)
  gl.enable(gl.CULL_FACE)

  // 適切な順序で関数を呼び出す
  await initProgram()
  initBuffers()
  render()
}

window.onload = init
