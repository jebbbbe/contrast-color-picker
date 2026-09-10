uniform mat4 modelMatrix;
uniform mat4 projectionMatrix;
uniform float contrastRatio;
uniform uint raycastMode;
uniform uint searchMode;
uniform vec3 targetColor;
uniform float targetLuminance;
uniform vec3 whitePoint;
uniform float whitePointLuminance;
uniform vec3 blackPoint;
uniform float blackPointLuminance;
uniform uint targetOutput;
uniform uint transformMode;
uniform mat3 transformSpaceMatrix;

in vec3 rayOrigin;
in vec3 rayDirection;
out highp vec4 outColor;
#define gl_FragColor outColor

const uint TARGET_OUTPUT_COLOR = 0u;
const uint TARGET_OUTPUT_LUMINANCE = 1u;
const uint TARGET_OUTPUT_STEPS = 3u;

const uint RAYCAST_BINARY_SEARCH = 0u;
const uint RAYCAST_BRACKETED = 1u;
const uint RAYCAST_BRACKETED2 = 2u;
const uint RAYCAST_BRACKETED3 = 3u;

const uint SEARCH_NONE = 0u;
const uint SEARCH_OPPOSITE_COLOR = 1u;
const uint SEARCH_TARGET_COLOR = 2u;
const uint SEARCH_BLACK_AND_WHITE = 3u;

const int BINARY_SEARCH_STEPS = 10;
const int BRACKET_RAY_STEPS = 24;
const float EPSILON = 0.0001;

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


#include <color_func>
#include <quantize_func>

bool meetsContrastThreshold(vec3 sRGBsample, float targetLuminance) {
    return getContrastRatio(sRGBsample, targetLuminance) >= contrastRatio;
}

bool meetsContrastThreshold(vec3 sRGBsample, vec3 sRGBtarget) {
    return getContrastRatio(sRGBsample, sRGBtarget) >= contrastRatio;
}

bool passesSearchFilter(vec3 sRGBsample) {
    if (searchMode == SEARCH_NONE) {
        return true;
    } else if (searchMode == SEARCH_OPPOSITE_COLOR) {
        return meetsContrastThreshold(sRGBsample, getOppositeLinearColor(sRGBsample));
    } else if (searchMode == SEARCH_TARGET_COLOR) {
        return meetsContrastThreshold(sRGBsample, targetLuminance);
    } else if (searchMode == SEARCH_BLACK_AND_WHITE) {
        return meetsContrastThreshold(sRGBsample, whitePointLuminance) &&
            meetsContrastThreshold(sRGBsample, blackPointLuminance);
    } else {
        return true;
    }
}

