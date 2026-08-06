uniform vec3 lightPosition;
uniform vec3 surfaceColor;
uniform float sphereRadius;
uniform mat4 projectionMatrix;

varying vec3 worldPosition;
varying vec3 boxCenter;
varying vec3 boxHalfSize;

out highp vec4 outColor;

float sdfSphere(vec3 p) {
    return length(p - boxCenter) - sphereRadius;
}

vec2 intersectBox(vec3 rayOrigin, vec3 rayDirection, vec3 boxMin, vec3 boxMax) {
    vec3 invDirection = 1.0 / rayDirection;
    vec3 tMin = (boxMin - rayOrigin) * invDirection;
    vec3 tMax = (boxMax - rayOrigin) * invDirection;
    vec3 tNear = min(tMin, tMax);
    vec3 tFar = max(tMin, tMax);

    float entry = max(max(tNear.x, tNear.y), tNear.z);
    float exit = min(min(tFar.x, tFar.y), tFar.z);
    return vec2(entry, exit);
}

vec3 estimateNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        sdfSphere(p + e.xyy) - sdfSphere(p - e.xyy),
        sdfSphere(p + e.yxy) - sdfSphere(p - e.yxy),
        sdfSphere(p + e.yyx) - sdfSphere(p - e.yyx)
    ));
}

void main() {
    vec3 rayOrigin = cameraPosition;
    vec3 rayDirection = normalize(worldPosition - rayOrigin);
    vec2 bounds = intersectBox(
        rayOrigin,
        rayDirection,
        boxCenter - boxHalfSize,
        boxCenter + boxHalfSize
    );

    if (bounds.x > bounds.y) {
        discard;
    }

    float t = max(bounds.x, 0.0);
    float exitT = bounds.y;
    vec3 p = rayOrigin;
    bool hit = false;

    for (int i = 0; i < 96; i++) {
        if (t > exitT) {
            break;
        }

        p = rayOrigin + rayDirection * t;
        float distanceToSurface = sdfSphere(p);

        if (distanceToSurface < 0.001) {
            hit = true;
            break;
        }

        t += max(distanceToSurface, 0.0005);
    }

    if (!hit) {
        discard;
    }

    vec3 normal = estimateNormal(p);
    vec3 lightDirection = normalize(lightPosition - p);
    vec3 viewDirection = normalize(cameraPosition - p);
    vec3 halfDirection = normalize(lightDirection + viewDirection);

    float diffuse = max(dot(normal, lightDirection), 0.0);
    float specular = pow(max(dot(normal, halfDirection), 0.0), 32.0);
    vec3 color = surfaceColor * (0.2 + 0.8 * diffuse) + vec3(1.0) * specular * 0.2;

    vec4 clipPosition = projectionMatrix * viewMatrix * vec4(p, 1.0);
    gl_FragDepth = clamp(clipPosition.z / clipPosition.w * 0.5 + 0.5, 0.0, 1.0);

    outColor = vec4(color, 1.0);
}
