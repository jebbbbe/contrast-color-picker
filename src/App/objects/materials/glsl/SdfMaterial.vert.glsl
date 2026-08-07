varying vec3 localPosition;

void main() {
    localPosition = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
