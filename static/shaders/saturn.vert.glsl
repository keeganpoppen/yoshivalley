#ifdef GL_ES
precision highp float;
#endif
 
uniform   mat4 ModelMatrix;
uniform   mat4 ModelViewProjectionMatrix;
 
attribute vec3 a_position;
 
varying vec3 worldPosition;
varying vec3 modelPosition;
varying vec2 texcoord;
 
void main(void)
{
    vec4 worldPositionTemp = ModelMatrix * vec4(a_position, 1.0);
    worldPosition = worldPositionTemp.xyz;
    gl_Position = ModelViewProjectionMatrix * vec4(a_position, 1.0);
    modelPosition = a_position;
}
