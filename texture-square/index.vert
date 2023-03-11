#version 300 es

in vec3 a_position;
in vec4 a_color;
//in vec2 a_textureCoord;

uniform mat4 u_mvpMatrix;

// フラグメントシェーダに渡す
out vec4 v_Color;
///out vec2 v_TextureCoord;

void main() {
  v_Color = a_color;
  //v_TextureCoord = a_textureCoord;
  gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
}
