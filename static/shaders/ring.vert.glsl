uniform mat4 ModelViewProjectionMatrix;

uniform vec3 ufoCenter;

uniform float ringRadius;
uniform float numRingParticles;
uniform float cannonAngle;
uniform float fracCharged;

attribute float index;

varying float alpha;
varying float leader;

void main(void) {
    float angle = index * (6.28318531/numRingParticles) + cannonAngle;
    vec3 displacement = vec3(ringRadius * sin(angle), 0., ringRadius * cos(angle));
    displacement += ufoCenter;

    gl_Position = ModelViewProjectionMatrix * vec4(displacement, 1.);
    gl_PointSize = 5.0;
    if(index < 0.01) gl_PointSize = 25.; 

    if(index < 0.01) {
        gl_PointSize = 25.;
        leader = 1.;
        if(fracCharged > .999) {
            alpha = 1.;
        } else {
            alpha = .2;
        }
    } else {
        gl_PointSize = 5. + (10. * (index / numRingParticles));
        leader = 0.;
        if(index <= fracCharged * numRingParticles) {
            alpha = 1.;
        } else {
            alpha = .2;
        }
    }

    gl_PointSize = 120.0 * gl_PointSize / length(gl_Position.xyz);
}
