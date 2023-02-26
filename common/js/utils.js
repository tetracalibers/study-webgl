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
  configureControls,
}
