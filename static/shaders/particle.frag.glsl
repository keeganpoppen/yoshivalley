#ifdef GL_ES
precision highp float;
#endif

//the alpha value as a result of particle age
varying float age_alpha;

uniform sampler2D laserTex;

void main(void) {
    vec4 texColor = texture2D(laserTex, gl_PointCoord);
    gl_FragColor = vec4(texColor.rgb, texColor.a * age_alpha);
}
