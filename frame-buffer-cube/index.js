// @see https://wgld.org/d/webgl/w040.html

import { utils } from '../common/js/utils.js'
import { Matrix4x4 } from '../common/js/dist/matrix.js'
import { Float32Vector3 } from '../common/js/dist/vector.js'
import { sphere, cube } from './shape.js'

/** @type {HTMLCanvasElement | null} */
let canvas = null
/** @type {WebGL2RenderingContext | null} */
let gl = null
/** @type {WebGLProgram | null} */
let program = null

/** @type {WebGLTexture | null} */
let textureCube = null
/** @type {WebGLTexture | null} */
let textureSphere = null

/** @type {{ buffer: WebGLFramebuffer | null, texture: WebGLTexture | null; width: number, height: number; }} */
let frameBuffer = {
  buffer: null,
  width: 512,
  height: 512,
  texture: null
}

/** @type {Matrix4x4} */
let vMatrix
/** @type {Matrix4x4} */
let pMatrix
/** @type {Matrix4x4} */
let pvMatrix
/** @type {Matrix4x4} */
let mMatrix

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
let cubeBuffer = {
  position: null,
  normal: null,
  color: null,
  texCoords: null,
  index: null,
  length: 0
}

let count = 0

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

  gl.useProgram(program)
}

/**
 * バッファを準備する関数
 */
const initBuffers = async () => {
  const cubeData = cube(2.0, [1.0, 1.0, 1.0, 1.0])

  cubeBuffer.position = utils.getVBO(gl, cubeData.positions)
  cubeBuffer.normal = utils.getVBO(gl, cubeData.normals)
  cubeBuffer.color = utils.getVBO(gl, cubeData.colors)
  cubeBuffer.texCoords = utils.getVBO(gl, cubeData.texCoords)
  cubeBuffer.index = utils.getIBO(gl, cubeData.index)
  cubeBuffer.length = cubeData.index.length

  const sphereData = sphere(64, 64, 1.0, [1.0, 1.0, 1.0, 1.0])

  sphereBuffer.position = utils.getVBO(gl, sphereData.positions)
  sphereBuffer.normal = utils.getVBO(gl, sphereData.normals)
  sphereBuffer.color = utils.getVBO(gl, sphereData.colors)
  sphereBuffer.texCoords = utils.getVBO(gl, sphereData.texCoords)
  sphereBuffer.index = utils.getIBO(gl, sphereData.index)
  sphereBuffer.length = sphereData.index.length

  // ビュー座標変換行列
  vMatrix = Matrix4x4.lookAt(
    new Float32Vector3(0.0, 0.0, 5.0), // 三次元空間を映し出すカメラを置く
    new Float32Vector3(0.0, 0.0, 0.0), // 原点を注視点として見つめる
    new Float32Vector3(0.0, 1.0, 0.0) // カメラの上方向は Y 軸の方向に指定
  )

  // テクスチャ
  const setTextureParameters = () => {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  }
  textureSphere = await utils.getTexture(gl, './img/twinkle_128x128.jpg', setTextureParameters)
  textureCube = await utils.getTexture(gl, './img/water_128x128.jpg', setTextureParameters)
  gl.activeTexture(gl.TEXTURE0)

  // フレームバッファ
  const f = utils.getFrameBuffer(gl, frameBuffer.width, frameBuffer.height)
  frameBuffer.buffer = f.frameBuffer
  frameBuffer.texture = f.texture
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
 */
const drawShape = (data) => {
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

  // モデルの逆行列
  const mInvMatrix = mMatrix.inverse()
  gl.uniformMatrix4fv(program.uMInvMatrix, false, mInvMatrix.values)

  // インデックスを用いた描画命令
  gl.drawElements(gl.TRIANGLES, data.length, gl.UNSIGNED_SHORT, 0)
}

/**
 * canvasに描画する関数
 */
const draw = () => {
  // カウンタをインクリメント
  count++
  // カウンタを元にラジアンを算出
  const rad = ((count % 360) * Math.PI) / 180
  const rad2 = ((count % 720) * Math.PI) / 360

  /* フレームバッファレンダリングの設定 -------------------------- */

  // フレームバッファをバインド
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer.buffer)

  // canvasを初期化
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clearDepth(1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // 平行光源の向き
  gl.uniform3fv(program.uLightDirection, [-1.0, 2.0, 1.0])

  // プロジェクション座標変換行列
  pMatrix = Matrix4x4.perspective({
    fovYRadian: 45, // 視野角を 45 度
    aspectRatio: frameBuffer.width / frameBuffer.height, // アスペクト比は canvas のサイズそのまま
    near: 0.1, // ニアクリップ
    far: 100 // ファークリップ
  })

  pvMatrix = pMatrix.mulByMatrix4x4(vMatrix)

  /* 背景用球体をフレームバッファにレンダリング ---------------------- */

  // テクスチャ
  gl.bindTexture(gl.TEXTURE_2D, textureCube)
  gl.uniform1i(program.uTexture, 0)

  // ライト使用設定
  gl.uniform1i(program.uIsUseLight, false)

  // モデル座標変換行列の生成
  mMatrix = Matrix4x4.identity().scale(50.0, 50.0, 50.0)

  // 描画
  drawShape(sphereBuffer)

  /* 球体をフレームバッファにレンダリング ------------------------- */

  // テクスチャ
  gl.bindTexture(gl.TEXTURE_2D, textureSphere)

  // ライト使用設定
  gl.uniform1i(program.uIsUseLight, true)

  // モデル座標変換行列の生成
  mMatrix = Matrix4x4.identity().rotateY(rad)

  // 描画
  drawShape(sphereBuffer)

  /* 通常レンダリングの設定 -------------------------------- */

  // フレームバッファのバインドを解除
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  // canvasを初期化
  gl.clearColor(0.0, 0.7, 0.7, 1.0)
  gl.clearDepth(1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // 平行光源の向き
  gl.uniform3fv(program.uLightDirection, [-1.0, 0.0, 0.0])

  // プロジェクション座標変換行列
  pMatrix = Matrix4x4.perspective({
    fovYRadian: 45, // 視野角を 45 度
    aspectRatio: canvas.width / canvas.height, // アスペクト比は canvas のサイズそのまま
    near: 0.1, // ニアクリップ
    far: 100 // ファークリップ
  })

  pvMatrix = pMatrix.mulByMatrix4x4(vMatrix)

  /* キューブをレンダリング -------------------------------- */

  // フレームバッファに描き込んだ内容をテクスチャとして適用
  gl.bindTexture(gl.TEXTURE_2D, frameBuffer.texture)

  // モデル座標変換行列の生成
  mMatrix = Matrix4x4.identity().rotateAround(new Float32Vector3(1.0, 1.0, 0.0).normalize(), rad2)

  // 描画
  drawShape(cubeBuffer)

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

  canvas.width = 512
  canvas.height = 512

  gl = utils.getGLContext(canvas)

  // 深度テストを有効にする
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)

  // 適切な順序で関数を呼び出す
  await initProgram()
  await initBuffers()
  render()
}

window.onload = init
