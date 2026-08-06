varying vec3 worldPosition;
varying vec3 boxCenter;
varying vec3 boxHalfSize;

void main() {
    worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    boxCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    boxHalfSize = vec3(
        length(modelMatrix[0].xyz),
        length(modelMatrix[1].xyz),
        length(modelMatrix[2].xyz)
    ) * 0.5;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
