#ifdef GL_ES
precision highp float;
#endif

uniform vec3 sunCenter;
uniform vec3 color;
uniform bool halfSphere;
uniform float shininess;
uniform sampler2D metalTexture;
 
varying vec3 worldPosition;
varying vec3 eyePosition;
varying vec3 normal;
varying vec2 texcoord;

const float ambient = 0.2;

void main(void)
{
  vec3 N = normalize(normal);
  vec3 L = normalize(worldPosition);
  vec3 V = normalize(-eyePosition);
  
  float rd = max(0.0, dot(-L, N)); 
  
  vec3 R = reflect(-L, N);
  float rs = pow( max(0.0, dot(V, R)), shininess);

  vec3 c = color;
  if(!halfSphere) {
    c = c * texture2D(metalTexture, texcoord).rgb;
  }

  gl_FragColor = vec4((ambient + rd + rs) * c, 1.0);
}
