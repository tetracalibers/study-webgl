#version 300 es

in vec3 a_position;
in vec3 a_normal; // 法線
in vec4 a_color;

uniform mat4 u_mvpMatrix;
uniform mat4 u_mInvMatrix; // モデル座標変換行列の逆行列
uniform vec3 u_lightDirection; // 光の向き
uniform vec4 u_ambientColor;

// フラグメントシェーダに渡す
out vec4 v_Color;

void main() {
  // モデルが回転などの座標変換を行なっていても、それと真逆の変換をライトベクトルに適用することで相殺する
  vec3 invLight = normalize(u_mInvMatrix * vec4(u_lightDirection, 0.0)).xyz;
  // ライト係数
  // 0.1 <= dot <= 1.0 の範囲にclamp
  float diffuse = clamp(dot(a_normal, invLight), 0.0, 1.0);
  v_Color = a_color * vec4(vec3(diffuse), 1.0) + u_ambientColor;
  gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
}