// @see https://wgld.org/d/webgl/w038.html

import { utils } from '../common/js/utils.js'
import { Matrix4x4 } from '../common/js/dist/matrix.js'
import { Float32Vector3 } from '../common/js/dist/vector.js'
import { Quaternion } from '../common/js/dist/quaternion.js'

/** @type {HTMLCanvasElement | null} */
let canvas = null
/** @type {WebGL2RenderingContext | null} */
let gl = null
/** @type {WebGLProgram | null} */
let program = null
/** @type {WebGLTexture | null} */
let texture = null

/** @type {number[]} */
let index = []

/** @type {Matrix4x4} */
let pMatrix
/** @type {Matrix4x4} */
let pvMatrix
let rotationByMouse = Matrix4x4.identity()

// ライトベクトル
const lightDirection = [1.0, 1.0, 1.0]

let count = 0

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
  program.aTextureCoord = gl.getAttribLocation(program, 'a_textureCoord')

  program.uMvpMatrix = gl.getUniformLocation(program, 'u_mvpMatrix')
  program.uMInvMatrix = gl.getUniformLocation(program, 'u_mInvMatrix')
  program.uLightDirection = gl.getUniformLocation(program, 'u_lightDirection')
  program.uTexture = gl.getUniformLocation(program, 'u_texture')

  gl.useProgram(program)
}

/**
 * バッファを準備する関数
 */
const initBuffers = async () => {
  const position = [-1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0]
  const normal = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0]
  const color = [1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
  const textureCoord = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]
  index = [0, 1, 2, 3, 2, 1]

  // 頂点位置情報VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, position),
    location: program.aVertexPosition,
    stride: 3 // vec3型
  })

  // 法線情報VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, normal),
    location: program.aNormal,
    stride: 3
  })

  // 頂点色情報VBO
  utils.setAttribute(gl, {
    vbo: utils.getVBO(gl, color),
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

  // プロジェクション座標変換行列
  pMatrix = Matrix4x4.perspective({
    fovYRadian: 45, // 視野角を 45 度
    aspectRatio: canvas.width / canvas.height, // アスペクト比は canvas のサイズそのまま
    near: 0.1, // ニアクリップ
    far: 100 // ファークリップ
  })

  // テクスチャを生成
  texture = await utils.getTexture(gl, './img/square-128x128.jpg')
}

/**
 * 四角形をtranslateさせて描画する関数
 *
 * @param {number} tx
 * @param {number} ty
 * @param {number} tz
 */
const drawSquare = (tx, ty, tz) => {
  // モデル
  const mMatrix = Matrix4x4.identity().translate(tx, ty, tz)
  const mvpMatrix = pvMatrix.mulByMatrix4x4(mMatrix)
  gl.uniformMatrix4fv(program.uMvpMatrix, false, mvpMatrix.values)

  // モデルの逆行列
  const mInvMatrix = mMatrix.inverse()
  gl.uniformMatrix4fv(program.uMInvMatrix, false, mInvMatrix.values)

  // 平行光源の向き
  gl.uniform3fv(program.uLightDirection, lightDirection)

  // インデックスを用いた描画命令
  gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)
}

/**
 * canvasに描画する関数
 */
const draw = () => {
  // canvasを初期化
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)

  // カウンタをインクリメント
  count++

  // カウンタを元にラジアンを算出
  const rad = ((count % 360) * Math.PI) / 180

  // ビュー座標変換行列
  const vMatrix = Matrix4x4.lookAt(
    new Float32Vector3(0.0, 0.0, 5.0), // 三次元空間を映し出すカメラを置く
    new Float32Vector3(0.0, 0.0, 0.0), // 原点を注視点として見つめる
    new Float32Vector3(0.0, 1.0, 0.0) // カメラの上方向は Y 軸の方向に指定
  ).mulByMatrix4x4(rotationByMouse)

  pvMatrix = pMatrix.mulByMatrix4x4(vMatrix)

  // テクスチャ
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.uniform1i(program.uTexture, 0)

  // ステンシルテストを有効にする
  gl.enable(gl.STENCIL_TEST)

  gl.stencilFunc(gl.ALWAYS, 1, ~0)
  gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE)
  drawSquare(-0.25, 0.25, -0.5)

  gl.stencilFunc(gl.ALWAYS, 0, ~0)
  gl.stencilOp(gl.KEEP, gl.INCR, gl.INCR)
  drawSquare(0.0, 0.0, 0.0)

  gl.stencilFunc(gl.EQUAL, 2, ~0)
  gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP)
  drawSquare(0.25, -0.25, 0.5)

  // ステンシルテストを無効にする
  gl.disable(gl.STENCIL_TEST)

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

  canvas.addEventListener('mousemove', calcQuaternionFromMousePosition, true)

  gl = utils.getGLContext(canvas, { stencil: true })

  // canvasを初期化する色を設定する
  gl.clearColor(0.0, 0.7, 0.7, 1.0)
  // canvasを初期化する際の深度を設定する
  gl.clearDepth(1.0)
  //
  gl.clearStencil(0)

  // 深度テストを有効にする
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)

  // 適切な順序で関数を呼び出す
  await initProgram()
  await initBuffers()
  render()
}

window.onload = init
