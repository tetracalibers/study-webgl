// @see https://wgld.org/d/webgl/w011.html
// @see https://wgld.org/d/webgl/w014.html

import { utils } from '../common/js/utils.js'
import { Matrix4x4 } from '../common/js/dist/matrix.js'
import { Float32Vector3 } from '../common/js/dist/vector.js'

/** @type {HTMLCanvasElement | null} */
let canvas = null
/** @type {WebGL2RenderingContext | null} */
let gl = null
/** @type {WebGLProgram | null} */
let program = null
/** @type {number} */
let startTime = 0.0
/** @type {[number, number]} */
let resolution = [0, 0]
/** @type {[number, number]} */
let mouse = [0.5, 0.5]

/**
 * 適切な頂点シェーダーとフラグメントシェーダーでプログラムを作成する関数
 */
const initProgram = async () => {
  const vertexShader = await utils.loadShader(gl, './index.vert')
  const fragmentShader = await utils.loadShader(gl, './index.frag')

  program = utils.getProgram(gl, vertexShader, fragmentShader)

  program.aVertexPosition = gl.getAttribLocation(program, 'a_position')
  program.uMvpMatrix = gl.getUniformLocation(program, 'u_mvpMatrix')
  program.uTime = gl.getUniformLocation(program, 'u_time')
  program.uResolusion = gl.getUniformLocation(program, 'u_resolution')
  program.uMouse = gl.getUniformLocation(program, 'u_mouse')

  startTime = new Date().getTime()

  gl.useProgram(program)
}

/**
 * バッファを準備する関数
 */
const initBuffers = () => {
  // モデル(頂点)データ
  const vertices = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0]

  // 3つの要素を持つvec3型の変数であることを示す
  const attStride = 3

  // VBOの生成
  const vPosition = utils.getVBO(gl, vertices)

  // VBOをバインド
  gl.bindBuffer(gl.ARRAY_BUFFER, vPosition)
  // attribute属性を有効にする
  gl.enableVertexAttribArray(program.aVertexPosition)
  // attribute属性を登録
  gl.vertexAttribPointer(
    program.aVertexPosition,
    attStride,
    gl.FLOAT,
    false,
    0,
    0
  )

  // モデル座標変換行列
  const mMatrix = Matrix4x4.identity()
  // ビュー座標変換行列
  const vMatrix = Matrix4x4.lookAt(
    new Float32Vector3(0.0, 1.0, 3.0), // 三次元空間を映し出すカメラを、原点から上に 1.0 、後ろに 3.0 移動した状態で置く
    new Float32Vector3(0.0, 0.0, 0.0), // 原点を注視点として見つめる
    new Float32Vector3(0.0, 1.0, 0.0) // カメラの上方向は Y 軸の方向に指定
  )
  // プロジェクション座標変換行列
  const pMatrix = Matrix4x4.perspective({
    fovYRadian: 90, // 視野角を 90 度
    aspectRatio: canvas.width / canvas.height, // アスペクト比は canvas のサイズそのまま
    near: 0.1, // ニアクリップ
    far: 100, // ファークリップ
  })
  // 各行列を掛け合わせ座標変換行列を完成させる
  const mvpMatrix = pMatrix.mulByMatrix4x4(vMatrix).mulByMatrix4x4(mMatrix)
  // uniformLocationへ座標変換行列を登録
  // - 第二引数は行列を転置するかどうか
  gl.uniformMatrix4fv(program.uMvpMatrix, false, mvpMatrix.values)
}

/**
 * canvasに描画する関数
 */
const draw = () => {
  // canvasを初期化
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // ミリ秒単位の時間をそのまま渡すと非常に大きな数字になってしまうため、
  // 千分の一にしてシェーダに送る
  const time = (new Date().getTime() - startTime) * 0.001
  gl.uniform1f(program.uTime, time)
  gl.uniform2fv(program.uResolusion, resolution)
  gl.uniform2fv(program.uMouse, mouse)

  // モデルをバッファ上に描画
  // - 第二引数は何番目の頂点から利用するかのオフセット
  // - 第三引数はいくつの頂点を描画するのか
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
 * マウスが動いた時のイベントハンドラ
 * @param {MouseEvent} e
 */
const onMouseMove = (e) => {
  const [canvasWidth, canvasHeight] = resolution
  // マウスカーソルの座標は、スクリーンの幅で正規化して 0 ～ 1 の範囲でシェーダに送る
  mouse = [e.offsetX / canvasWidth, e.offsetY / canvasHeight]
}

/**
 * アプリケーションの初期化関数
 */
const init = async () => {
  canvas = utils.getCanvas('webgl-canvas')

  canvas.width = 300
  canvas.height = 300

  resolution = [canvas.width, canvas.height]
  canvas.addEventListener('mousemove', onMouseMove, true)

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
