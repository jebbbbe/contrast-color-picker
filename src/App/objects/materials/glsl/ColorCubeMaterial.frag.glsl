uniform mat4 modelMatrix;
uniform mat4 projectionMatrix;
uniform float contrastRatio;
uniform vec3 targetColor;
uniform bool useTargetColor;
uniform uint targetOutput;
uniform uint transformMode;
uniform uint transformSpaceMode;

varying vec3 localPosition;

out highp vec4 outColor;

const uint TARGET_OUTPUT_COLOR = 0u;
const uint TARGET_OUTPUT_STEPS = 3u;

const uint TRANSFORM_MODE_DEFAULT = 0u;
const uint TRANSFORM_MODE_PROTANOPIA = 1u;
const uint TRANSFORM_MODE_DEUTERANOPIA = 2u;
const uint TRANSFORM_MODE_TRITANOPIA = 3u;
const uint TRANSFORM_MODE_MONOCHROMACY = 4u;

const int MAX_RAY_STEPS = 96;
const float MAX_DENSITY = 500000.0;

const vec3 cubeMin = vec3(-0.5);
const vec3 cubeMax = vec3(0.5);

const mat3 protanopiaMatrix = mat3(
    0.567, 0.558, 0.0,
    0.433, 0.442, 0.242,
    0.0,   0.0,   0.758
);
const mat3 deuteranopiaMatrix = mat3(
    0.625, 0.7, 0.0,
    0.375, 0.3, 0.3,
    0.0,   0.0, 0.7
);
const mat3 tritanopiaMatrix = mat3(
    0.95,  0.433, 0.0,
    0.05,  0.567, 0.475,
    0.0,   0.0,   0.525
);
const mat3 monochromacyMatrix = mat3(
    0.299, 0.299, 0.299,
    0.587, 0.587, 0.587,
    0.114, 0.114, 0.114
);

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
    vec3 contrastTarget = useTargetColor
        ? targetColor
        : getOppositeHSLColor(sampleColor);
    float contrastTargetLuminance = dot(
        contrastTarget,
        vec3(0.2126, 0.7152, 0.0722)
    );
    float l1 = max(luminance, contrastTargetLuminance);
    float l2 = min(luminance, contrastTargetLuminance);
    float contrastRatioCalc = (l1 + 0.05) / (l2 + 0.05);
    return contrastRatioCalc < contrastRatio ? 0.0 : MAX_DENSITY;
}

vec3 applyVisionTransform(vec3 sampleColor) {
    switch (transformMode) {
        case 1u:
            return protanopiaMatrix * sampleColor;
        case 2u:
            return deuteranopiaMatrix * sampleColor;
        case 3u:
            return tritanopiaMatrix * sampleColor;
        case 4u:
            return monochromacyMatrix * sampleColor;
        default:
            return sampleColor;
    }
}

mat3 getTransformSpaceMatrix() {
    switch (transformSpaceMode) {
        case 1u:
            return protanopiaMatrix;
        case 2u:
            return deuteranopiaMatrix;
        case 3u:
            return tritanopiaMatrix;
        case 4u:
            return monochromacyMatrix;
        default:
            return mat3(1.0);
    }
}

float customMat3Density(vec3 pos) {
    mat3 transformMatrix = getTransformSpaceMatrix();
    float det = determinant(transformMatrix);

    if (abs(det) < 0.00001) {
        return MAX_DENSITY;
    }

    vec3 inversePos = inverse(transformMatrix) * pos;

    if (
        inversePos.r >= 0.0 && inversePos.r <= 1.0 &&
        inversePos.g >= 0.0 && inversePos.g <= 1.0 &&
        inversePos.b >= 0.0 && inversePos.b <= 1.0
    ) {
        return MAX_DENSITY;
    }

    return 0.0;
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

vec4 raycastAccumulation(
    vec3 rayOrigin,
    vec3 rayDirection,
    inout vec3 firstHitWorldPoint,
    inout float stepsTaken
) {
    vec4 accumulatedColor = vec4(0.0);

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
    bool foundDensity = false;

    for (int i = 0; i < MAX_RAY_STEPS; i++) {
        stepsTaken += 1.0;

        float t = tStart + float(i) * dt;
        vec3 samplePoint = rayOrigin + rayDirection * t;
        vec3 sampleColor = samplePoint - cubeMin;
        vec3 worldPoint = (modelMatrix * vec4(samplePoint, 1.0)).xyz;

        float density = densityByOppositeContrast(sampleColor);

        density = min(density, customMat3Density(sampleColor));

        if (density <= 0.0) {
            continue;
        }

        if (!foundDensity) {
            foundDensity = true;
            firstHitWorldPoint = worldPoint;
        }

        float alphaStep = 1.0 - exp(-density * dt);
        accumulatedColor.rgb += (1.0 - accumulatedColor.a) * sampleColor * alphaStep;
        accumulatedColor.a += (1.0 - accumulatedColor.a) * alphaStep;

        if (accumulatedColor.a >= 0.95) {
            break;
        }
    }

    if (!foundDensity || accumulatedColor.a <= 0.0) {
        discard;
    }

    return accumulatedColor;
}

void main() {
    mat4 inverseModelMatrix = inverse(modelMatrix);
    vec3 rayOrigin = (inverseModelMatrix * vec4(cameraPosition, 1.0)).xyz;
    vec3 rayDirection = normalize(localPosition - rayOrigin);
    vec3 firstHitWorldPoint = vec3(0.0);
    float stepsTaken = 0.0;

    vec4 outputColor = raycastAccumulation(
        rayOrigin,
        rayDirection,
        firstHitWorldPoint,
        stepsTaken
    );

    if (targetOutput == TARGET_OUTPUT_STEPS) {
        outputColor = vec4(vec3(stepsTaken / float(MAX_RAY_STEPS)), outputColor.a);
    } else {
        outputColor.rgb = applyVisionTransform(outputColor.rgb);
    }

    vec4 clipPosition = projectionMatrix * viewMatrix * vec4(firstHitWorldPoint, 1.0);
    gl_FragDepth = clamp(clipPosition.z / clipPosition.w * 0.5 + 0.5, 0.0, 1.0);

    outColor = outputColor;
}
