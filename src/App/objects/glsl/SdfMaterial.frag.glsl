uniform vec3 lightPosition;
uniform vec3 surfaceColor;
uniform float sphereRadius;
uniform mat4 projectionMatrix;
uniform uint targetOutput;
uniform uint clipToBounds;

#if NUM_CLIPPING_PLANES > 0
uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif

varying vec3 worldPosition;
varying vec3 boxCenter;
varying vec3 boxHalfSize;

out highp vec4 outColor;

const uint TARGET_OUTPUT_COLOR = 0u;
const uint TARGET_OUTPUT_LIT = 1u;
const uint TARGET_OUTPUT_NORMAL = 2u;
const uint TARGET_OUTPUT_STEPS = 3u;
const int MAX_RAY_STEPS = 96;

float sdfSphere(vec3 p) {
    return length(p - boxCenter) - sphereRadius;
}

float sdfBox(vec3 p) {
    vec3 d = abs(p - boxCenter) - boxHalfSize;
    return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

float sceneSdf(vec3 p) {
    float sphere = sdfSphere(p);

    if (clipToBounds == 1u) {
        return max(sphere, sdfBox(p));
    }

    return sphere;
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
        sceneSdf(p + e.xyy) - sceneSdf(p - e.xyy),
        sceneSdf(p + e.yxy) - sceneSdf(p - e.yxy),
        sceneSdf(p + e.yyx) - sceneSdf(p - e.yyx)
    ));
}

#if NUM_CLIPPING_PLANES > 0
bool clippedByPlanes(vec3 worldPoint) {
    vec3 clipPosition = -(viewMatrix * vec4(worldPoint, 1.0)).xyz;

    #pragma unroll_loop_start
    for (int i = 0; i < UNION_CLIPPING_PLANES; i++) {
        vec4 plane = clippingPlanes[i];

        if (dot(clipPosition, plane.xyz) > plane.w) {
            return true;
        }
    }
    #pragma unroll_loop_end

    #if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
    bool clipped = true;

    #pragma unroll_loop_start
    for (int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i++) {
        vec4 plane = clippingPlanes[i];
        clipped = (dot(clipPosition, plane.xyz) > plane.w) && clipped;
    }
    #pragma unroll_loop_end

    if (clipped) {
        return true;
    }
    #endif

    return false;
}
#else
bool clippedByPlanes(vec3 worldPoint) {
    return false;
}
#endif

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
    int stepCount = 0;

    for (int i = 0; i < MAX_RAY_STEPS; i++) {
        if (t > exitT) {
            break;
        }

        stepCount = i + 1;
        p = rayOrigin + rayDirection * t;
        float distanceToSurface = sceneSdf(p);

        if (distanceToSurface < 0.001) {
            hit = true;
            break;
        }

        t += max(distanceToSurface, 0.0005);
    }

    if (!hit) {
        discard;
    }

    if (clippedByPlanes(p)) {
        discard;
    }

    vec3 normal = estimateNormal(p);
    vec3 lightDirection = normalize(lightPosition - p);
    vec3 viewDirection = normalize(cameraPosition - p);
    vec3 halfDirection = normalize(lightDirection + viewDirection);

    float diffuse = max(dot(normal, lightDirection), 0.0);
    float specular = pow(max(dot(normal, halfDirection), 0.0), 32.0);
    vec3 litColor = surfaceColor * (0.2 + 0.8 * diffuse) + vec3(1.0) * specular * 0.2;
    vec3 outputColor = surfaceColor;

    if (targetOutput == TARGET_OUTPUT_LIT) {
        outputColor = litColor;
    } else if (targetOutput == TARGET_OUTPUT_NORMAL) {
        outputColor = normal * 0.5 + 0.5;
    } else if (targetOutput == TARGET_OUTPUT_STEPS) {
        float normalizedSteps = float(stepCount) / float(MAX_RAY_STEPS);
        outputColor = vec3(normalizedSteps);
    }

    vec4 clipPosition = projectionMatrix * viewMatrix * vec4(p, 1.0);
    gl_FragDepth = clamp(clipPosition.z / clipPosition.w * 0.5 + 0.5, 0.0, 1.0);

    outColor = vec4(outputColor, 1.0);
}
