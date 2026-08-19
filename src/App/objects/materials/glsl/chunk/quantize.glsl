vec3 quantize(vec3 c, float n) {
	float q = pow(2.0, n) - 1.0;
    return floor(clamp(c, 0.0, 1.0) * q + 0.5) / q;
}

vec3 quantize8(vec3 c) {
    return floor(clamp(c, 0.0, 1.0) * 255. + 0.5) / 255.;
}