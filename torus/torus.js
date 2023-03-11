/**
 * HSVAからRGBAへの変換を行う
 *
 * @param {number} h
 * @param {number} s
 * @param {number} v
 * @param {number} a
 * @return {number[]}
 */
const hsvaToRgba = (h, s, v, a) => {
  let colors = []
  const th = h % 360
  // 整数部分と小数部分
  const i = Math.floor(th / 60)
  const F = th / 60 - i
  // よく現れる式を変数化
  const M = v * (1 - s)
  const N = v * (1 - s * F)
  const K = v * (1 - s * (1 - F))
  if (s === 0) {
    colors.push(v, v, v, a)
  } else {
    // rgb値算出
    const r = [v, N, M, M, K, v][i]
    const g = [K, v, v, N, M, M][i]
    const b = [M, M, K, v, v, N][i]
    colors.push(r, g, b, a)
  }

  return colors
}

/**
 * トーラスの頂点データを生成する関数
 * @see https://blog.design-nkt.com/osyare-webgl2/
 *
 * @param {number} crossSectionVerticesCount - 断面円をいくつの頂点で表現するのか
 * @param {number} pipeDivisitionsCount - パイプをいくつの円で分割するのか
 * @param {number} crossSectionRadius - 断面円の半径
 * @param {number} torusRadius - トーラス自体の半径（中心から断面円までの距離）
 */
export const torus = (
  crossSectionVerticesCount,
  pipeDivisitionsCount,
  crossSectionRadius,
  torusRadius
) => {
  const row = crossSectionVerticesCount
  const column = pipeDivisitionsCount
  const csRadius = crossSectionRadius
  const tRadius = torusRadius

  let positions = []
  let colors = []
  let idxs = []

  // 断面円周の頂点の数だけループ
  for (let i = 0; i <= row; i++) {
    // どのくらい回転すれば処理中の頂点に辿り着くか（ラジアン）
    // csは cross section（断面）の略
    const csRad = ((Math.PI * 2) / row) * i
    // 処理中の頂点のxy座標
    const cx = Math.cos(csRad) * csRadius
    const cy = Math.sin(csRad) * csRadius

    // 断面円を並べる数だけループ
    for (let j = 0; j <= column; j++) {
      // どのくらい回転すれば処理中の断面円に辿り着くか（ラジアン）
      // tは torus の略
      const tRad = ((Math.PI * 2) / column) * j
      // 処理中の断面円のxyz座標
      const tx = (cx + tRadius) * Math.cos(tRad)
      const ty = cy
      const tz = (cx + tRadius) * Math.sin(tRad)
      positions.push(tx, ty, tz)

      // 処理中の断面円の色
      const tc = hsvaToRgba((360 / column) * j, 1, 1, 1)
      colors.push(...tc)
    }
  }

  for (let i = 0; i < row; i++) {
    for (let j = 0; j < column; j++) {
      const r = (column + 1) * i + j
      idxs.push(r, r + column + 1, r + 1)
      idxs.push(r + column + 1, r + column + 2, r + 1)
    }
  }

  return {
    positions,
    colors,
    index: idxs
  }
}
