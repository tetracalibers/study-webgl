#version 300 es

in vec3 a_position;
in vec4 a_color;

uniform mat4 u_mvpMatrix;

// フラグメントシェーダに渡す
out vec4 v_Color;

void main() {
  v_Color = a_color;
  gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
}