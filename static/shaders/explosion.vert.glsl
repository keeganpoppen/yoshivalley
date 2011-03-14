//the distance that this particle should travel in its lifetime
attribute float maxDist;

//the unit direction vector of this particle / vertex
attribute vec3 particleDirection;

uniform mat4 ModelViewProjectionMatrix;
uniform float particleSize;
uniform float particleAge;
uniform float lifetime;
uniform vec3 origin;

//the alpha as influenced by the age of the particle
varying float age_alpha;

void main(void) {

    float age_frac = particleAge / lifetime;
    float cur_dist = age_frac * maxDist; 

    //the actual position, given how old the particle is
    vec3 position = (particleDirection * cur_dist) + origin;

    gl_Position = ModelViewProjectionMatrix * vec4(position, 1.0);

    gl_PointSize = particleSize / length(gl_Position.xyz);

    //vary the alpha as a function of age
    if(age_frac < .2) {
        age_alpha = 5. * age_frac;
    } else if(age_frac < .8) {
        age_alpha = 1.;
    } else if(age_frac < 1.) {
        age_alpha = 5. * (1. - age_frac);
    } else {
        age_alpha = 0.;
    }
}
