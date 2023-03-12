#version 300 es

// 全ての浮動小数点型の変数に高い精度を指定
precision highp float;

uniform sampler2D u_texture;
uniform bool u_isUseTexture;

// 頂点シェーダーから受け取る
in vec4 v_Color;
in vec2 v_TextureCoord;

out vec4 outColor;

void main() {
  vec4 smpColor = vec4(1.0);
  
  if (u_isUseTexture) {
    smpColor = texture(u_texture, v_TextureCoord);
  }
  
  outColor = v_Color * smpColor;
}
