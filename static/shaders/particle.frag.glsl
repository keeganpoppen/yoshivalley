#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D laserTex;

void main(void) {
    gl_FragColor = texture2D(laserTex, gl_PointCoord);
}
