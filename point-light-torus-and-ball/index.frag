#version 300 es

// 全ての浮動小数点型の変数に高い精度を指定
precision highp float;

// 頂点シェーダーから受け取る
in vec4 v_Color;
in vec3 v_Normal;
in vec3 v_Position;

uniform mat4 u_mInvMatrix; // モデル座標変換行列の逆行列
uniform vec3 u_lightPosition; // 点光源の位置
uniform vec3 u_eyeDirection; // 視線の方向
uniform vec4 u_ambientColor;

out vec4 outColor;

// フォンシェーディングはピクセルごとの色の補間処理が必要になるため、
// ライティングの計算を、全てフラグメントシェーダに任せる
void main() {
  // 頂点の位置と点光源の位置を使ってライトベクトルをその都度算出しなければならない
  vec3 lightVec = u_lightPosition - v_Position;
  
  // モデルが回転などの座標変換を行なっていても、それと真逆の変換をライトベクトルに適用することで相殺する
  vec3 invLight = normalize(u_mInvMatrix * vec4(lightVec, 0.0)).xyz;
  vec3 invEye = normalize(u_mInvMatrix * vec4(u_eyeDirection, 0.0)).xyz;
  
  // ライトベクトルと視線ベクトルとのハーフベクトル
  vec3 halfLE = normalize(invLight + invEye);
  
  // ライト係数
  // 0.1 <= dot <= 1.0 の範囲にclamp
  float diffuse = clamp(dot(v_Normal, invLight), 0.0, 1.0) + 0.2;
  
  // 面法線ベクトルとの内積を取ることで反射光を計算
  // 反射光は強いハイライトを演出するためのものなので、
  // 内積によって得られた結果をべき乗によって収束させることで、
  // 弱い光をさらに弱く、強い光はそのまま残すという具合に変換させる
  float specular = pow(clamp(dot(v_Normal, halfLE), 0.0, 1.0), 50.0);
  
  // 反射光は光の強さを直接表す係数として使うので、環境光と同じように加算処理で色成分に加える
  // 色 = 頂点色 * 拡散光 + 反射光 + 環境光
  vec4 light = v_Color * vec4(vec3(diffuse), 1.0) + vec4(vec3(specular), 1.0) + ambientColor;
  
  outColor = light;
}
