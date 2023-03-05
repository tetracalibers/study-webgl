#version 300 es

// 全ての浮動小数点型の変数に高い精度を指定
precision highp float;

uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_resolution;

out vec4 outColor;

void main() {
  // スクリーン上のピクセルの位置を -1 ～ 1 の範囲に正規化
  // gl_FragCoordには、処理する対象となるピクセルの位置がそのままピクセル単位で入っている
  // これを二倍してスクリーンサイズを引き、それに対してさらにスクリーンサイズによる除算を行う
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
  
  // 0.5 から減算する処理を用いることによって、
  // スクリーンの中心(原点)から、正負は関係なく純粋に距離が0.5となる場所ほど数値が小さくなる
  float t = 0.02 / abs(0.5 - length(p));
  
  outColor = vec4(vec3(t), 1.0);
}