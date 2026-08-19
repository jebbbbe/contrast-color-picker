uniform mat4 modelMatrix;
uniform mat4 projectionMatrix;
uniform float contrastRatio;
uniform uint raycastMode;
uniform uint searchMode;
uniform vec3 targetColor;
uniform uint targetOutput;
uniform uint transformMode;
uniform mat3 transformSpaceMatrix;

in vec3 localPosition;
out highp vec4 outColor;
#define gl_FragColor outColor

const uint TARGET_OUTPUT_COLOR = 0u;
const uint TARGET_OUTPUT_STEPS = 3u;

const uint RAYCAST_ACCUMULATION = 0u;
const uint RAYCAST_BINARY_SEARCH = 1u;

const uint SEARCH_NONE = 0u;
const uint SEARCH_OPPOSITE_COLOR = 1u;
const uint SEARCH_TARGET_COLOR = 2u;
const uint SEARCH_BLACK_AND_WHITE = 3u;

const int MAX_RAY_STEPS = 96;
const float MAX_DENSITY = 500000.0;
const float EPSILON = 0.0001;

const vec3 cubeMin = vec3(-0.5);
const vec3 cubeMax = vec3(0.5);

const vec3 lumCoefficients = vec3(0.2126, 0.7152, 0.0722);

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


#include <color_func>
#include <quantize_func>


float getContrastRatio(vec3 sRGB1, vec3 sRGB2){
    vec3 linear1 = sRGBToLinear(sRGB1);
    vec3 linear2 = sRGBToLinear(sRGB2);
    float lum1 = dot(linear1, lumCoefficients);
    float lum2 = dot(linear2, lumCoefficients);
    float l1 = max(lum1, lum2);
    float l2 = min(lum1, lum2);
    return (l1 + 0.05) / (l2 + 0.05);
}


float densityByContrastTarget(vec3 sampleColor, vec3 bkColor) {
    vec3 sampleColor8 = quantize8(sampleColor);
    vec3 bkColor8 = quantize8(bkColor);
    return getContrastRatio(sampleColor8, bkColor8) < contrastRatio ? 0.0 : MAX_DENSITY;
}

