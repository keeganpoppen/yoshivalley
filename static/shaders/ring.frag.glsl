#ifdef GL_ES
precision highp float;
#endif

varying float alpha;
varying float leader;

uniform sampler2D ringTex;

void main(void) {
    vec4 texColor = texture2D(ringTex, gl_PointCoord);
    if(leader > .5) {
        texColor = vec4(texColor.b, texColor.r, texColor.g, texColor.a);
    }
    gl_FragColor = vec4(texColor.rgb, texColor.a * alpha);
}
