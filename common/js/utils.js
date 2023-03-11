'use strict'

/**
 * 与えられたidを持つcanvas要素を取り出して返す
 * @param {string} id
 * @return {HTMLCanvasElement | null}
 */
const getCanvas = (id) => {
  const canvas = document.getElementById(id)
  // canvasの存在を確認
  if (!canvas) {
    console.error('Sorry! No HTML5 Canvas was found on this page.')
    return null
  }
  return canvas
}

/**
 * 与えられたcanvas要素のWebGL2コンテキストを返す
 * @param {HTMLCanvasElement} canvas
 * @return {WebGL2RenderingContext | null}
 */
const getGLContext = (canvas) => {
  const ctx = canvas.getContext('webgl2')
  if (!ctx) {
    console.error('WebGL2 is not available on your browser.')
    return null
  }
  return ctx
}

/**
 * ウィンドウが変更されると自動的にリサイズされるように設定する関数
 * @param {HTMLCanvasElement} canvas
 */
const autoResizeCanvas = (canvas) => {
  const expandFullScreen = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  expandFullScreen()
  const observer = new ResizeObserver(expandFullScreen)
  observer.observe(document.body)
}

const loadShader = async (gl, filePath) => {
  const response = await fetch(filePath)
  const shaderString = await response.text()

  /** @type {WebGLShader | null} */
  let shader

  const fileExt = filePath.split('.').at(-1)
  switch (fileExt) {
    case 'frag':
      shader = gl.createShader(gl.FRAGMENT_SHADER)
      break
    case 'vert':
      shader = gl.createShader(gl.VERTEX_SHADER)
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
    gl.deleteShader(shader)
    return null
  }

  return shader
}

/**
 * 与えられたidを使用してDOMからシェーダースクリプトの内容を取り出し、
 * コンパイルされたシェーダーを返す関数
 * @param {WebGL2RenderingContext} gl
 * @param {string} id
 * @return {WebGLShader | null}
 */
const getShader = (gl, id) => {
  /** @type {HTMLScriptElement | null} */
  const script = document.getElementById(id)
  if (!script) return null

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

  // 生成されたシェーダにソースを割り当てる
  gl.shaderSource(shader, shaderString)
  // シェーダをコンパイルする
  gl.compileShader(shader)

  // シェーダが正しくコンパイルされたかチェック
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // 失敗していたら通知し、削除
    console.error(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}

/**
 * プログラムを作成し、返す関数
 * @param {WebGL2RenderingContext} gl
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 */
const getProgram = (gl, vertexShader, fragmentShader) => {
  // プログラムを作成
  const program = gl.createProgram()
  // プログラムオブジェクトにシェーダを割り当てる
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  // シェーダをリンク
  gl.linkProgram(program)

  // シェーダのリンクが正しく行なわれたかチェック
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    // 失敗していたら通知し、削除
    console.error('Could not initialize shaders')
    gl.deleteProgram(program)
    return null
  }

  return program
}

/**
 * VBOを作成し、返す関数
 *
 * @param {WebGL2RenderingContext} gl
 * @param {number[]} vertices
 * @return {WebGLBuffer | null}
 */
const getVBO = (gl, vertices) => {
  // バッファオブジェクトの生成
  const vbo = gl.createBuffer()

  // バッファをバインドする
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)

  // バッファにデータをセット
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  // バッファのバインドを無効化
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  // 生成した VBO を返して終了
  return vbo
}

/**
 * IBOを生成し、返す関数
 * @param {WebGL2RenderingContext} gl
 * @param {number[]} indices
 * @return {WebGLBuffer | null}
 */
const getIBO = (gl, indices) => {
  // バッファオブジェクトの生成
  const ibo = gl.createBuffer()

  // バッファをバインドする
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)

  // バッファにデータをセット
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Int16Array(indices),
    gl.STATIC_DRAW
  )

  // バッファのバインドを無効化
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null)

  // 生成したIBOを返して終了
  return ibo
}

/**
 * テクスチャを生成し、返す非同期関数
 *
 * @param {WebGL2RenderingContext} gl
 * @param {string} source
 * @return {Promise<WebGLTexture | null>}
 */
const getTexture = (gl, source) => {
  const img = new Image()

  const _makeTexture = (img) => {
    // テクスチャオブジェクトの生成
    const tex = gl.createTexture()
    // テクスチャをバインドする
    gl.bindTexture(gl.TEXTURE_2D, tex)
    // テクスチャへイメージを適用
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    // ミップマップを生成
    gl.generateMipmap(gl.TEXTURE_2D)
    // テクスチャのバインドを無効化
    gl.bindTexture(gl.TEXTURE_2D, null)
    // 生成したテクスチャを返す
    return tex
  }

  return new Promise((resolve) => {
    img.onload = () => resolve(_makeTexture(img))
    img.src = source
  })
}

const getLoadImageTexture = (gl, url, render) => {
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 255, 255])
  )

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  const textureInfo = {
    width: 1, // we don't know the size until it loads
    height: 1,
    texture: tex,
  }
  const img = new Image()
  img.addEventListener('load', function () {
    textureInfo.width = img.width
    textureInfo.height = img.height

    gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.generateMipmap(gl.TEXTURE_2D)

    render()
  })
  img.src = url

  return textureInfo
}

/**
 * 頂点属性のバインドと登録を行う関数
 *
 * @param {WebGL2RenderingContext} gl
 * @param {Object} attribute
 * @param {WebGLBuffer} attribute.vbo
 * @param {number} attribute.location
 * @param {number} attribute.stride
 */
const setAttribute = (gl, attribute) => {
  // バッファをバインドする
  gl.bindBuffer(gl.ARRAY_BUFFER, attribute.vbo)

  // attributeLocationを有効にする
  gl.enableVertexAttribArray(attribute.location)

  // attributeLocationを通知し登録する
  gl.vertexAttribPointer(
    attribute.location,
    attribute.stride,
    gl.FLOAT,
    false,
    0,
    0
  )
}

/**
 * lil-guiによるGUIコントロール作成
 * @param {*} settings
 * @param {*} [options={ width: 300 }]
 */
const configureControls = (settings, options = { width: 300 }) => {
  const gui = options.gui || new lil.GUI(options)
  const state = {}

  const isAction = (v) => typeof v === 'function'

  const isFolder = (v) =>
    !isAction(v) &&
    typeof v === 'object' &&
    (v.value === null || v.value === undefined)

  const isColor = (v) =>
    (typeof v === 'string' && ~v.indexOf('#')) ||
    (Array.isArray(v) && v.length >= 3)

  Object.keys(settings).forEach((key) => {
    const settingValue = settings[key]

    if (isAction(settingValue)) {
      state[key] = settingValue
      return gui.add(state, key)
    }
    if (isFolder(settingValue)) {
      return utils.configureControls(settingValue, { gui: gui.addFolder(key) })
    }

    const {
      value,
      min,
      max,
      step,
      options,
      onChange = () => null,
    } = settingValue

    state[key] = value

    let controller

    if (options) {
      controller = gui.add(state, key, options)
    } else if (isColor(value)) {
      controller = gui.addColor(state, key)
    } else {
      controller = gui.add(state, key, min, max, step)
    }

    controller.onChange((v) => onChange(v, state))
  })
}

export const utils = {
  getCanvas,
  getGLContext,
  autoResizeCanvas,
  loadShader,
  getShader,
  getProgram,
  getVBO,
  getIBO,
  getTexture,
  getLoadImageTexture,
  setAttribute,
  configureControls,
}
