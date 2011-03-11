#ifdef GL_ES
precision highp float;
#endif

uniform vec3 sunCenter;
uniform vec3 color;
 
varying vec3 worldPosition;
varying vec3 normal;

const float ambient = 0.2;

void main(void)
{
  vec3 N = normalize(normal);
  vec3 L = normalize(worldPosition - sunCenter);
  
  float rd = max(0.0, dot(-L, N)); 
  gl_FragColor = vec4((ambient + rd) * color, 1.0);
}
