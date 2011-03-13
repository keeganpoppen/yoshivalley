#ifdef GL_ES
precision highp float;
#endif

varying float alpha;
varying float leader;

uniform sampler2D ringTex;
uniform vec3 color;

void main(void) {
    vec4 texColor = texture2D(ringTex, gl_PointCoord);
    vec3 c = color * texColor.r;
    if(leader > .5) {
        c = vec3(c.b, c.r, c.g);
    }
    gl_FragColor = vec4(c, texColor.a * alpha);
}
