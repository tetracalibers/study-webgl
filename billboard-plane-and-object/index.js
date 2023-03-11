// @see https://wgld.org/d/webgl/w035.html

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
let billboardTexture = null
/** @type {WebGLTexture | null} */
let floorTexture = null

/** @type {number[]} */
let index = []

/** @type {Matrix4x4} */
let pMatrix
let rotationByMouse = Matrix4x4.identity()

let isBillboardOn = true

/**
 * GUIコントロール初期化関数
 */
const initControls = () => {
  utils.configureControls({
    billboard: {
      value: isBillboardOn,
      options: [true, false],
      onChange: (v) => (isBillboardOn = v)
    }
  })
}

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
  program.aVertexColor = gl.getAttribLocation(program, 'a_color')
  program.aTextureCoord = gl.getAttribLocation(program, 'a_textureCoord')

  program.uMvpMatrix = gl.getUniformLocation(program, 'u_mvpMatrix')
  program.uTexture = gl.getUniformLocation(program, 'u_texture')

  gl.useProgram(program)
}

/**
 * バッファを準備する関数
 */
const initBuffers = async () => {
  // 頂点位置
  const vertexPosition = [-1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0]

  // 頂点色
  const vertexColor = [
    1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0
  ]

  // テクスチャ座標
  const textureCoord = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]

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

  // プロジェクション座標変換行列
  pMatrix = Matrix4x4.perspective({
    fovYRadian: 45, // 視野角を 45 度
    aspectRatio: canvas.width / canvas.height, // アスペクト比は canvas のサイズそのまま
    near: 0.1, // ニアクリップ
    far: 100 // ファークリップ
  })

  // テクスチャを生成
  billboardTexture = await utils.getTexture(gl, './img/tetra-128x128_ts.png')
  floorTexture = await utils.getTexture(gl, './img/plane-256x256.jpg')
}

/**
 * canvasに描画する関数
 */
const draw = () => {
  // canvasを初期化
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // カメラの座標位置
  const cameraPositionVec = new Float32Vector3(0.0, 5.0, 10.0)
  // カメラの注視点
  const lookAtPositionVec = new Float32Vector3(0.0, 0.0, 0.0)
  // カメラの上方向
  const cameraUpDirectionVec = new Float32Vector3(0.0, 1.0, 0.0)

  // ビュー座標変換行列
  let vMatrix = Matrix4x4.lookAt(cameraPositionVec, lookAtPositionVec, cameraUpDirectionVec)

  // ビルボード用のビュー座標変換行列
  // カメラの座標とカメラの注視点を入れ替えた形でlookAtを呼び出せば、逆の視線ベクトルを持つ行列が生成できる
  let vMatrixBillboard = Matrix4x4.lookAt(
    lookAtPositionVec,
    cameraPositionVec,
    cameraUpDirectionVec
  )

  // ビュー座標変換行列にクォータニオンの回転を適用
  vMatrix = vMatrix.mulByMatrix4x4(rotationByMouse)
  vMatrixBillboard = vMatrixBillboard.mulByMatrix4x4(rotationByMouse)

  // ビルボード用のビュー座標変換行列から逆行列を生成
  // カメラの回転を相殺するために、逆行列が必要
  vMatrixBillboard = vMatrixBillboard.inverse()

  // ビュー×プロジェクション座標変換行列
  const pvMatrix = pMatrix.mulByMatrix4x4(vMatrix)

  /* floor -------------------------------------- */

  // フロア用テクスチャをバインド
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, floorTexture)
  gl.uniform1i(program.uTexture, 1)

  // モデル
  const mMatrixFloor = Matrix4x4.identity()
    .rotateX(Math.PI / 2)
    .scale(3.0, 3.0, 1.0)
  const mvpMatrixFloor = pvMatrix.mulByMatrix4x4(mMatrixFloor)
  gl.uniformMatrix4fv(program.uMvpMatrix, false, mvpMatrixFloor.values)

  // インデックスを用いた描画命令
  gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

  /* billboard ---------------------------------- */

  // ビルボード用テクスチャをバインド
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, billboardTexture)
  gl.uniform1i(program.uTexture, 0)

  // モデル
  let mMatrixBillboard = Matrix4x4.identity().translate(0.0, 1.0, 0.0)
  if (isBillboardOn) {
    mMatrixBillboard = mMatrixBillboard.mulByMatrix4x4(vMatrixBillboard)
  }

  const mvpMatrixBillboard = pvMatrix.mulByMatrix4x4(mMatrixBillboard)
  gl.uniformMatrix4fv(program.uMvpMatrix, false, mvpMatrixBillboard.values)

  // インデックスを用いた描画命令
  gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

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

  gl = utils.getGLContext(canvas)

  // canvasを初期化する色を設定する
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  // canvasを初期化する際の深度を設定する
  gl.clearDepth(1.0)

  // 深度テストを有効にする
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)

  // ブレンディングを有効にする
  gl.enable(gl.BLEND)
  // ブレンドファクター
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE)

  // 適切な順序で関数を呼び出す
  await initProgram()
  await initBuffers()
  render()

  initControls()
}

window.onload = init
