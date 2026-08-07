uniform mat4 modelMatrix;
uniform mat4 projectionMatrix;
uniform float contrastRatio;
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
const float MAX_DENSITY = 500000.0;

const vec3 cubeMin = vec3(-0.5);
const vec3 cubeMax = vec3(0.5);

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

vec3 rgb2hsl(vec3 color) {
    float r = color.r;
    float g = color.g;
    float b = color.b;
    float maxc = max(max(r, g), b);
    float minc = min(min(r, g), b);
    float h;
    float s;
    float l = (maxc + minc) * 0.5;

    if (maxc == minc) {
        h = 0.0;
        s = 0.0;
    } else {
        float d = maxc - minc;
        s = l > 0.5 ? d / (2.0 - maxc - minc) : d / (maxc + minc);

        if (maxc == r) {
            h = (g - b) / d + (g < b ? 6.0 : 0.0);
        } else if (maxc == g) {
            h = (b - r) / d + 2.0;
        } else {
            h = (r - g) / d + 4.0;
        }

        h /= 6.0;
    }

    return vec3(h, s, l);
}

float hue2rgb(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0 / 2.0) return q;
    if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
    return p;
}

vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    float r;
    float g;
    float b;

    if (s == 0.0) {
        r = l;
        g = l;
        b = l;
    } else {
        float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
        float p = 2.0 * l - q;
        r = hue2rgb(p, q, h + 1.0 / 3.0);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1.0 / 3.0);
    }

    return vec3(r, g, b);
}

vec3 getOppositeHSLColor(vec3 rgb) {
    vec3 hsl = rgb2hsl(rgb);
    hsl.x = mod(hsl.x + 0.5, 1.0);
    hsl.z = 1.0 - hsl.z;
    return hsl2rgb(hsl);
}

float densityByOppositeContrast(vec3 sampleColor) {
    float luminance = dot(sampleColor, vec3(0.2126, 0.7152, 0.0722));
    vec3 oppositeColor = getOppositeHSLColor(sampleColor);
    float oppositeLuminance = dot(oppositeColor, vec3(0.2126, 0.7152, 0.0722));
    float l1 = max(luminance, oppositeLuminance);
    float l2 = min(luminance, oppositeLuminance);
    float contrastRatioCalc = (l1 + 0.05) / (l2 + 0.05);
    return contrastRatioCalc < contrastRatio ? 0.0 : MAX_DENSITY;
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

vec3 boxNormal(vec3 p) {
    vec3 ap = abs(p);

    if (ap.x > ap.y && ap.x > ap.z) {
        return vec3(sign(p.x), 0.0, 0.0);
    }

    if (ap.y > ap.z) {
        return vec3(0.0, sign(p.y), 0.0);
    }

    return vec3(0.0, 0.0, sign(p.z));
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

    float tStart = max(bounds.x, 0.0);
    float tEnd = bounds.y;
    float dt = (tEnd - tStart) / float(MAX_RAY_STEPS);
    float stepsTaken = 0.0;
    vec3 accumulatedColor = vec3(0.0);
    float accumulatedAlpha = 0.0;
    bool foundDensity = false;
    vec3 firstHitLocalPoint = vec3(0.0);
    vec3 firstHitWorldPoint = vec3(0.0);

    for (int i = 0; i < MAX_RAY_STEPS; i++) {
        stepsTaken += 1.0;

        float t = tStart + float(i) * dt;
        vec3 samplePoint = rayOrigin + rayDirection * t;
        vec3 sampleColor = samplePoint - cubeMin;
        vec3 worldPoint = (modelMatrix * vec4(samplePoint, 1.0)).xyz;

        if (clippedByPlanes(worldPoint)) {
            continue;
        }

        float density = densityByOppositeContrast(sampleColor);

        if (density <= 0.0) {
            continue;
        }

        if (!foundDensity) {
            foundDensity = true;
            firstHitLocalPoint = samplePoint;
            firstHitWorldPoint = worldPoint;
        }

        float alphaStep = 1.0 - exp(-density * dt);
        accumulatedColor += (1.0 - accumulatedAlpha) * sampleColor * alphaStep;
        accumulatedAlpha += (1.0 - accumulatedAlpha) * alphaStep;

        if (accumulatedAlpha >= 0.95) {
            break;
        }
    }

    if (!foundDensity || accumulatedAlpha <= 0.0) {
        discard;
    }

    vec3 normal = boxNormal(firstHitLocalPoint);
    mat3 viewNormalMatrix = transpose(inverse(mat3(viewMatrix * modelMatrix)));
    vec3 viewNormal = normalize(viewNormalMatrix * normal);
    vec3 outputColor = accumulatedColor;

    if (targetOutput == TARGET_OUTPUT_NORMAL) {
        outputColor = viewNormal * 0.5 + 0.5;
    } else if (targetOutput == TARGET_OUTPUT_STEPS) {
        outputColor = vec3(stepsTaken / float(MAX_RAY_STEPS));
    } else if (targetOutput == TARGET_OUTPUT_WORLD_POSITION) {
        outputColor = firstHitWorldPoint;
    }

    vec4 clipPosition = projectionMatrix * viewMatrix * vec4(firstHitWorldPoint, 1.0);
    gl_FragDepth = clamp(clipPosition.z / clipPosition.w * 0.5 + 0.5, 0.0, 1.0);

    outColor = vec4(outputColor, accumulatedAlpha);
}
