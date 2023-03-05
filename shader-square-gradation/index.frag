#version 300 es

// 全ての浮動小数点型の変数に高い精度を指定
precision highp float;

// Canvas size (width,height)
uniform vec2 u_resolution;

out vec4 outColor;

void main() {
  // フラグメントの座標を描画領域全体のサイズで割ることによって
  // 座標値の範囲が 0.0 から 1.0 の間に収まるため、
  // 簡単にx座標とy座標の値をr（赤）とg（緑）のチャンネルに対応させることができる
  vec2 st = gl_FragCoord.xy/u_resolution;
  
  outColor = vec4(st.x,st.y,0.0,1.0);
}