#version 300 es

// 全ての浮動小数点型の変数に高い精度を指定
precision highp float;

uniform sampler2D u_texture;

// 頂点シェーダーから受け取る
in vec4 v_Color;
in vec2 v_TextureCoord;

out vec4 outColor;

void main() {
  vec4 smpColor = texture(u_texture, v_TextureCoord);
  // 透明度を調整したのは単なる好み
  outColor = vec4(v_Color.rgb, 0.5) * smpColor;
}
