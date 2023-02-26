import { utils } from '../common/js/utils.js'

/** @type {WebGL2RenderingContext | null} */
let gl = null

/** @type {WebGLVertexArrayObject | null} */
let trapezoidVAO = null

/**
 * インデックスバッファオブジェクト（IBO）
 * @type {WebGLBuffer | null}
 */
let trapezoidIndexBuffer = null

/**
 * 反時計回りで定義されたインデックス（頂点をどう結ぶか）
 * @type {number[]}
 */
let indices = []

/** @type {WebGLProgram | null} */
let program = null

/**
 * 現在のレンダリングモードを保持
 * @type {'TRIANGLES' | 'LINES' | 'POINTS' | 'LINE_LOOP' | 'LINE_STRIP' | 'TRIANGLE_FAN' | 'TRIANGLE_STRIP'}
 */
let renderingMode = 'TRIANGLES'

/**
 * 適切な頂点シェーダーとフラグメントシェーダーでプログラムを作成する関数
 */
const initProgram = () => {
  const vertexShader = utils.getShader(gl, 'vertex-shader')
  const fragmentShader = utils.getShader(gl, 'fragment-shader')

  // プログラムを作成
  program = utils.getProgram(gl, vertexShader, fragmentShader)

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
  // prettier-ignore
  const vertices = [
    -0.5, -0.5, 0,
    -0.25, 0.5, 0,
    0.0, -0.5, 0,
    0.25, 0.5, 0,
    0.5, -0.5, 0
  ];

  indices = [0, 1, 2, 0, 2, 3, 2, 3, 4]

  // VAOインスタンス作成
  trapezoidVAO = gl.createVertexArray()
  // バインド
  gl.bindVertexArray(trapezoidVAO)

  const trapezoidVertexBuffer = gl.createBuffer()
  // バッファをバインド
  // bindBuffer(バッファの種類, バッファ)
  // ARRAY_BUFFER = 頂点データ
  gl.bindBuffer(gl.ARRAY_BUFFER, trapezoidVertexBuffer)
  // バッファに値を設定
  // bufferData(バッファの種類, 値, 使用法)
  // STATIC_DRAW = バッファのデータは変更されない（一度設定し、何度も利用される）
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  // draw内で後ほどデータを使用するためにVAOの命令を実行
  // アトリビュートをバインドされているVAOに関連付ける
  // vertexAttribPointer(index, size, type, normalize, stride, offset)
  // - size ... バインドされているバッファに保存されている頂点ごとの値の数
  // - type ... バッファに保存されている値のデータ型
  // - normalize ... 数値変換するか
  // - stride ... 0なら要素がバッファに順番に保存されていることを示す
  // - offset ... 対応するアトリビュートのために値を読み取り始めるバッファ内の位置
  gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(program.aVertexPosition)

  trapezoidIndexBuffer = gl.createBuffer()
  // ELEMENT_ARRAY_BUFFER = インデックスデータ
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, trapezoidIndexBuffer)
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  )

  // バッファを使い終えたらバインドを解除
  gl.bindVertexArray(null)
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

  // VAOをバインド
  gl.bindVertexArray(trapezoidVAO)

  // IBOをバインド
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, trapezoidIndexBuffer)

  // レンダリングモードに応じて設定を変更
  switch (renderingMode) {
    case 'TRIANGLES': {
      indices = [0, 1, 2, 2, 3, 4]
      break
    }
    case 'LINES': {
      indices = [1, 3, 0, 4, 1, 2, 2, 3]
      break
    }
    case 'POINTS': {
      indices = [1, 2, 3]
      break
    }
    case 'LINE_LOOP': {
      indices = [2, 3, 4, 1, 0]
      break
    }
    case 'LINE_STRIP': {
      indices = [2, 3, 4, 1, 0]
      break
    }
    case 'TRIANGLE_STRIP': {
      indices = [0, 1, 2, 3, 4]
      break
    }
    case 'TRIANGLE_FAN': {
      indices = [0, 1, 2, 3, 4]
      break
    }
  }

  // 描画
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  )
  gl.drawElements(gl[renderingMode], indices.length, gl.UNSIGNED_SHORT, 0)

  // 利用が終わったバッファはバインドを解除
  gl.bindVertexArray(null)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)
}

/**
 * 再描画ループのコールバック
 */
const render = () => {
  requestAnimationFrame(render)
  draw()
}

/**
 * GUIコントロール初期化関数
 */
const initControls = () => {
  utils.configureControls({
    'Rendering Mode': {
      value: renderingMode,
      options: [
        'TRIANGLES',
        'TRIANGLE_STRIP',
        'TRIANGLE_FAN',
        'LINES',
        'LINE_LOOP',
        'LINE_STRIP',
        'POINTS',
      ],
      onChange: (v) => (renderingMode = v),
    },
  })
}

/**
 * アプリケーションの初期化関数
 */
const init = () => {
  // canvasを取得
  const canvas = utils.getCanvas('webgl-canvas')

  // canvasをスクリーンと同じサイズに設定
  utils.autoResizeCanvas(canvas)

  // WebGLコンテキストを取得
  gl = utils.getGLContext(canvas)
  // クリアカラーを黒に設定
  gl.clearColor(0, 0, 0, 1)

  // 適切な順序で関数を呼び出す
  initProgram()
  initBuffers()
  render()

  initControls()
}

window.onload = init
