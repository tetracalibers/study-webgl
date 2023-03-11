// @see https://wgld.org/d/webgl/w029.html

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
let texture = null

/** @type {number[]} */
let index = []

/** @type {Matrix4x4} */
let pvMatrix

let count = 0

let alphaValue = 1.0

/** @type {'transparency' | 'add'} */
let blendMode = 'transparency'

/**
 * GUIコントロール初期化関数
 */
const initControls = () => {
  utils.configureControls({
    'vertex alpha value [%]': {
      value: alphaValue,
      min: 0,
      max: 100,
      step: 1,
      onChange: (v) => (alphaValue = parseFloat(v / 100))
    },
    'blendeing mode': {
      value: blendMode,
      options: ['transparency', 'add'],
      onChange: (v) => (blendMode = v)
    }
  })
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
  program.uVertexAlpha = gl.getUniformLocation(program, 'u_alpha')
  program.uIsUseTexture = gl.getUniformLocation(program, 'u_isUseTexture')

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
    1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0
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

  // ビュー座標変換行列
  const vMatrix = Matrix4x4.lookAt(
    new Float32Vector3(0.0, 0.0, 5.0), // 三次元空間を映し出すカメラを置く
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
  texture = await utils.getTexture(gl, './img/tetra-128x128.jpg')
  // 有効にするテクスチャユニットを指定
  // 使うテクスチャが一つなので、そのまま0番目のユニットを使う
  gl.activeTexture(gl.TEXTURE0)
}

/**
 * canvasに描画する関数
 */
const draw = () => {
  // canvasを初期化
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // GUIで指定したブレンドタイプを設定
  utils.setBlendFactor(gl, blendMode)

  // カウンタをインクリメント
  count++
  // カウンタを元にラジアンを算出
  const rad = ((count % 360) * Math.PI) / 180

  /* 1つ目のモデル ------------------------------------ */

  // テクスチャをバインドして送信
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.uniform1i(program.uTexture, 0)

  // テクスチャを使う
  gl.uniform1i(program.uIsUseTexture, true)

  // ブレンディングを無効にする
  gl.disable(gl.BLEND)

  // 透明にしない
  gl.uniform1f(program.uVertexAlpha, 1.0)

  // モデル
  const mMatrix1 = Matrix4x4.identity().translate(0.25, 0.25, -0.25).rotateY(rad)
  const mvpMatrix1 = pvMatrix.mulByMatrix4x4(mMatrix1)
  gl.uniformMatrix4fv(program.uMvpMatrix, false, mvpMatrix1.values)

  // インデックスを用いた描画命令
  gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

  /* 2つ目のモデル ------------------------------------ */

  // テクスチャのバインドを解除した状態で送信
  gl.bindTexture(gl.TEXTURE_2D, null)
  gl.uniform1i(program.uTexture, 0)

  // テクスチャを使わない
  gl.uniform1i(program.uIsUseTexture, false)

  // ブレンディングを有効にする
  gl.enable(gl.BLEND)

  // GUIで指定した透明度を送信
  gl.uniform1f(program.uVertexAlpha, alphaValue)

  const mMatrix2 = Matrix4x4.identity().translate(-0.25, -0.25, 0.25).rotateZ(rad)
  const mvpMatrix2 = pvMatrix.mulByMatrix4x4(mMatrix2)
  gl.uniformMatrix4fv(program.uMvpMatrix, false, mvpMatrix2.values)

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

  gl = utils.getGLContext(canvas)

  // canvasを初期化する色を設定する
  gl.clearColor(0.0, 0.75, 0.75, 1.0)
  // canvasを初期化する際の深度を設定する
  gl.clearDepth(1.0)

  // 深度テストを有効にする
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)

  // 適切な順序で関数を呼び出す
  await initProgram()
  await initBuffers()
  render()

  initControls()
}

window.onload = init
