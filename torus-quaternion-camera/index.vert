#version 300 es

in vec3 a_position;
in vec3 a_normal; // 法線
in vec4 a_color;

uniform mat4 u_mMatrix;
uniform mat4 u_mvpMatrix;

// フラグメントシェーダに渡す
out vec4 v_Color;
out vec3 v_Normal;
out vec3 v_Position; // モデル座標変換を行なったあとの頂点の位置

void main() {
  // 点光源から発された光のライトベクトルは、
  // モデル座標変換を行なったあとの頂点の位置を考慮したものでなければならない
  v_Position = (u_mMatrix * vec4(a_position, 1.0)).xyz;
  v_Normal = a_normal;
  v_Color = a_color;
  gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
}
