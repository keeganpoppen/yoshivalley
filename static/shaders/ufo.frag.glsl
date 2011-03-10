#ifdef GL_ES
precision highp float;
#endif

uniform vec3 sunCenter;
 
varying vec3 worldPosition;
varying vec3 normal;

const float ambient = 0.2;

void main(void)
{
  vec3 N = normalize(normal);
  vec3 L = normalize(worldPosition - sunCenter);
  
  float rd = max(0.0, dot(-L, N)); 
  //gl_FragColor = vec4(vec3(rd + ambient), 1.0);
  gl_FragColor = vec4(1.0);
}
