#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D s_texture;
 
varying vec3 normal;
varying vec3 eyePosition;
varying vec2 texcoord;
 
void main(void)
{
  vec3 V = normalize(eyePosition);
  vec3 N = normalize(normal);
  vec3 color = texture2D(s_texture, texcoord).rgb;
  float rd = max(0.0, dot(V, N)); 
  gl_FragColor = vec4(rd * color, 1.0);
}
