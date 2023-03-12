// @see https://wgld.org/d/webgl/w039.html

import { utils } from '../common/js/utils.js'
import { Matrix4x4 } from '../common/js/dist/matrix.js'
import { Float32Vector3 } from '../common/js/dist/vector.js'
import { Quaternion } from '../common/js/dist/quaternion.js'
import { torus, sphere } from './shape.js'

/** @type {HTMLCanvasElement | null} */
let canvas = null
/** @type {WebGL2RenderingContext | null} */
let gl = null
/** @type {WebGLProgram | null} */
let program = null
/** @type {WebGLTexture | null} */
let texture = null

/** @type {Matrix4x4} */
let pMatrix
/** @type {Matrix4x4} */
let pvMatrix
let rotationByMouse = Matrix4x4.identity()

/** @type {{ position: WebGLBuffer; normal: WebGLBuffer; color: WebGLBuffer; texCoords: WebGLBuffer; index: WebGLBuffer; length: number }} */
let sphereBuffer = {
  position: null,
  normal: null,
  color: null,
  texCoords: null,
  index: null,
  length: 0
}
/** @type {{ position: WebGLBuffer; normal: WebGLBuffer; color: WebGLBuffer; texCoords: WebGLBuffer; index: WebGLBuffer; length: number }} */
let torusBuffer = {
  position: null,
  normal: null,
  color: null,
  texCoords: null,
  index: null,
  length: 0
}

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
  program.uIsUseLight = gl.getUniformLocation(program, 'u_isUseLight')
  program.uTexture = gl.getUniformLocation(program, 'u_texture')
  program.uIsUseTexture = gl.getUniformLocation(program, 'u_isUseTexture')
  program.uIsDrawOutline = gl.getUniformLocation(program, 'u_isDrawOutline')

  gl.useProgram(program)
}

/**
 * バッファを準備する関数
 */
const initBuffers = async () => {
  const torusData = torus(64, 64, 0.25, 1.0)

  torusBuffer.position = utils.getVBO(gl, torusData.positions)
  torusBuffer.normal = utils.getVBO(gl, torusData.normals)
  torusBuffer.color = utils.getVBO(gl, torusData.colors)
  torusBuffer.texCoords = utils.getVBO(gl, torusData.texCoords)
  torusBuffer.index = utils.getIBO(gl, torusData.index)
  torusBuffer.length = torusData.index.length

  const sphereData = sphere(64, 64, 1.0, [1.0, 1.0, 1.0, 1.0])

  sphereBuffer.position = utils.getVBO(gl, sphereData.positions)
  sphereBuffer.normal = utils.getVBO(gl, sphereData.normals)
  sphereBuffer.color = utils.getVBO(gl, sphereData.colors)
  sphereBuffer.texCoords = utils.getVBO(gl, sphereData.texCoords)
  sphereBuffer.index = utils.getIBO(gl, sphereData.index)
  sphereBuffer.length = sphereData.index.length

  // プロジェクション座標変換行列
  pMatrix = Matrix4x4.perspective({
    fovYRadian: 45, // 視野角を 45 度
    aspectRatio: canvas.width / canvas.height, // アスペクト比は canvas のサイズそのまま
    near: 0.1, // ニアクリップ
    far: 100 // ファークリップ
  })

  // テクスチャを生成
  texture = await utils.getTexture(gl, './img/water-128x128.jpg')
}

/**
 * 図形を描画する関数
 *
 * @param {Object} data
 * @param {WebGLBuffer} data.position
 * @param {WebGLBuffer} data.normal
 * @param {WebGLBuffer} data.color
 * @param {WebGLBuffer} data.texCoords
 * @param {WebGLBuffer} data.index
 * @param {number} data.length
 * @param {Matrix4x4} mMatrix
 */
