#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D uTexture;
varying vec2 texcoord;

void main(void)
{
    gl_FragColor = texture2D(uTexture, texcoord);
}
