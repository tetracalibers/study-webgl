#version 300 es

// 全ての浮動小数点型の変数に高い精度を指定
precision highp float;

uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_resolution;

// 頂点シェーダーから受け取る
in vec4 v_Color;

out vec4 outColor;

void main() {
  outColor = v_Color;
}