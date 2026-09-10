out vec3 rayOrigin;
out vec3 rayDirection;

void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    mat4 inverseModelViewMatrix = inverse(modelViewMatrix);
    rayOrigin = (inverseModelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    rayDirection = position - rayOrigin;

    if (isOrthographic) {
        rayOrigin = (inverseModelViewMatrix * vec4(viewPosition.xy, 0.0, 1.0)).xyz;
        rayDirection = (inverseModelViewMatrix * vec4(0.0, 0.0, -1.0, 0.0)).xyz;
    }

    rayDirection = normalize(rayDirection);

    gl_Position = projectionMatrix * viewPosition;
}
