attribute vec3 a_position;

//age / alpha-related vars
attribute float a_age_frac;

uniform bool does_age;

uniform float particleSize;

//the alpha value as a result of particle age
varying float age_alpha;

uniform mat4 ModelViewProjectionMatrix;

void main(void) {
    gl_Position = ModelViewProjectionMatrix * vec4(a_position, 1.0);
    gl_PointSize = particleSize;

    if(does_age) {
        if(a_age_frac < .2) {
            age_alpha = 5. * a_age_frac;
        } else if(a_age_frac < .8) {
            age_alpha = 1.;
        } else if(a_age_frac < 1.) {
            age_alpha = 5. * (1. - a_age_frac);
        } else {
            age_alpha = 0.;
        }
    } else {
        age_alpha = 1.;
    }
}
