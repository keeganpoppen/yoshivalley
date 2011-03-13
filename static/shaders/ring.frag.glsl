#ifdef GL_ES
precision highp float;
#endif

varying float alpha;
varying float leader;

uniform sampler2D ringTex;
uniform vec3 color;

void main(void) {
    vec3 c = color;
    if(leader > .5) {
        c = vec3(1.0);
    }
    vec4 texColor = texture2D(ringTex, gl_PointCoord);
    c = c * texColor.r;
    gl_FragColor = vec4(c, texColor.a * alpha);
}
