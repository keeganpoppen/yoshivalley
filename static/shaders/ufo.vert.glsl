#ifdef GL_ES
precision highp float;
#endif
 
uniform mat3 NormalMatrix;
uniform mat4 ModelMatrix;
uniform mat4 ModelViewProjectionMatrix;
 
attribute vec3 a_position;
attribute vec3 a_normal;
 
varying vec3 normal;
varying vec3 worldPosition;
 
void main(void)
{
    vec4 worldPositionTemp = ModelMatrix * vec4(a_position, 1.0);
    worldPosition = worldPositionTemp.xyz;
    gl_Position = ModelViewProjectionMatrix * vec4(a_position, 1.0);
    normal = NormalMatrix * a_normal;
}