const drawShape = (data, mMatrix) => {
  // 頂点位置情報VBO
  utils.setAttribute(gl, {
    vbo: data.position,
    location: program.aVertexPosition,
    stride: 3 // vec3型
  })

  // 法線情報VBO
  utils.setAttribute(gl, {
    vbo: data.normal,
    location: program.aNormal,
    stride: 3
  })

  // 頂点色情報VBO
  utils.setAttribute(gl, {
    vbo: data.color,
    location: program.aVertexColor,
    stride: 4 // vec4型
  })

  // テクスチャ座標VBO
  utils.setAttribute(gl, {
    vbo: data.texCoords,
    location: program.aTextureCoord,
    stride: 2 // vec2型（xy座標）
  })

  // IBO
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, data.index)

  // 変換行列
  const mvpMatrix = pvMatrix.mulByMatrix4x4(mMatrix)
  gl.uniformMatrix4fv(program.uMvpMatrix, false, mvpMatrix.values)

  // インデックスを用いた描画命令
  gl.drawElements(gl.TRIANGLES, data.length, gl.UNSIGNED_SHORT, 0)
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
    new Float32Vector3(0.0, 0.0, 10.0), // 三次元空間を映し出すカメラを置く
    new Float32Vector3(0.0, 0.0, 0.0), // 原点を注視点として見つめる
    new Float32Vector3(0.0, 1.0, 0.0) // カメラの上方向は Y 軸の方向に指定
  ).mulByMatrix4x4(rotationByMouse)

  pvMatrix = pMatrix.mulByMatrix4x4(vMatrix)

  // テクスチャ
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.uniform1i(program.uTexture, 0)

  /* トーラス（シルエット） -------------------------------- */

  // ステンシルテストを有効にする
  gl.enable(gl.STENCIL_TEST)

  // カラーと深度をマスク
  gl.colorMask(false, false, false, false)
  gl.depthMask(false)

  // ステンシル設定
  gl.stencilFunc(gl.ALWAYS, 1, ~0)
  gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE)

  // 使用フラグ設定
  gl.uniform1i(program.uIsUseLight, false)
  gl.uniform1i(program.uIsUseTexture, false)
  gl.uniform1i(program.uIsDrawOutline, true)

  // モデル座標変換行列の生成
  const torusRotateAxis = new Float32Vector3(0.0, 1.0, 1.0).normalize()
  const mMatrixTorus = Matrix4x4.identity().rotateAround(torusRotateAxis, rad)

  // 描画
  drawShape(torusBuffer, mMatrixTorus)

  /* 球体 ----------------------------------------- */

  // カラーと深度のマスクを解除
  gl.colorMask(true, true, true, true)
  gl.depthMask(true)

  // ステンシル設定
  gl.stencilFunc(gl.EQUAL, 0, ~0)
  gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP)

  // 使用フラグ設定
  gl.uniform1i(program.uIsUseLight, false)
  gl.uniform1i(program.uIsUseTexture, true)
  gl.uniform1i(program.uIsDrawOutline, false)

  // モデル座標変換行列の生成
  const mMatrixSphere = Matrix4x4.identity().scale(50.0, 50.0, 50.0)

  // 描画
  drawShape(sphereBuffer, mMatrixSphere)

  /* トーラス --------------------------------------- */

  // ステンシルテストを無効にする
  gl.disable(gl.STENCIL_TEST)

  // モデルの逆行列
  const mInvMatrixTorus = mMatrixTorus.inverse()
  gl.uniformMatrix4fv(program.uMInvMatrix, false, mInvMatrixTorus.values)

  // 平行光源の向き
  gl.uniform3fv(program.uLightDirection, lightDirection)

  // 使用フラグ設定
  gl.uniform1i(program.uIsUseLight, true)
  gl.uniform1i(program.uIsUseTexture, false)
  gl.uniform1i(program.uIsDrawOutline, false)

  // 描画
  drawShape(torusBuffer, mMatrixTorus)

  /* -------------------------------------------- */

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
