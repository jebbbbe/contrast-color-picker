void main()	{
    vUv = uv;
    vUv.x -= 0.5;
    vUv.x *= u_aspect;
    vUv.x += 0.5;
    gl_Position = vec4( position, 1.0 );
}