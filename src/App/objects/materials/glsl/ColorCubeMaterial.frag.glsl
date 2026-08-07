uniform mat4 modelMatrix;
uniform mat4 projectionMatrix;
uniform uint targetOutput;

#if NUM_CLIPPING_PLANES > 0
uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif

varying vec3 localPosition;

out highp vec4 outColor;

const uint TARGET_OUTPUT_COLOR = 0u;
const uint TARGET_OUTPUT_LIT = 1u;
const uint TARGET_OUTPUT_NORMAL = 2u;
const uint TARGET_OUTPUT_STEPS = 3u;
const uint TARGET_OUTPUT_WORLD_POSITION = 4u;
const int MAX_RAY_STEPS = 96;

const vec3 cubeMin = vec3(-0.5);
const vec3 cubeMax = vec3(0.5);

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sceneSdf(vec3 p) {
    return sdBox(p, vec3(0.5));
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
    mat4 inverseModelMatrix = inverse(modelMatrix);
    vec3 rayOrigin = (inverseModelMatrix * vec4(cameraPosition, 1.0)).xyz;
    vec3 rayDirection = normalize(localPosition - rayOrigin);
    vec2 bounds = intersectBox(
        rayOrigin,
        rayDirection,
        cubeMin,
        cubeMax
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

    vec3 worldPoint = (modelMatrix * vec4(p, 1.0)).xyz;

    if (clippedByPlanes(worldPoint)) {
        discard;
    }

    vec3 normal = estimateNormal(p);
    mat3 viewNormalMatrix = transpose(inverse(mat3(viewMatrix * modelMatrix)));
    vec3 viewNormal = normalize(viewNormalMatrix * normal);
    vec3 outputColor = p - cubeMin;

    if (targetOutput == TARGET_OUTPUT_NORMAL) {
        outputColor = viewNormal * 0.5 + 0.5;
    } else if (targetOutput == TARGET_OUTPUT_STEPS) {
        float normalizedSteps = float(stepCount) / float(MAX_RAY_STEPS);
        outputColor = vec3(normalizedSteps);
    } else if (targetOutput == TARGET_OUTPUT_WORLD_POSITION) {
        outputColor = worldPoint;
    }

    vec4 clipPosition = projectionMatrix * viewMatrix * vec4(worldPoint, 1.0);
    gl_FragDepth = clamp(clipPosition.z / clipPosition.w * 0.5 + 0.5, 0.0, 1.0);

    outColor = vec4(outputColor, 1.0);
}
