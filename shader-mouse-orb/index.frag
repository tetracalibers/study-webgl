#version 300 es

// 全ての浮動小数点型の変数に高い精度を指定
precision highp float;

uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_resolution;

out vec4 outColor;

void main() {
  // 0 ～ 1 の範囲で入ってくるマウスカーソル位置を、-1 ～ 1 の範囲に正規化
  // 上方向をプラスにするため、Y座標に関しては正負を逆転する
  vec2 m = vec2(u_mouse.x * 2.0 - 1.0, -u_mouse.y * 2.0 + 1.0);
  
  // スクリーン上のピクセルの位置を -1 ～ 1 の範囲に正規化
  // gl_FragCoordには、処理する対象となるピクセルの位置がそのままピクセル単位で入っている
  // これを二倍してスクリーンサイズを引き、それに対してさらにスクリーンサイズによる除算を行う
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
  
  // length(m - p) = マウス座標と処理ピクセル間の距離
  // 30.0 = 輪と輪の距離を制御
  // 5.0 = アニメーション速度を制御
  float t = sin(30.0 * distance(p, m) + u_time * 5.0);
  
  outColor = vec4(vec3(t), 1.0);
}