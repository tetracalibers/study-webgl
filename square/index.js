import { utils } from '../common/js/utils.js'

/** @type {WebGL2RenderingContext | null} */
let gl = null

/**
 * 頂点バッファオブジェクト（VBO）
 * @type {WebGLBuffer | null}
 */
let squareVertexBuffer = null

/**
 * インデックスバッファオブジェクト（IBO）
 * @type {WebGLBuffer | null}
 */
let squareIndexBuffer = null

/**
 * 反時計回りで定義されたインデックス（頂点をどう結ぶか）
 * @type {number[]}
 */
let indices = []

/** @type {WebGLProgram | null} */
let program = null

/**
 * 与えられたidを使用してDOMからシェーダースクリプトの内容を取り出し、
 * コンパイルされたシェーダーを返す関数
 * @param {string} id
 * @return {WebGLShader | null}
 */
const getShader = (id) => {
  /** @type {HTMLScriptElement | null} */
  const script = document.getElementById(id)
  const shaderString = script.text.trim()

  /** @type {WebGLShader | null} */
  let shader

  // シェーダーのタイプに応じたシェーダーを代入
  switch (script.type) {
    case 'x-shader/x-vertex':
      shader = gl.createShader(gl.VERTEX_SHADER)
      break
    case 'x-shader/x-fragment':
      shader = gl.createShader(gl.FRAGMENT_SHADER)
      break
    default:
      return null
  }

  // 与えられたシェーダーコードを使用してシェーダーをコンパイル
  gl.shaderSource(shader, shaderString)
  gl.compileShader(shader)

  // シェーダーに問題がないことを確認
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    return null
  }

  return shader
}

/**
 * 適切な頂点シェーダーとフラグメントシェーダーでプログラムを作成する関数
 */
const initProgram = () => {
  const vertexShader = getShader('vertex-shader')
  const fragmentShader = getShader('fragment-shader')

  // プログラムを作成
  program = gl.createProgram()
  // このプログラムをシェーダーにアタッチ
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Could not initialize shaders')
  }

  // プログラムインスタンスを使用
  gl.useProgram(program)
  // シェーダーの値のロケーションをプログラムインスタンスにアタッチする
  program.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition')
}

/**
 * 正方形のためのバッファを準備する関数
 */
const initBuffers = () => {
  /** 頂点 */
  /*
    V0                    V3
    (-0.5, 0.5, 0)        (0.5, 0.5, 0)
    X---------------------X
    |                     |
    |                     |
    |       (0, 0)        |
    |                     |
    |                     |
    X---------------------X
    V1                    V2
    (-0.5, -0.5, 0)       (0.5, -0.5, 0)
  */
  // prettier-ignore
  const vertices = [
    -0.5, 0.5, 0,  // V0
    -0.5, -0.5, 0, // V1
    0.5, -0.5, 0,  // V2
    0.5, 0.5, 0    // V3
  ];

  // prettier-ignore
  indices = [
    0, 1, 2, // V0, V1, V2 を結ぶ三角形
    0, 2, 3  // V0, V2, V3 を結ぶ三角形
  ]

  squareVertexBuffer = gl.createBuffer()
  // バッファをバインド
  // bindBuffer(バッファの種類, バッファ)
  // ARRAY_BUFFER = 頂点データ
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer)
  // バッファに値を設定
  // bufferData(バッファの種類, 値, 使用法)
  // STATIC_DRAW = バッファのデータは変更されない（一度設定し、何度も利用される）
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  squareIndexBuffer = gl.createBuffer()
  // ELEMENT_ARRAY_BUFFER = インデックスデータ
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer)
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  )

  // バッファを使い終えたらバインドを解除
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
}

/**
 * canvasに描画する関数
 */
const draw = () => {
  // シーンのクリア
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  // VBOをバインド
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer)
  // アトリビュートをバインドされているVBOに関連付ける
  // vertexAttribPointer(index, size, type, normalize, stride, offset)
  // - size ... バインドされているバッファに保存されている頂点ごとの値の数
  // - type ... バッファに保存されている値のデータ型
  // - normalize ... 数値変換するか
  // - stride ... 0なら要素がバッファに順番に保存されていることを示す
  // - offset ... 対応するアトリビュートのために値を読み取り始めるバッファ内の位置
  gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0)
  // アトリビュートの有効化
  gl.enableVertexAttribArray(program.aVertexPosition)

  // IBOをバインド
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer)

  // トライアングルプリミティブを使用してシーンを描画
  // drawElements(mode, count, type, offset)
  // - mode ... 描画するプリミティブの種類
  // - count ... 描画される要素の数
  // - type ... インデックスの値の型
  // - offset ... バッファ内のどの要素が描画の開始点になるか
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)

  // 利用が終わったバッファはバインドを解除
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
}

/**
 * アプリケーションの初期化関数
 */
const init = () => {
  // canvasを取得
  const canvas = utils.getCanvas('webgl-canvas')

  // canvasをスクリーンと同じサイズに設定
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  // WebGLコンテキストを取得
  gl = utils.getGLContext(canvas)
  // クリアカラーを黒に設定
  gl.clearColor(0, 0, 0, 1)

  // 適切な順序で関数を呼び出す
  initProgram()
  initBuffers()
  draw()
}

window.onload = init
