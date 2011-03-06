#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D backgroundTexture;
uniform float repeat;
uniform float aspectRatio;

varying vec2 position;

void main(void)
{
  vec2 texcoord = vec2(mod(position.x * repeat, 1.0),
                       mod(position.y * (repeat / aspectRatio), 1.0));
  vec3 color = texture2D(backgroundTexture, texcoord).rgb;
  gl_FragColor = vec4(0.15 * color, 1.0);
}
