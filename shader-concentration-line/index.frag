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
  
  float t = atan(p.y, p.x) + u_time;
  t = sin(t * 10.0);
  
  outColor = vec4(vec3(t), 1.0);
}