#version 300 es

// 全ての浮動小数点型の変数に高い精度を指定
precision highp float;

// 頂点シェーダーから受け取る
in vec4 v_Color;

uniform sampler2D u_texture;
uniform int u_isUseTexture;

out vec4 outColor;

void main() {
  vec4 smpColor = vec4(1.0);
  
  if (bool(u_isUseTexture)) {
    // レンダリングされる点そのものに対してテクスチャを適用するには、
    // 描画される点上のテクスチャ座標gl_PointCoordを使ってテクスチャ座標を設定
    smpColor = texture(u_texture, gl_PointCoord);
  }
  
  if (smpColor.a == 0.0) {
    // フラグメントシェーダは何も出力しない（更新しない）
    discard;
  } else {
    // opacityを0.6にしているのは単なる見た目上のカスタマイズ
    outColor = v_Color * vec4(smpColor.rgb, 0.6);
  }
}
