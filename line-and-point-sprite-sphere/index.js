// @see https://wgld.org/d/webgl/w036.html

import { utils } from '../common/js/utils.js'
import { Matrix4x4 } from '../common/js/dist/matrix.js'
import { Float32Vector3 } from '../common/js/dist/vector.js'
import { Quaternion } from '../common/js/dist/quaternion.js'
import { sphere } from './shape.js'

/** @type {HTMLCanvasElement | null} */
let canvas = null
/** @type {WebGL2RenderingContext | null} */
let gl = null
/** @type {WebGLProgram | null} */
let program = null

/** @type {Matrix4x4} */
let pMatrix
let rotationByMouse = Matrix4x4.identity()

/** @type {{ position: WebGLBuffer; color: WebGLBuffer; length: number }} */
let sphereBuffer = {
  position: null,
  color: null,
  length: 0
}
/** @type {{ position: WebGLBuffer; color: WebGLBuffer; length: number }} */
let lineBuffer = {
  position: null,
  color: null,
  length: 0
}

let count = 0

let pointSize = 1
/** @type {'LINES' | 'LINE_STRIP' | 'LINE_LOOP'} */
let linePrimitiveType = 'LINES'

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
 * GUIコントロール初期化関数
 */
const initControls = () => {
  utils.configureControls({
    'point size [px]': {
      value: pointSize,
      min: 1,
      max: 10,
      step: 0.1,
      onChange: (v) => (pointSize = v)
    },
    'line primitive type': {
      value: linePrimitiveType,
      options: ['LINES', 'LINE_STRIP', 'LINE_LOOP'],
      onChange: (v) => (linePrimitiveType = v)
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

  program.uMvpMatrix = gl.getUniformLocation(program, 'u_mvpMatrix')
  program.uPointSize = gl.getUniformLocation(program, 'u_pointSize')

  gl.useProgram(program)
}

/**
 * バッファを準備する関数
 */
const initBuffers = () => {
  /* 球状に並んだ点 ------------------------------------ */

  const sphereData = sphere(16, 16, 2.0)

  sphereBuffer = {
    position: utils.getVBO(gl, sphereData.positions),
    color: utils.getVBO(gl, sphereData.colors),
    length: sphereData.positions.length / 3
  }

  /* 線 ------------------------------------------ */

  const lineData = {
    positions: [-1.0, -1.0, 0.0, 1.0, -1.0, 0.0, -1.0, 1.0, 0.0, 1.0, 1.0, 0.0],
    colors: [1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0]
  }

  lineBuffer = {
    position: utils.getVBO(gl, lineData.positions),
    color: utils.getVBO(gl, lineData.colors),
    length: lineData.positions.length / 3
  }

  /* -------------------------------------------- */

  // プロジェクション座標変換行列
  pMatrix = Matrix4x4.perspective({
    fovYRadian: 45, // 視野角を 45 度
    aspectRatio: canvas.width / canvas.height, // アスペクト比は canvas のサイズそのまま
    near: 0.1, // ニアクリップ
    far: 100 // ファークリップ
  })
}

/**
 * 図形を描画する関数
 *
 * @param {Object} data
 * @param {WebGLBuffer} data.position
 * @param {WebGLBuffer} data.color
 * @param {number} data.length
 * @param {Matrix4x4} mMatrix
 * @param {'LINES' | 'LINE_STRIP' | 'LINE_LOOP' | 'POINTS'} renderingType
 */
const drawShape = (data, mMatrix, renderingType) => {
  // 頂点位置情報VBO
  utils.setAttribute(gl, {
    vbo: data.position,
    location: program.aVertexPosition,
    stride: 3 // vec3型
  })

  // 頂点色情報VBO
  utils.setAttribute(gl, {
    vbo: data.color,
    location: program.aVertexColor,
    stride: 4 // vec4型
  })

  // ビュー座標変換行列
  const vMatrix = Matrix4x4.lookAt(
    new Float32Vector3(0.0, 5.0, 10.0), // 三次元空間を映し出すカメラを置く
    new Float32Vector3(0.0, 0.0, 0.0), // 原点を注視点として見つめる
    new Float32Vector3(0.0, 1.0, 0.0) // カメラの上方向
  ).mulByMatrix4x4(rotationByMouse)

  // 最終的な座標変換行列
  const mvpMatrix = pMatrix.mulByMatrix4x4(vMatrix).mulByMatrix4x4(mMatrix)
  gl.uniformMatrix4fv(program.uMvpMatrix, false, mvpMatrix.values)

  // 描画命令
  gl.drawArrays(gl[renderingType], 0, data.length)
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

  // 点のサイズを送る
  gl.uniform1f(program.uPointSize, pointSize)

  // 球を描画
  const mMatrixSphere = Matrix4x4.identity().rotateY(rad)
  drawShape(sphereBuffer, mMatrixSphere, 'POINTS')

  // 線を描画
  const mMatrixLine = Matrix4x4.identity()
    .rotateX(Math.PI / 2)
    .scale(3.0, 3.0, 1.0)
  drawShape(lineBuffer, mMatrixLine, linePrimitiveType)

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

  // 点の最大ピクセル数をコンソールに表示
  const [minPointSize, maxPointSize] = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)
  console.log('pointSizeRange:', minPointSize, 'to', maxPointSize)

  // 適切な順序で関数を呼び出す
  await initProgram()
  initBuffers()
  render()

  initControls()
}

window.onload = init
