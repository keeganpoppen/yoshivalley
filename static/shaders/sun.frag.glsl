#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D surfaceTexture;
varying vec2 texcoord;

void main(void)
{
  vec3 color = texture2D(surfaceTexture, texcoord).rgb;
  gl_FragColor = vec4(color, 1.0);
}
