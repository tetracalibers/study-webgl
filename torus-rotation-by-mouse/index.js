// @see https://wgld.org/d/webgl/w033.html

import { utils } from '../common/js/utils.js'
import { Matrix4x4 } from '../common/js/dist/matrix.js'
import { Float32Vector3 } from '../common/js/dist/vector.js'
import { Quaternion } from '../common/js/dist/quaternion.js'
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
let rotationByMouse = Matrix4x4.identity()

let count = 0

// 点光源の位置
const lightPosition = [15.0, 10.0, 15.0]
// 環境光の色
const ambientColor = [0.1, 0.1, 0.1, 1.0]

// カメラの座標
const cameraPosition = [0.0, 0.0, 10.0]
// カメラの上方向を表すベクトル
const cameraUpDirection = [0.0, 1.0, 0.0]

/**
 * イベントから取得したマウス座標をもとに回転軸ベクトルと回転角を割り出し、
 * クォータニオンを更新する関数
 *
 * @param {MouseEvent} e
 */
const calcQuaternionFromMousePosition = (e) => {
  const cvsW = canvas.width
  const cvsH = canvas.height
  const cvsNorm = Math.sqrt(cvsW * cvsW + cvsH * cvsH)
  // マウス座標をキャンバス内の座標に変換した上で
  let x = e.clientX - canvas.offsetLeft
  let y = e.clientY - canvas.offsetTop
  // キャンバス中央からの相対的な座標に変換
  x -= cvsW * 0.5
  y -= cvsH * 0.5
  const mouseNorm = Math.sqrt(x * x + y * y)
  const angle = (mouseNorm * 2.0 * Math.PI) / cvsNorm
  const axis = new Float32Vector3(y, x, 0.0).normalize()
  rotationByMouse = Quaternion.rotationAround(axis, angle).toRotationMatrix4()
}

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
  program.uMMatrix = gl.getUniformLocation(program, 'u_mMatrix')
  program.uMInvMatrix = gl.getUniformLocation(program, 'u_mInvMatrix')
  program.uLightPosition = gl.getUniformLocation(program, 'u_lightPosition')
  program.uEyeDirection = gl.getUniformLocation(program, 'u_eyeDirection')
  program.uAmbientColor = gl.getUniformLocation(program, 'u_ambientColor')

  gl.useProgram(program)
}

/**
 * バッファを準備する関数
 */
const initBuffers = () => {
  const torusData = torus(64, 64, 0.5, 1.5)
  const { positions, colors, normals } = torusData
  index = torusData.index

  // 頂点位置情報VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, positions),
    location: program.aVertexPosition,
    stride: 3 // vec3型
  })

  // 法線情報VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, normals),
    location: program.aNormal,
    stride: 3
  })

  // 頂点色情報VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, colors),
    location: program.aVertexColor,
    stride: 4 // vec4型
  })

  // IBO
  const ibo = utils.getIBO(gl, index)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)

  // ビュー座標変換行列
  const vMatrix = Matrix4x4.lookAt(
    new Float32Vector3(...cameraPosition), // 三次元空間を映し出すカメラを置く
    new Float32Vector3(0.0, 0.0, 0.0), // 原点を注視点として見つめる
    new Float32Vector3(...cameraUpDirection) // カメラの上方向
  )

  // プロジェクション座標変換行列
  const pMatrix = Matrix4x4.perspective({
    fovYRadian: 45, // 視野角を 45 度
    aspectRatio: canvas.width / canvas.height, // アスペクト比は canvas のサイズそのまま
    near: 0.1, // ニアクリップ
    far: 100 // ファークリップ
  })

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
  const rad = ((count % 180) * Math.PI) / 90

  // モデル座標変換行列
  // マウスに応じて回転する
  // マウスを動かさなくても自動的にy軸中心回転するようにする
  const mMatrix = Matrix4x4.identity().mulByMatrix4x4(rotationByMouse).rotateY(rad)
  gl.uniformMatrix4fv(program.uMMatrix, false, mMatrix.values)

  // 最終的な座標変換行列
  const mvpMatrix = pvMatrix.mulByMatrix4x4(mMatrix)
  gl.uniformMatrix4fv(program.uMvpMatrix, false, mvpMatrix.values)

  // モデルの逆行列
  const mInvMatrix = mMatrix.inverse()
  gl.uniformMatrix4fv(program.uMInvMatrix, false, mInvMatrix.values)

  // 点光源の位置
  gl.uniform3fv(program.uLightPosition, lightPosition)
  // 視線ベクトル
  gl.uniform3fv(program.uEyeDirection, cameraPosition)
  // 環境光の色
  gl.uniform4fv(program.uAmbientColor, ambientColor)

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

  canvas.width = 300
  canvas.height = 300

  canvas.addEventListener('mousemove', calcQuaternionFromMousePosition, true)

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
