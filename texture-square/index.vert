#version 300 es

in vec3 a_position;
in vec3 a_normal; // 法線
in vec4 a_color;

uniform mat4 u_mvpMatrix;
uniform mat4 u_mInvMatrix; // モデル座標変換行列の逆行列
uniform vec3 u_lightDirection; // 光の向き
uniform vec3 u_eyeDirection; // 視線の方向
uniform vec4 u_ambientColor;

// フラグメントシェーダに渡す
out vec4 v_Color;

void main() {
  // モデルが回転などの座標変換を行なっていても、それと真逆の変換をライトベクトルに適用することで相殺する
  vec3 invLight = normalize(u_mInvMatrix * vec4(u_lightDirection, 0.0)).xyz;
  vec3 invEye = normalize(u_mInvMatrix * vec4(u_eyeDirection, 0.0)).xyz;
  
  // ライトベクトルと視線ベクトルとのハーフベクトル
  vec3 halfLE = normalize(invLight + invEye);
  
  // ライト係数
  // 0.1 <= dot <= 1.0 の範囲にclamp
  float diffuse = clamp(dot(a_normal, invLight), 0.0, 1.0);
  
  // 面法線ベクトルとの内積を取ることで反射光を計算
  // 反射光は強いハイライトを演出するためのものなので、
  // 内積によって得られた結果をべき乗によって収束させることで、
  // 弱い光をさらに弱く、強い光はそのまま残すという具合に変換させる
  float specular = pow(clamp(dot(a_normal, halfLE), 0.0, 1.0), 50.0);
  
  // 反射光は光の強さを直接表す係数として使うので、環境光と同じように加算処理で色成分に加える
  // 色 = 頂点色 * 拡散光 + 反射光 + 環境光
  vec4 light = a_color * vec4(vec3(diffuse), 1.0) + vec4(vec3(specular), 1.0);
  
  v_Color = light + u_ambientColor;
  gl_Position = u_mvpMatrix * vec4(a_position, 1.0);
}
