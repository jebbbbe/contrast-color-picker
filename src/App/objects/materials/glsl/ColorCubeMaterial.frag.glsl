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
const uint TARGET_OUTPUT_LUMINANCE = 1u;
const uint TARGET_OUTPUT_STEPS = 3u;

const uint RAYCAST_ACCUMULATION = 0u;
const uint RAYCAST_BINARY_SEARCH = 1u;
const uint RAYCAST_BRACKETED = 2u;
const uint RAYCAST_BRACKETED2 = 3u;
const uint RAYCAST_BRACKETED3 = 4u;

const uint SEARCH_NONE = 0u;
const uint SEARCH_OPPOSITE_COLOR = 1u;
const uint SEARCH_TARGET_COLOR = 2u;
const uint SEARCH_BLACK_AND_WHITE = 3u;

const int MAX_RAY_STEPS = 96;
const int BINARY_SEARCH_STEPS = 10;
const int BRACKET_RAY_STEPS = 24;
const float MAX_DENSITY = 500000.0;
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

float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}


#include <color_func>
#include <quantize_func>

float contrastDensity(vec3 sRGB1, vec3 sRGB2) {
    #ifdef QUANTIZE_SEARCH
    sRGB1 = quantize(sRGB1);
    sRGB2 = quantize(sRGB2);
    #endif
    return getContrastRatio(sRGB1, sRGB2) < contrastRatio ? 0.0 : MAX_DENSITY;
}



