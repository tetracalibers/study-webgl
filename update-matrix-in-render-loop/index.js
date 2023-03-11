// @see https://wgld.org/d/webgl/w017.html

import { utils } from '../common/js/utils.js'
import { Matrix4x4 } from '../common/js/dist/matrix.js'
import { Float32Vector3 } from '../common/js/dist/vector.js'

/** @type {HTMLCanvasElement | null} */
let canvas = null
/** @type {WebGL2RenderingContext | null} */
let gl = null
/** @type {WebGLProgram | null} */
let program = null

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
  program.uMvpMatrix = gl.getUniformLocation(program, 'u_mvpMatrix')

  gl.useProgram(program)
}

/**
 * バッファを準備する関数
 */
const initBuffers = () => {
  // 頂点の位置情報を格納する配列
  const vertex_position = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0]

  // 頂点の色情報を格納する配列
  // prettier-ignore
  const vertex_color = [
    // R, G, B, A
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
  ]

  // 頂点位置情報VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, vertex_position),
    location: program.aVertexPosition,
    stride: 3 // vec3型
  })

  // 頂点色情報VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, vertex_color),
    location: program.aVertexColor,
    stride: 4 // vec4型
  })

  // ビュー座標変換行列
  const vMatrix = Matrix4x4.lookAt(
    new Float32Vector3(0.0, 0.0, 3.0), // 三次元空間を映し出すカメラを、原点から上に 1.0 、後ろに 3.0 移動した状態で置く
    new Float32Vector3(0.0, 0.0, 0.0), // 原点を注視点として見つめる
    new Float32Vector3(0.0, 1.0, 0.0) // カメラの上方向は Y 軸の方向に指定
  )
  // プロジェクション座標変換行列
  const pMatrix = Matrix4x4.perspective({
    fovYRadian: 90, // 視野角を 90 度
    aspectRatio: canvas.width / canvas.height, // アスペクト比は canvas のサイズそのまま
    near: 0.1, // ニアクリップ
    far: 100 // ファークリップ
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

  //// モデル1は円の軌道を描き移動する
  const x = Math.cos(rad)
  const y = Math.sin(rad)
  const m1Matrix = Matrix4x4.identity().translate(x, y + 1.0, 0.0)
  const mvp1Matrix = pvMatrix.mulByMatrix4x4(m1Matrix)
  gl.uniformMatrix4fv(program.uMvpMatrix, false, mvp1Matrix.values)
  gl.drawArrays(gl.TRIANGLES, 0, 3)

  // モデル2はY軸を中心に回転する
  const m2Matrix = Matrix4x4.identity().translate(1.0, -1.0, 0.0).rotateY(rad)
  const mvp2Matrix = pvMatrix.mulByMatrix4x4(m2Matrix)
  gl.uniformMatrix4fv(program.uMvpMatrix, false, mvp2Matrix.values)
  gl.drawArrays(gl.TRIANGLES, 0, 3)

  // モデル3は拡大縮小する
  const s = Math.sin(rad) + 1.0
  const m3Matrix = Matrix4x4.identity().translate(-1.0, -1.0, 0.0).scale(s, s, 0.0)
  const mvp3Matrix = pvMatrix.mulByMatrix4x4(m3Matrix)
  gl.uniformMatrix4fv(program.uMvpMatrix, false, mvp3Matrix.values)
  gl.drawArrays(gl.TRIANGLES, 0, 3)

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

  canvas.width = 300
  canvas.height = 300

  gl = utils.getGLContext(canvas)

  // canvasを初期化する色を設定する
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  // canvasを初期化する際の深度を設定する
  gl.clearDepth(1.0)

  // 適切な順序で関数を呼び出す
  await initProgram()
  initBuffers()
  render()
}

window.onload = init
