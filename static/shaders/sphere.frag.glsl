#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D surfaceTexture;
uniform vec3 planetCenter;
uniform vec3 sunCenter;
 
varying vec3 worldPosition;
varying vec2 texcoord;

const am

void main(void)
{
  vec3 N = normalize(worldPosition - planetCenter);
  vec3 L = normalize(worldPosition - sunCenter);
  
  vec3 color = texture2D(surfaceTexture, texcoord).rgb;
  float rd = max(0.0, dot(L, N)); 
  gl_FragColor = vec4(rd * color, 1.0);
}