vec3 applyVisionTransform(vec3 sampleColor) {
    switch (transformMode) {
        case 0u:
            return sampleColor;
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

bool isInsideTransformedBounds(vec3 pos) {
    mat3 inverseTransformMatrix = transformSpaceMatrix;
    float det = determinant(inverseTransformMatrix);

    if (abs(det) < 0.00001) {
        return true;
    }

    vec3 inversePos = inverseTransformMatrix * pos;

    return
        inversePos.r >= -EPSILON &&
        inversePos.r <= 1.0 + EPSILON &&
        inversePos.g >= -EPSILON &&
        inversePos.g <= 1.0 + EPSILON &&
        inversePos.b >= -EPSILON &&
        inversePos.b <= 1.0 + EPSILON;
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

    mat3 inverseTransformMatrix = transformSpaceMatrix;
    float det = determinant(inverseTransformMatrix);

    if (abs(det) < 0.00001) {
        return cubeBounds;
    }

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

bool sampleHits(vec3 sampleColor) {
    return passesSearchFilter(sampleColor) && isInsideTransformedBounds(sampleColor);
}

vec4 refineRaycastHit(
    vec3 rayOrigin,
    vec3 rayDirection,
    float missT,
    float hitT,
    inout float stepsTaken
) {
    vec3 hitPoint = rayOrigin + rayDirection * hitT;
    vec3 hitColor = hitPoint - cubeMin;

    for (int i = 0; i < BINARY_SEARCH_STEPS; i++) {
        stepsTaken++;

        float midT = (missT + hitT) * 0.5;
        vec3 midPoint = rayOrigin + rayDirection * midT;
        vec3 midColor = midPoint - cubeMin;

        if (sampleHits(midColor)) {
            hitT = midT;
            hitPoint = midPoint;
            hitColor = midColor;
        } else {
            missT = midT;
        }
    }

    return vec4(hitColor, 1.0);
}

// Assumes the ray interval starts outside and ends inside the volume.
// Refines that single miss to hit bracket with binary subdivision only.
// Fastest crisp surface mode, but misses curved volumes without a valid bracket.
vec4 raycastBinarySearch(
    vec3 rayOrigin,
    vec3 rayDirection,
    vec2 bounds,
    inout float stepsTaken
) {
    float tStart = max(bounds.x, 0.0);
    float tEnd = bounds.y;
    vec3 nearPoint = rayOrigin + rayDirection * tStart;
    vec3 nearColor = nearPoint - cubeMin;

    if (sampleHits(nearColor)) {
        return vec4(nearColor, 1.0);
    }

    vec3 farPoint = rayOrigin + rayDirection * tEnd;
    vec3 farColor = farPoint - cubeMin;

    if (!sampleHits(farColor)) {
        discard;
    }

    return refineRaycastHit(
        rayOrigin,
        rayDirection,
        tStart,
        tEnd,
        stepsTaken
    );
}

// Coarsely marches the interval until it finds the first interior hit sample.
// Refines the previous miss to current hit segment with binary subdivision.
// Handles curved volumes better than pure binary search, but can skip thin shells.
vec4 raycastBracketedSearch(
    vec3 rayOrigin,
    vec3 rayDirection,
    vec2 bounds,
    inout float stepsTaken
) {
    float tStart = max(bounds.x, 0.0);
    float tEnd = bounds.y;
    vec3 nearPoint = rayOrigin + rayDirection * tStart;
    vec3 nearColor = nearPoint - cubeMin;

    if (sampleHits(nearColor)) {
        return vec4(nearColor, 1.0);
    }

    float prevT = tStart;

    for (int i = 1; i <= BRACKET_RAY_STEPS; i++) {
        stepsTaken++;

        float currT = mix(tStart, tEnd, float(i) / float(BRACKET_RAY_STEPS));
        vec3 currPoint = rayOrigin + rayDirection * currT;
        vec3 currColor = currPoint - cubeMin;

        if (sampleHits(currColor)) {
            return refineRaycastHit(
                rayOrigin,
                rayDirection,
                prevT,
                currT,
                stepsTaken
            );
        }

        prevT = currT;
    }

    discard;
}

float getBlackAndWhiteMinLuminance() {
    float darkPointLum = min(
        whitePointLuminance,
        blackPointLuminance
    );
    return contrastRatio * (darkPointLum + 0.05) - 0.05;
}

float getBlackAndWhiteMaxLuminance() {
    float lightPointLum = max(
        whitePointLuminance,
        blackPointLuminance
    );
    return (lightPointLum + 0.05) / contrastRatio - 0.05;
}

bool hasBlackAndWhiteMiddleBand() {
    return getBlackAndWhiteMinLuminance() <= getBlackAndWhiteMaxLuminance();
}

int classifyBlackAndWhiteSample(vec3 sRGBsample) {
    if (!hasBlackAndWhiteMiddleBand()) {
        return sampleHits(sRGBsample) ? 0 : -1;
    }

    float lum = getLuminanceFromSRGB(sRGBsample);
    float minLum = getBlackAndWhiteMinLuminance();
    float maxLum = getBlackAndWhiteMaxLuminance();

    if (lum < minLum) {
        return -1;
    }

    if (lum > maxLum) {
        return 1;
    }

    return 0;
}

vec4 refineBlackAndWhiteBoundaryHit(
    vec3 rayOrigin,
    vec3 rayDirection,
    float missT,
    float hitT,
    int missClass,
    inout float stepsTaken
) {
    float minLum = getBlackAndWhiteMinLuminance();
    float maxLum = getBlackAndWhiteMaxLuminance();
    vec3 hitPoint = rayOrigin + rayDirection * hitT;
    vec3 hitColor = hitPoint - cubeMin;

    for (int i = 0; i < BINARY_SEARCH_STEPS; i++) {
        stepsTaken++;

        float midT = (missT + hitT) * 0.5;
        vec3 midPoint = rayOrigin + rayDirection * midT;
        vec3 midColor = midPoint - cubeMin;
        float midLum = getLuminanceFromSRGB(midColor);

        if (
            (missClass < 0 && midLum >= minLum) ||
            (missClass > 0 && midLum <= maxLum)
        ) {
            hitT = midT;
            hitPoint = midPoint;
            hitColor = midColor;
        } else {
            missT = midT;
        }
    }

    return vec4(hitColor, 1.0);
}

// Coarsely marches like Bracketed, but also detects threshold boundary crossings.
// In black and white mode it can refine into a thin valid shell without sampling inside it.
// Best compromise for thin surfaces, at a small extra cost over Bracketed.
vec4 raycastBracketedSearch2(
    vec3 rayOrigin,
    vec3 rayDirection,
    vec2 bounds,
    inout float stepsTaken
) {
    float tStart = max(bounds.x, 0.0);
    float tEnd = bounds.y;
    vec3 prevPoint = rayOrigin + rayDirection * tStart;
    vec3 prevColor = prevPoint - cubeMin;
    bool prevHit = sampleHits(prevColor);

    if (prevHit) {
        return vec4(prevColor, 1.0);
    }

    int prevBlackAndWhiteClass = classifyBlackAndWhiteSample(prevColor);
    float prevT = tStart;

    for (int i = 1; i <= BRACKET_RAY_STEPS; i++) {
        stepsTaken++;

        float currT = mix(tStart, tEnd, float(i) / float(BRACKET_RAY_STEPS));
        vec3 currPoint = rayOrigin + rayDirection * currT;
        vec3 currColor = currPoint - cubeMin;
        bool currHit = sampleHits(currColor);

        if (currHit) {
            return refineRaycastHit(
                rayOrigin,
                rayDirection,
                prevT,
                currT,
                stepsTaken
            );
        }

        if (searchMode == SEARCH_BLACK_AND_WHITE) {
            int currBlackAndWhiteClass = classifyBlackAndWhiteSample(currColor);

            if (
                prevBlackAndWhiteClass != 0 &&
                currBlackAndWhiteClass != prevBlackAndWhiteClass
            ) {
                return refineBlackAndWhiteBoundaryHit(
                    rayOrigin,
                    rayDirection,
                    prevT,
                    currT,
                    prevBlackAndWhiteClass,
                    stepsTaken
                );
            }

            prevBlackAndWhiteClass = currBlackAndWhiteClass;
        }

        prevT = currT;
    }

    discard;
}

int classifyBracketed3Sample(vec3 sampleColor) {
    if (searchMode == SEARCH_BLACK_AND_WHITE && hasBlackAndWhiteMiddleBand()) {
        return classifyBlackAndWhiteSample(sampleColor);
    }

    return sampleHits(sampleColor) ? 0 : -1;
}

vec4 refineBracketed3Hit(
    vec3 rayOrigin,
    vec3 rayDirection,
    float missT,
    float hitT,
    int missClass,
    inout float stepsTaken
) {
    if (
        searchMode == SEARCH_BLACK_AND_WHITE &&
        hasBlackAndWhiteMiddleBand() &&
        missClass != 0
    ) {
        return refineBlackAndWhiteBoundaryHit(
            rayOrigin,
            rayDirection,
            missT,
            hitT,
            missClass,
            stepsTaken
        );
    }

    return refineRaycastHit(
        rayOrigin,
        rayDirection,
        missT,
        hitT,
        stepsTaken
    );
}

// Always refines the first coarse state change it sees along the ray.
// For black and white, a -1 to 1 class change means the thin luminance band was crossed.
// Slightly more work than Bracketed2, but the loop stays simple and consistent.
vec4 raycastBracketedSearch3(
    vec3 rayOrigin,
    vec3 rayDirection,
    vec2 bounds,
    inout float stepsTaken
) {
    float tStart = max(bounds.x, 0.0);
    float tEnd = bounds.y;
    vec3 prevPoint = rayOrigin + rayDirection * tStart;
    vec3 prevColor = prevPoint - cubeMin;
    int prevClass = classifyBracketed3Sample(prevColor);

    if (prevClass == 0) {
        return vec4(prevColor, 1.0);
    }

    float prevT = tStart;

    for (int i = 1; i <= BRACKET_RAY_STEPS; i++) {
        stepsTaken++;

        float currT = mix(tStart, tEnd, float(i) / float(BRACKET_RAY_STEPS));
        vec3 currPoint = rayOrigin + rayDirection * currT;
        vec3 currColor = currPoint - cubeMin;
        int currClass = classifyBracketed3Sample(currColor);

        if (currClass == 0 || currClass != prevClass) {
            return refineBracketed3Hit(
                rayOrigin,
                rayDirection,
                prevT,
                currT,
                prevClass,
                stepsTaken
            );
        }

        prevT = currT;
        prevClass = currClass;
    }

    discard;
}

vec3 quantizeToNearestAcceptableColor(
    vec3 sampleColor,
    inout float stepsTaken
) {
    vec3 quantizedColor = quantize(sampleColor);
    float quantizeScale = float(OUTPUT_QUANTIZE_LEVELS - 1);
    stepsTaken++;

    if (sampleHits(quantizedColor)) {
        return quantizedColor;
    }

    ivec3 quantizedIndex = ivec3(quantizedColor * quantizeScale + 0.5);
    ivec3 maxIndex = ivec3(OUTPUT_QUANTIZE_LEVELS - 1);
    vec3 bestColor = quantizedColor;
    float bestDistance = 0.0;
    bool found = false;

    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            for (int z = -1; z <= 1; z++) {
                if (x == 0 && y == 0 && z == 0) {
                    continue;
                }

                ivec3 candidateIndex = quantizedIndex + ivec3(x, y, z);

                if (
                    any(lessThan(candidateIndex, ivec3(0))) ||
                    any(greaterThan(candidateIndex, maxIndex))
                ) {
                    continue;
                }

                vec3 candidateColor = vec3(candidateIndex) / quantizeScale;
                stepsTaken++;

                if (!sampleHits(candidateColor)) {
                    continue;
                }

                vec3 candidateDelta = candidateColor - sampleColor;
                float candidateDistance = dot(candidateDelta, candidateDelta);

                if (!found || candidateDistance < bestDistance) {
                    bestColor = candidateColor;
                    bestDistance = candidateDistance;
                    found = true;
                }
            }
        }
    }

    return found ? bestColor : quantizedColor;
}

void main() {
    vec3 normalizedRayDirection = normalize(rayDirection);
    float stepsTaken = 0.0;
    float stepCountMax = 0.0;

    vec2 bounds = intersectColorCubeBounds(rayOrigin, normalizedRayDirection);
    if (bounds.x > bounds.y) {
        discard;
    }

    vec4 outputColor;

    // if (raycastMode == RAYCAST_BINARY_SEARCH) {
        // stepCountMax = float(BINARY_SEARCH_STEPS);
        // outputColor = raycastBinarySearch(
            // rayOrigin,
            // normalizedRayDirection,
            // bounds,
            // stepsTaken
        // );
    // } else if (raycastMode == RAYCAST_BRACKETED) {
        // stepCountMax = float(BRACKET_RAY_STEPS + BINARY_SEARCH_STEPS);
        // outputColor = raycastBracketedSearch(
            // rayOrigin,
            // normalizedRayDirection,
            // bounds,
            // stepsTaken
        // );
    // } else if (raycastMode == RAYCAST_BRACKETED2) {
        // stepCountMax = float(BRACKET_RAY_STEPS + BINARY_SEARCH_STEPS);
        // outputColor = raycastBracketedSearch2(
            // rayOrigin,
            // normalizedRayDirection,
            // bounds,
            // stepsTaken
        // );
    // } else if (raycastMode == RAYCAST_BRACKETED3) {
        stepCountMax = float(BRACKET_RAY_STEPS + BINARY_SEARCH_STEPS);
        outputColor = raycastBracketedSearch3(
            rayOrigin,
            normalizedRayDirection,
            bounds,
            stepsTaken
        );
    // } else {
        // stepCountMax = float(BINARY_SEARCH_STEPS);
        // outputColor = raycastBinarySearch(
            // rayOrigin,
            // normalizedRayDirection,
            // bounds,
            // stepsTaken
        // );
    // }

    vec3 outputPosition = (modelMatrix * vec4(outputColor.rgb + cubeMin, 1.0)).xyz;

	#ifdef QUANTIZE_RESULT
    stepCountMax += QUANTIZE_STEP_COUNT_MAX;
    outputColor.rgb = quantizeToNearestAcceptableColor(
		outputColor.rgb,	
		stepsTaken
	);
	 #endif

    outputColor.rgb = applyVisionTransform(outputColor.rgb);

    if (targetOutput == TARGET_OUTPUT_LUMINANCE) {
        outputColor = vec4(vec3(getLuminanceFromSRGB(outputColor.rgb)), outputColor.a);
    } else if (targetOutput == TARGET_OUTPUT_STEPS) {
        outputColor = vec4(vec3(stepsTaken / stepCountMax), outputColor.a);
    }

    vec4 clipPosition = projectionMatrix * viewMatrix * vec4(outputPosition, 1.0);
    gl_FragDepth = clamp(clipPosition.z / clipPosition.w * 0.5 + 0.5, 0.0, 1.0);
    gl_FragColor = outputColor;
}
