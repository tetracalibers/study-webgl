'use strict'

const init = () => {
  /** @type {HTMLCanvasElement | null} */
  const canvas = document.getElementById('webgl-canvas')

  // canvasの存在を確認
  if (!canvas) {
    console.error('Sorry! No HTML5 Canvas was found on this page.')
    return
  }

  const gl = canvas.getContext('webgl2')

  // コンテキストの存在を確認
  const message = gl
    ? 'Hooray! You got a WebGL2 context'
    : 'Sorry! WebGL is not available'

  alert(message)
}

window.onload = init
