#ifdef GL_ES
precision highp float;
#endif

uniform vec3 planetCenter;
uniform vec3 sunCenter;
uniform sampler2D ringTexture;
uniform sampler2D ringAlphaTexture;
 
varying vec3 worldPosition;
varying vec3 modelPosition;

const float ambient = 0.2;

void main(void)
{
  float L = length(modelPosition);
  float tpos = (L - 1.1) / 0.8;
  tpos = (1.0-tpos);
  vec3 color = texture2D(ringTexture, vec2(tpos, 0.5)).rgb;
  float alpha = texture2D(ringAlphaTexture, vec2(tpos, 0.5)).r;
  gl_FragColor = vec4(color, alpha);
}
