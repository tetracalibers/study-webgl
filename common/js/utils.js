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

export const utils = {
  getCanvas,
  getGLContext,
}
