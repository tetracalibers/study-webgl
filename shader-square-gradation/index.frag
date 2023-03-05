#version 300 es

// 全ての浮動小数点型の変数に高い精度を指定
precision highp float;

// Canvas size (width,height)
uniform vec2 u_resolution;

out vec4 outColor;

void main() {
  // スクリーン上のピクセルの位置を -1 ～ 1 の範囲に正規化
  // gl_FragCoordには、処理する対象となるピクセルの位置がそのままピクセル単位で入っている
  // これを二倍してスクリーンサイズを引き、それに対してさらにスクリーンサイズによる除算を行う
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
  
  // 色の値として使うために、0 ~ 1 範囲に正規化
  // pは X と Y のいずれも -1 ～ 1 に正規化されているので、
  // 先ほど求めたpに 1 を足して、それを半分にすることで 0 ～ 1 範囲に正規化される
  vec2 color = (vec2(1.0) + p.xy) * 0.5;
  
  outColor = vec4(color,0.0,1.0);
}