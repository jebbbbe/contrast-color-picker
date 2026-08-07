uniform vec3 lightPosition;
uniform vec3 color;
uniform float size;
uniform mat4 modelMatrix;
uniform mat4 projectionMatrix;
uniform uint shape;
uniform uint targetOutput;
uniform bool clipToBounds;

#if NUM_CLIPPING_PLANES > 0
uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif

varying vec3 localPosition;

out highp vec4 outColor;

const uint SHAPE_SPHERE = 0u;
const uint SHAPE_BOX = 1u;
const uint SHAPE_ROUND_BOX = 2u;
const uint SHAPE_CONE = 3u;
const uint SHAPE_SOLID_ANGLE = 4u;
const uint SHAPE_CUT_HOLLOW_SPHERE = 5u;
const uint SHAPE_OCTAHEDRON = 6u;
const uint SHAPE_TRIANGLE = 7u;

const uint TARGET_OUTPUT_COLOR = 0u;
const uint TARGET_OUTPUT_LIT = 1u;
const uint TARGET_OUTPUT_NORMAL = 2u;
const uint TARGET_OUTPUT_STEPS = 3u;
const uint TARGET_OUTPUT_WORLD_POSITION = 4u;
const int MAX_RAY_STEPS = 96;

float dot2(vec3 v) {
    return dot(v, v);
}

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float sdCone(vec3 p, vec2 c, float h) {
    vec2 q = h * vec2(c.x / c.y, -1.0);
    vec2 w = vec2(length(p.xz), p.y);
    vec2 a = w - q * clamp(dot(w, q) / dot(q, q), 0.0, 1.0);
    vec2 b = w - q * vec2(clamp(w.x / q.x, 0.0, 1.0), 1.0);
    float k = sign(q.y);
    float d = min(dot(a, a), dot(b, b));
    float s = max(k * (w.x * q.y - w.y * q.x), k * (w.y - q.y));
    return sqrt(d) * sign(s);
}

float sdSolidAngle(vec3 p, vec2 c, float ra) {
    vec2 q = vec2(length(p.xz), p.y);
    float l = length(q) - ra;
    float m = length(q - c * clamp(dot(q, c), 0.0, ra));
    return max(l, m * sign(c.y * q.x - c.x * q.y));
}

float sdCutHollowSphere(vec3 p, float r, float h, float t) {
    float w = sqrt(r * r - h * h);
    vec2 q = vec2(length(p.xz), p.y);
    return ((h * q.x < w * q.y) ? length(q - vec2(w, h)) : abs(length(q) - r)) - t;
}

float sdOctahedron(vec3 p, float s) {
    p = abs(p);
    float m = p.x + p.y + p.z - s;
    vec3 q;

    if (3.0 * p.x < m) {
        q = p.xyz;
    } else if (3.0 * p.y < m) {
        q = p.yzx;
    } else if (3.0 * p.z < m) {
        q = p.zxy;
    } else {
        return m * 0.57735027;
    }

    float k = clamp(0.5 * (q.z - q.y + s), 0.0, s);
    return length(vec3(q.x, q.y - s + k, q.z - k));
}

float udTriangle(vec3 p, vec3 a, vec3 b, vec3 c) {
    vec3 ba = b - a;
    vec3 pa = p - a;
    vec3 cb = c - b;
    vec3 pb = p - b;
    vec3 ac = a - c;
    vec3 pc = p - c;
    vec3 nor = cross(ba, ac);

    return sqrt(
        (sign(dot(cross(ba, nor), pa)) +
         sign(dot(cross(cb, nor), pb)) +
         sign(dot(cross(ac, nor), pc)) < 2.0)
            ? min(
                  min(
                      dot2(ba * clamp(dot(ba, pa) / dot2(ba), 0.0, 1.0) - pa),
                      dot2(cb * clamp(dot(cb, pb) / dot2(cb), 0.0, 1.0) - pb)
                  ),
                  dot2(ac * clamp(dot(ac, pc) / dot2(ac), 0.0, 1.0) - pc)
              )
            : dot(nor, pa) * dot(nor, pa) / dot2(nor)
    );
}

float bboxSdf(vec3 p) {
    return sdBox(p, vec3(0.5));
}

float shapeSdf(vec3 p) {
    float shapeScale = max(0.001, size) * 0.5;
    vec3 q = p / shapeScale;

    if (shape == SHAPE_BOX) {
        return sdBox(q, vec3(1.0)) * shapeScale;
    }

    if (shape == SHAPE_ROUND_BOX) {
        return sdRoundBox(q, vec3(0.85), 0.15) * shapeScale;
    }

    if (shape == SHAPE_CONE) {
        return sdCone(
            vec3(q.x, q.y - 1.0, q.z),
            normalize(vec2(1.0, 2.0)),
            2.0
        ) * shapeScale;
    }

    if (shape == SHAPE_SOLID_ANGLE) {
        return sdSolidAngle(q, normalize(vec2(1.0, 1.0)), 1.0) * shapeScale;
    }

    if (shape == SHAPE_CUT_HOLLOW_SPHERE) {
        return sdCutHollowSphere(q, 1.0, 0.25, 0.15) * shapeScale;
    }

    if (shape == SHAPE_OCTAHEDRON) {
        return sdOctahedron(q, 1.0) * shapeScale;
    }

    if (shape == SHAPE_TRIANGLE) {
        return (udTriangle(
            q,
            vec3(-1.0, -1.0, 0.0),
            vec3(1.0, -1.0, 0.0),
            vec3(0.0, 1.0, 0.0)
        ) - 0.03) * shapeScale;
    }

    return sdSphere(q, 1.0) * shapeScale;
}

float sceneSdf(vec3 p) {
    float shapeDistance = shapeSdf(p);

    if (clipToBounds == true) {
        return max(shapeDistance, bboxSdf(p));
    }

    return shapeDistance;
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
        vec3(-0.5),
        vec3(0.5)
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
    vec3 lightDirection = normalize(lightPosition - worldPoint);
    vec3 viewDirection = normalize(cameraPosition - worldPoint);
    vec3 halfDirection = normalize(lightDirection + viewDirection);

    float diffuse = max(dot(normal, lightDirection), 0.0);
    float specular = pow(max(dot(normal, halfDirection), 0.0), 32.0);
    vec3 litColor = color * (0.2 + 0.8 * diffuse) + vec3(1.0) * specular * 0.2;
    vec3 outputColor = color;

    if (targetOutput == TARGET_OUTPUT_LIT) {
        outputColor = litColor;
    } else if (targetOutput == TARGET_OUTPUT_NORMAL) {
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
