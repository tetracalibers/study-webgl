// @see https://wgld.org/d/glsl/g003.html

import { utils } from '../common/js/utils.js'

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
  /** 頂点 */
  const vertices = [-1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0]
  const indices = [0, 2, 1, 1, 2, 3]

  const vPosition = utils.getVBO(gl, vertices)
  const vIndex = utils.getIBO(gl, indices)

  gl.bindBuffer(gl.ARRAY_BUFFER, vPosition)
  gl.enableVertexAttribArray(program.aVertexPosition)
  gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex)
}

/**
 * canvasに描画する関数
 */
const draw = () => {
  gl.clear(gl.COLOR_BUFFER_BIT)

  // ミリ秒単位の時間をそのまま渡すと非常に大きな数字になってしまうため、
  // 千分の一にしてシェーダに送る
  const time = (new Date().getTime() - startTime) * 0.001
  gl.uniform1f(program.uTime, time)
  gl.uniform2fv(program.uResolusion, resolution)
  gl.uniform2fv(program.uMouse, mouse)

  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
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
  const canvas = utils.getCanvas('webgl-canvas')

  canvas.width = 512
  canvas.height = 512
  //utils.autoResizeCanvas(canvas)

  resolution = [canvas.width, canvas.height]
  canvas.addEventListener('mousemove', onMouseMove, true)

  gl = utils.getGLContext(canvas)
  gl.clearColor(0.0, 0.0, 0.0, 1.0)

  // 適切な順序で関数を呼び出す
  await initProgram()
  initBuffers()
  render()
}

window.onload = init
