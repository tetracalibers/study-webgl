// @see https://thebookofshaders.com/06/?lan=jp

import { utils } from '../common/js/utils.js'

/** @type {WebGL2RenderingContext | null} */
let gl = null
/** @type {WebGLVertexArrayObject | null}*/
let vao = null
/** @type {WebGLProgram | null} */
let program = null
/** @type {number} */
let startTime = 0.0

/**
 * 適切な頂点シェーダーとフラグメントシェーダーでプログラムを作成する関数
 */
const initProgram = async () => {
  const vertexShader = await utils.loadShader(gl, './index.vert')
  const fragmentShader = await utils.loadShader(gl, './index.frag')

  program = utils.getProgram(gl, vertexShader, fragmentShader)

  program.aVertexPosition = gl.getAttribLocation(program, 'a_position')
  program.uTime = gl.getUniformLocation(program, 'u_time')

  startTime = new Date().getTime()

  gl.useProgram(program)
}

/**
 * バッファを準備する関数
 */
const initBuffers = () => {
  /** 頂点 */
  const vertices = [-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]

  const vertexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  // VAOインスタンス作成
  vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  const size = 2
  const type = gl.FLOAT
  const normalize = false
  const stride = 0
  const offset = 0
  gl.vertexAttribPointer(program.aVertexPosition, size, type, normalize, stride, offset)
  gl.enableVertexAttribArray(program.aVertexPosition)

  // バッファを使い終えたらバインドを解除
  gl.bindVertexArray(null)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
}

/**
 * canvasに描画する関数
 */
const draw = () => {
  const time = (new Date().getTime() - startTime) * 0.001
  gl.uniform1f(program.uTime, time)

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  gl.bindVertexArray(vao)

  const primitiveType = gl.TRIANGLES
  const offset = 0
  const count = 6 // indices.length
  gl.drawArrays(primitiveType, offset, count)

  // 利用が終わったバッファはバインドを解除
  gl.bindVertexArray(null)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
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
  const canvas = utils.getCanvas('webgl-canvas')

  utils.autoResizeCanvas(canvas)

  gl = utils.getGLContext(canvas)
  gl.clearColor(0, 0, 0, 0)

  // 適切な順序で関数を呼び出す
  await initProgram()
  initBuffers()
  render()
}

window.onload = init