float densityBySearchMode(vec3 sampleColor) {
    if (searchMode == SEARCH_NONE) {
        return MAX_DENSITY;
    } else if (searchMode == SEARCH_TARGET_COLOR) {
		vec3 tc = linearToSRGB(targetColor);
        return densityByContrastTarget(sampleColor, tc);
    } else if (searchMode == SEARCH_BLACK_AND_WHITE) {
        return min(
            densityByContrastTarget(sampleColor, vec3(0.0)),
            densityByContrastTarget(sampleColor, vec3(1.0))
        );
    } else {
        // return densityByContrastTarget(sampleColor, getOppositeHSLColor(sampleColor));
        return densityByContrastTarget(sampleColor, getOppositeLinearColor(sampleColor));
    }
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

float customMat3Density(vec3 pos) {
    mat3 transformMatrix = transformSpaceMatrix;
    float det = determinant(transformMatrix);

    if (abs(det) < 0.00001) {
        return MAX_DENSITY;
    }

    vec3 inversePos = inverse(transformMatrix) * pos;

    if (
        inversePos.r >= -EPSILON &&
        inversePos.r <= 1.0 + EPSILON &&
        inversePos.g >= -EPSILON &&
        inversePos.g <= 1.0 + EPSILON &&
        inversePos.b >= -EPSILON &&
        inversePos.b <= 1.0 + EPSILON
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

vec2 intersectColorCubeBounds(vec3 rayOrigin, vec3 rayDirection) {
    vec2 cubeBounds = intersectBox(rayOrigin, rayDirection, cubeMin, cubeMax);

    mat3 transformMatrix = transformSpaceMatrix;
    float det = determinant(transformMatrix);

    if (abs(det) < 0.00001) {
        return cubeBounds;
    }

    mat3 inverseTransformMatrix = inverse(transformMatrix);
    vec3 colorRayOrigin = rayOrigin - cubeMin;
    vec2 transformBounds = intersectBox(
        inverseTransformMatrix * colorRayOrigin,
        inverseTransformMatrix * rayDirection,
        vec3(0.0),
        vec3(1.0)
    );

    return vec2(
        max(cubeBounds.x, transformBounds.x),
        min(cubeBounds.y, transformBounds.y)
    );
}

vec4 raycastAccumulation(
    vec3 rayOrigin,
    vec3 rayDirection,
    inout vec3 firstHitWorldPoint,
    inout float stepsTaken,
    inout float stepCountMax
) {
    vec4 accumulatedColor = vec4(0.0);
    stepCountMax = float(MAX_RAY_STEPS);

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

        float density = densityBySearchMode(sampleColor);

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
	
	// accumulatedColor.rgb = quantize8(accumulatedColor.rgb);
    return accumulatedColor;
}

bool sampleHits(vec3 sampleColor) {
    return min(
        densityBySearchMode(sampleColor),
        customMat3Density(sampleColor)
    ) > 0.0;
}

vec4 raycastBinarySearch(
    vec3 rayOrigin,
    vec3 rayDirection,
    inout vec3 firstHitWorldPoint,
    inout float stepsTaken,
    inout float stepCountMax
) {
    stepCountMax = 10.0;

    vec2 bounds = intersectColorCubeBounds(rayOrigin, rayDirection);

    if (bounds.x > bounds.y) {
        discard;
    }

    float missT = max(bounds.x, 0.0);
    float hitT = bounds.y;
    vec3 nearPoint = rayOrigin + rayDirection * missT;
    vec3 nearColor = nearPoint - cubeMin;

    if (sampleHits(nearColor)) {
        firstHitWorldPoint = (modelMatrix * vec4(nearPoint, 1.0)).xyz;
        return vec4(nearColor, 1.0);
    }

    vec3 farPoint = rayOrigin + rayDirection * hitT;
    vec3 farColor = farPoint - cubeMin;

    if (!sampleHits(farColor)) {
        discard;
    }

    for (int i = 0; i < 11; i++) {
        stepsTaken += 1.0;

        float midT = (missT + hitT) * 0.5;
        vec3 midPoint = rayOrigin + rayDirection * midT;
        vec3 midColor = midPoint - cubeMin;

        if (sampleHits(midColor)) {
            hitT = midT;
            farPoint = midPoint;
            farColor = midColor;
        } else {
            missT = midT;
        }
    }

    firstHitWorldPoint = (modelMatrix * vec4(farPoint, 1.0)).xyz;
    return vec4(farColor, 1.0);
}

void main() {
    mat4 inverseModelMatrix = inverse(modelMatrix);
    vec3 rayOrigin = (inverseModelMatrix * vec4(cameraPosition, 1.0)).xyz;
    vec3 rayDirection = normalize(localPosition - rayOrigin);
    vec3 firstHitWorldPoint = vec3(0.0);
    float stepsTaken = 0.0;
    float stepCountMax = 1.0;

    vec4 outputColor;

    if (raycastMode == RAYCAST_ACCUMULATION) {
        outputColor = raycastAccumulation(
            rayOrigin,
            rayDirection,
            firstHitWorldPoint,
            stepsTaken,
            stepCountMax
        );
    } else {
        outputColor = raycastBinarySearch(
            rayOrigin,
            rayDirection,
            firstHitWorldPoint,
            stepsTaken,
            stepCountMax
        );
    }

    if (targetOutput == TARGET_OUTPUT_STEPS) {
        outputColor = vec4(vec3(stepsTaken / stepCountMax), outputColor.a);
    } else {
        outputColor.rgb = applyVisionTransform(outputColor.rgb);
    }

    vec4 clipPosition = projectionMatrix * viewMatrix * vec4(firstHitWorldPoint, 1.0);
    gl_FragDepth = clamp(clipPosition.z / clipPosition.w * 0.5 + 0.5, 0.0, 1.0);
    gl_FragColor = outputColor;
    // #include <colorspace_fragment>
}
