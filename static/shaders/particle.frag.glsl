#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D laserTex;

void main(void) {
    vec4 texColor = texture2D(laserTex, gl_PointCoord);
    gl_FragColor = texColor;
}
