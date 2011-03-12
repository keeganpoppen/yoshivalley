#ifdef GL_ES
precision highp float;
#endif
 
uniform mat3 NormalMatrix;
uniform mat4 ModelMatrix;
uniform mat4 ViewProjectionMatrix;
uniform bool halfSphere;
 
attribute vec3 a_position;
attribute vec3 a_normal;
 
varying vec3 normal;
varying vec3 worldPosition;
 
void main(void)
{
    vec3 pos = a_position;
    if(halfSphere && a_position.y < 0.0) {
        pos.y = 0.0;
    }
    vec4 worldPositionTemp = ModelMatrix * vec4(pos, 1.0);
    worldPosition = worldPositionTemp.xyz;
    
    gl_Position = ViewProjectionMatrix * vec4(worldPosition, 1.0);
    
    normal = NormalMatrix * a_normal;
}
