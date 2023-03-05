#version 300 es

// 全ての浮動小数点型の変数に高い精度を指定
precision highp float;

// ロードからの時間（秒）
uniform float u_time;

vec3 colorA = vec3(0.149,0.141,0.912);
vec3 colorB = vec3(1.000,0.833,0.224);

out vec4 outColor;

void main() {
  vec3 color = vec3(0.0);

  float pct = abs(sin(u_time));

  // 2つの値をパーセンテージを指定して混ぜ合わせる
  color = mix(colorA, colorB, pct);

  outColor = vec4(color,1.0);
}