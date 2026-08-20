vec3 quantizeTo(vec3 c, int n) {
	float levels = pow(2., float(n));
	vec3 index = min(floor(clamp(c, 0.0, 1.0) * levels), vec3(levels - 1.0));
    return index / (levels - 1.0);
}

vec3 quantizeTo(vec3 c, float n) {
	float levels = pow(2., n);
	vec3 index = min(floor(clamp(c, 0.0, 1.0) * levels), vec3(levels - 1.0));
    return index / (levels - 1.0);
}

vec3 quantize8(vec3 c) {
	float levels = 256.0;
	vec3 index = min(floor(clamp(c, 0.0, 1.0) * levels), vec3(levels - 1.0));
    return index / (levels - 1.0);
}
