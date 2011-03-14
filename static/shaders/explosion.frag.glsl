#ifdef GL_ES
precision highp float;
#endif

varying float age_alpha;

uniform sampler2D explosionTex;

void main(void) {
    vec4 texColor = texture2D(explosionTex, gl_PointCoord);
    gl_FragColor = vec4(texColor.rgb, texColor.a * age_alpha);
}
