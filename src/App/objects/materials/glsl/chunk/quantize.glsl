const int OUTPUT_QUANTIZE_LEVELS = 256;
const float QUANTIZE_STEP_COUNT_MAX = 27.0; // 3*3*3

vec3 quantizeTo(vec3 c, int n) {
	float levels = pow(2.0, float(n));
	vec3 index = min(floor(clamp(c, 0.0, 1.0) * levels), vec3(levels - 1.0));
    return index / (levels - 1.0);
}

vec3 quantize8(vec3 c) {
    return quantizeTo(c, 8);
}

vec3 quantize(vec3 c) {
	return quantize8(c);
	// return quantizeTo(c, 4);
}
