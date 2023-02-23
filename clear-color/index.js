'use strict'

import { utils } from '../common/js/utils.js'

/** @type {WebGL2RenderingContext | null} */
let gl = null

/**
 * @param {number[]} color
 */
const updateClearColor = (...color) => {
  gl.clearColor(...color)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.viewport(0, 0, 0, 0)
}

/**
 * @param {KeyboardEvent} event
 */
const checkKey = (event) => {
  const key = event.key
  switch (key) {
    case '1':
      // 緑
      updateClearColor(0.2, 0.8, 0.2, 1.0)
      break
    case '2':
      // 青
      updateClearColor(0.2, 0.2, 0.8, 1.0)
      break
    case '3':
      // ランダム色
      updateClearColor(Math.random(), Math.random(), Math.random(), 1.0)
      break
    case '4':
      // 現在のcanvasの色を取得
      const color = gl.getParameter(gl.COLOR_CLEAR_VALUE)
      // 各数値を小数点以下一桁に丸めて表示
      alert(`clearColor = (
        ${color[0].toFixed(1)},
        ${color[1].toFixed(1)},
        ${color[2].toFixed(1)}
      )`)
      window.focus()
      break
    default:
      break
  }
}

const init = () => {
  const canvas = utils.getCanvas('webgl-canvas')
  gl = utils.getGLContext(canvas)

  window.onkeydown = checkKey
}

window.onload = init
