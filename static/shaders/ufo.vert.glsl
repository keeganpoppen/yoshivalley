#ifdef GL_ES
precision highp float;
#endif
 
uniform mat3 NormalMatrix;
uniform mat4 ModelMatrix;
uniform mat4 ViewMatrix;
uniform mat4 ProjectionMatrix;
uniform bool halfSphere;
 
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;
 
varying vec3 normal;
varying vec3 worldPosition;
varying vec3 eyePosition;
varying vec2 texcoord;
 
void main(void)
{
    vec3 pos = a_position;
    if(halfSphere && a_position.y < 0.0) {
        pos.y = 0.0;
    }
    vec4 worldPositionTemp = ModelMatrix * vec4(pos, 1.0);
    worldPosition = worldPositionTemp.xyz;

    vec4 eyePositionTemp = ViewMatrix * worldPositionTemp;
    eyePosition = eyePositionTemp.xyz;
    
    gl_Position = ProjectionMatrix * eyePositionTemp;
    
    normal = NormalMatrix * a_normal;
    texcoord = a_texcoord;
}