float densityBySearchMode(vec3 sRGBsample) {
    if (searchMode == SEARCH_NONE) {
        return MAX_DENSITY;
    } else if (searchMode == SEARCH_OPPOSITE_COLOR) {
        return contrastDensity(sRGBsample, getOppositeLinearColor(sRGBsample));
    } else if (searchMode == SEARCH_TARGET_COLOR) {
		vec3 sRGBtarget = linearToSRGB(targetColor);
        return contrastDensity(sRGBsample, sRGBtarget);
    } else if (searchMode == SEARCH_BLACK_AND_WHITE) {
        return min(
            contrastDensity(sRGBsample, vec3(0.0)),
            contrastDensity(sRGBsample, vec3(1.0))
        );
    } else {
        return MAX_DENSITY;
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

// Marches a fixed number of samples through the cube bounds.
// Accumulates color and opacity from every hit sample along the ray.
// Most robust mode, but softer and more expensive than surface search.
vec4 raycastAccumulation(
    vec3 rayOrigin,
    vec3 rayDirection,
    inout vec3 outputPosition,
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
        stepsTaken++;

        float t = tStart + float(i) * dt;
        vec3 samplePoint = rayOrigin + rayDirection * t;
        vec3 sampleColor = samplePoint - cubeMin;

        float density = densityBySearchMode(sampleColor);

        density = min(density, customMat3Density(sampleColor));

        if (density <= 0.0) {
            continue;
        }

        if (!foundDensity) {
            foundDensity = true;
            outputPosition = samplePoint;
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

bool sampleHits(vec3 sampleColor) {
    return min(
        densityBySearchMode(sampleColor),
        customMat3Density(sampleColor)
    ) > 0.0;
}

vec4 refineRaycastHit(
    vec3 rayOrigin,
    vec3 rayDirection,
    float missT,
    float hitT,
    inout vec3 outputPosition,
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

    outputPosition = hitPoint;
    return vec4(hitColor, 1.0);
}

// Assumes the ray interval starts outside and ends inside the volume.
// Refines that single miss to hit bracket with binary subdivision only.
// Fastest crisp surface mode, but misses curved volumes without a valid bracket.
vec4 raycastBinarySearch(
    vec3 rayOrigin,
    vec3 rayDirection,
    inout vec3 outputPosition,
    inout float stepsTaken,
    inout float stepCountMax
) {
    stepCountMax = float(BINARY_SEARCH_STEPS);

    vec2 bounds = intersectColorCubeBounds(rayOrigin, rayDirection);

    if (bounds.x > bounds.y) {
        discard;
    }

    float missT = max(bounds.x, 0.0);
    float hitT = bounds.y;
    vec3 nearPoint = rayOrigin + rayDirection * missT;
    vec3 nearColor = nearPoint - cubeMin;

    if (sampleHits(nearColor)) {
        outputPosition = nearPoint;
        return vec4(nearColor, 1.0);
    }

    vec3 farPoint = rayOrigin + rayDirection * hitT;
    vec3 farColor = farPoint - cubeMin;

    if (!sampleHits(farColor)) {
        discard;
    }

    return refineRaycastHit(
        rayOrigin,
        rayDirection,
        missT,
        hitT,
        outputPosition,
        stepsTaken
    );
}

// Coarsely marches the interval until it finds the first interior hit sample.
// Refines the previous miss to current hit segment with binary subdivision.
// Handles curved volumes better than pure binary search, but can skip thin shells.
vec4 raycastBracketedSearch(
    vec3 rayOrigin,
    vec3 rayDirection,
    inout vec3 outputPosition,
    inout float stepsTaken,
    inout float stepCountMax
) {
    stepCountMax = float(BRACKET_RAY_STEPS + BINARY_SEARCH_STEPS);

    vec2 bounds = intersectColorCubeBounds(rayOrigin, rayDirection);

    if (bounds.x > bounds.y) {
        discard;
    }

    float tStart = max(bounds.x, 0.0);
    float tEnd = bounds.y;
    vec3 nearPoint = rayOrigin + rayDirection * tStart;
    vec3 nearColor = nearPoint - cubeMin;

    if (sampleHits(nearColor)) {
        outputPosition = nearPoint;
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
                outputPosition,
                stepsTaken
            );
        }

        prevT = currT;
    }

    discard;
}

float getBlackAndWhiteMinLuminance() {
    return (contrastRatio - 1.0) / 20.0;
}

float getBlackAndWhiteMaxLuminance() {
    return 1.05 / contrastRatio - 0.05;
}

int classifyBlackAndWhiteSample(vec3 sRGBsample) {
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
    inout vec3 outputPosition,
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

    outputPosition = hitPoint;
    return vec4(hitColor, 1.0);
}

// Coarsely marches like Bracketed, but also detects threshold boundary crossings.
// In black and white mode it can refine into a thin valid shell without sampling inside it.
// Best compromise for thin surfaces, at a small extra cost over Bracketed.
vec4 raycastBracketedSearch2(
    vec3 rayOrigin,
    vec3 rayDirection,
    inout vec3 outputPosition,
    inout float stepsTaken,
    inout float stepCountMax
) {
    stepCountMax = float(BRACKET_RAY_STEPS + BINARY_SEARCH_STEPS);

    vec2 bounds = intersectColorCubeBounds(rayOrigin, rayDirection);

    if (bounds.x > bounds.y) {
        discard;
    }

    float tStart = max(bounds.x, 0.0);
    float tEnd = bounds.y;
    vec3 prevPoint = rayOrigin + rayDirection * tStart;
    vec3 prevColor = prevPoint - cubeMin;
    bool prevHit = sampleHits(prevColor);

    if (prevHit) {
        outputPosition = prevPoint;
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
                outputPosition,
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
                    outputPosition,
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
    if (searchMode == SEARCH_BLACK_AND_WHITE) {
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
    inout vec3 outputPosition,
    inout float stepsTaken
) {
    if (searchMode == SEARCH_BLACK_AND_WHITE && missClass != 0) {
        return refineBlackAndWhiteBoundaryHit(
            rayOrigin,
            rayDirection,
            missT,
            hitT,
            missClass,
            outputPosition,
            stepsTaken
        );
    }

    return refineRaycastHit(
        rayOrigin,
        rayDirection,
        missT,
        hitT,
        outputPosition,
        stepsTaken
    );
}

// Always refines the first coarse state change it sees along the ray.
// For black and white, a -1 to 1 class change means the thin luminance band was crossed.
// Slightly more work than Bracketed2, but the loop stays simple and consistent.
vec4 raycastBracketedSearch3(
    vec3 rayOrigin,
    vec3 rayDirection,
    inout vec3 outputPosition,
    inout float stepsTaken,
    inout float stepCountMax
) {
    stepCountMax = float(BRACKET_RAY_STEPS + BINARY_SEARCH_STEPS);

    vec2 bounds = intersectColorCubeBounds(rayOrigin, rayDirection);

    if (bounds.x > bounds.y) {
        discard;
    }

    float tStart = max(bounds.x, 0.0);
    float tEnd = bounds.y;
    vec3 prevPoint = rayOrigin + rayDirection * tStart;
    vec3 prevColor = prevPoint - cubeMin;
    int prevClass = classifyBracketed3Sample(prevColor);

    if (prevClass == 0) {
        outputPosition = prevPoint;
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
                outputPosition,
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
    inout float stepsTaken,
    inout float stepCountMax
) {
    stepCountMax += float(
        1 +
        (OUTPUT_QUANTIZE_RADIUS * 2 + 1) *
        (OUTPUT_QUANTIZE_RADIUS * 2 + 1) *
        (OUTPUT_QUANTIZE_RADIUS * 2 + 1)
    );

    vec3 quantizedColor = quantize(sampleColor);
    stepsTaken++;

    if (sampleHits(quantizedColor)) {
        return quantizedColor;
    }

    ivec3 baseIndex = getOutputQuantizeIndex(sampleColor);
    vec3 bestColor = quantizedColor;
    float bestDistance = 0.0;
    bool found = false;

    for (int x = -OUTPUT_QUANTIZE_RADIUS; x <= OUTPUT_QUANTIZE_RADIUS; x++) {
        for (int y = -OUTPUT_QUANTIZE_RADIUS; y <= OUTPUT_QUANTIZE_RADIUS; y++) {
            for (int z = -OUTPUT_QUANTIZE_RADIUS; z <= OUTPUT_QUANTIZE_RADIUS; z++) {
                ivec3 candidateIndex = clamp(
                    baseIndex + ivec3(x, y, z),
                    ivec3(0),
                    ivec3(OUTPUT_QUANTIZE_LEVELS - 1)
                );
                vec3 candidateColor = getOutputQuantizeColor(candidateIndex);
                stepsTaken++;

                if (!sampleHits(candidateColor)) {
                    continue;
                }

                float candidateDistance = dot(
                    candidateColor - sampleColor,
                    candidateColor - sampleColor
                );

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
    mat4 inverseModelMatrix = inverse(modelMatrix);
    vec3 rayOrigin = (inverseModelMatrix * vec4(cameraPosition, 1.0)).xyz;
    vec3 rayDirection = normalize(localPosition - rayOrigin);
    vec3 outputPosition = vec3(0.0);
    float stepsTaken = 0.0;
    float stepCountMax = 1.0;

    vec4 outputColor;

    if (raycastMode == RAYCAST_ACCUMULATION) {
        outputColor = raycastAccumulation(
            rayOrigin,
            rayDirection,
            outputPosition,
            stepsTaken,
            stepCountMax
        );
    } else if (raycastMode == RAYCAST_BINARY_SEARCH) {
        outputColor = raycastBinarySearch(
            rayOrigin,
            rayDirection,
            outputPosition,
            stepsTaken,
            stepCountMax
        );
    } else if (raycastMode == RAYCAST_BRACKETED) {
        outputColor = raycastBracketedSearch(
            rayOrigin,
            rayDirection,
            outputPosition,
            stepsTaken,
            stepCountMax
        );
    } else if (raycastMode == RAYCAST_BRACKETED2) {
        outputColor = raycastBracketedSearch2(
            rayOrigin,
            rayDirection,
            outputPosition,
            stepsTaken,
            stepCountMax
        );
    } else if (raycastMode == RAYCAST_BRACKETED3) {
        outputColor = raycastBracketedSearch3(
            rayOrigin,
            rayDirection,
            outputPosition,
            stepsTaken,
            stepCountMax
        );
    } else {
        outputColor = raycastAccumulation(
            rayOrigin,
            rayDirection,
            outputPosition,
            stepsTaken,
            stepCountMax
        );
    }

    outputPosition = (modelMatrix * vec4(outputPosition, 1.0)).xyz;

	/*
	// debug view quantived areas
	vec3 quan = quantizeToNearestAcceptableColor(
		outputColor.rgb,
		stepsTaken,
		stepCountMax
	);
	vec3 quan0 = quantize(outputColor.rgb);
	if (quan == quan0){
		discard;
		// outputColor.a = 0.;
	}
    outputColor.rgb = quan;
	*/


    outputColor.rgb = quantizeToNearestAcceptableColor(
		outputColor.rgb,	
		stepsTaken,
		stepCountMax
	);

    outputColor.rgb = applyVisionTransform(outputColor.rgb);

    if (targetOutput == TARGET_OUTPUT_COLOR) {
    } else if (targetOutput == TARGET_OUTPUT_LUMINANCE) {
        outputColor = vec4(vec3(getLuminanceFromSRGB(outputColor.rgb)), outputColor.a);
    } else if (targetOutput == TARGET_OUTPUT_STEPS) {
        outputColor = vec4(vec3(stepsTaken / stepCountMax), outputColor.a);
    }

    vec4 clipPosition = projectionMatrix * viewMatrix * vec4(outputPosition, 1.0);
    gl_FragDepth = clamp(clipPosition.z / clipPosition.w * 0.5 + 0.5, 0.0, 1.0);
    gl_FragColor = outputColor;
}
