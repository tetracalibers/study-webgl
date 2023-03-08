#version 300 es

in vec3 a_position;
in vec3 a_normal; // 法線
in vec4 a_color;

uniform mat4 u_mvpMatrix;

// フラグメントシェーダに渡す
out vec4 v_Color;
out vec3 v_Normal;

void main() {
  v_Normal = a_normal;
  v_Color = a_color;
  gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
}
