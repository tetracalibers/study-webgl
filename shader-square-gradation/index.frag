#version 300 es

// 全ての浮動小数点型の変数に高い精度を指定
precision highp float;

// ロードからの時間（秒）
uniform float u_time;

out vec4 outColor;

void main() {
  outColor = vec4(abs(sin(u_time)),0.0,0.0,1.0);
}