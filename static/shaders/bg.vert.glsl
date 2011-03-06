attribute vec3 a_position;
varying vec2 position;
 
void main(void)
{
    gl_Position = vec4(a_position, 1.0);
    position = a_position.xy;
}
