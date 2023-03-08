// @see https://wgld.org/d/webgl/w024.html

import { utils } from '../common/js/utils.js'
import { Matrix4x4 } from '../common/js/dist/matrix.js'
import { Float32Vector3 } from '../common/js/dist/vector.js'
import { torus } from './torus.js'

/** @type {HTMLCanvasElement | null} */
let canvas = null
/** @type {WebGL2RenderingContext | null} */
let gl = null
/** @type {WebGLProgram | null} */
let program = null

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
  program.aNormal = gl.getAttribLocation(program, 'a_normal')
  program.aVertexColor = gl.getAttribLocation(program, 'a_color')

  program.uMvpMatrix = gl.getUniformLocation(program, 'u_mvpMatrix')
  program.uMInvMatrix = gl.getUniformLocation(program, 'u_mInvMatrix')
  program.uLightDirection = gl.getUniformLocation(program, 'u_lightDirection')
  program.uEyeDirection = gl.getUniformLocation(program, 'u_eyeDirection')
  program.uAmbientColor = gl.getUniformLocation(program, 'u_ambientColor')

  gl.useProgram(program)
}

/**
 * バッファを準備する関数
 */
const initBuffers = () => {
  const torusData = torus(32, 32, 1.0, 2.0)
  const { positions, colors, normals } = torusData
  index = torusData.index

  // 頂点位置情報VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, positions),
    location: program.aVertexPosition,
    stride: 3, // vec3型
  })

  // 法線情報VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, normals),
    location: program.aNormal,
    stride: 3,
  })

  // 頂点色情報VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, colors),
    location: program.aVertexColor,
    stride: 4, // vec4型
  })

  // IBO
  const ibo = utils.getIBO(gl, index)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)

  // ビュー座標変換行列
  const vMatrix = Matrix4x4.lookAt(
    new Float32Vector3(0.0, 0.0, 20.0), // 三次元空間を映し出すカメラを後ろに 20.0 移動した状態で置く
    new Float32Vector3(0.0, 0.0, 0.0), // 原点を注視点として見つめる
    new Float32Vector3(0.0, 1.0, 0.0) // カメラの上方向は Y 軸の方向に指定
  )
  // プロジェクション座標変換行列
  const pMatrix = Matrix4x4.perspective({
    fovYRadian: 45, // 視野角を 45 度
    aspectRatio: canvas.width / canvas.height, // アスペクト比は canvas のサイズそのまま
    near: 0.1, // ニアクリップ
    far: 100, // ファークリップ
  })
  // 共通の変換行列を作っておく
  pvMatrix = pMatrix.mulByMatrix4x4(vMatrix)
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

  // 回転するモデル
  const mMatrix = Matrix4x4.identity().rotateAround(
    new Float32Vector3(0.0, 1.0, 1.0).normalize(),
    rad
  )
  const mvpMatrix = pvMatrix.mulByMatrix4x4(mMatrix)
  gl.uniformMatrix4fv(program.uMvpMatrix, false, mvpMatrix.values)

  // モデルの逆行列
  const mInvMatrix = mMatrix.inverse()
  gl.uniformMatrix4fv(program.uMInvMatrix, false, mInvMatrix.values)

  // 平行光源の向き
  gl.uniform3fv(program.uLightDirection, [-0.5, 0.5, 0.5])
  // 視線ベクトル
  gl.uniform3fv(program.uEyeDirection, [0.0, 0.0, 20.0])
  // 環境光の色
  gl.uniform4fv(program.uAmbientColor, [0.1, 0.1, 0.1, 1.0])

  // インデックスを用いた描画命令
  gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

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
