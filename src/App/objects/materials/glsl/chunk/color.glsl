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

vec3 getOppositeLinearColor(vec3 rgb){
	return vec3(1.) - rgb ; 
}

vec3 sRGBToLinear(vec3 c) {
    return mix(
        c / 12.92,
        pow((c + 0.055) / 1.055, vec3(2.4)),
        step(vec3(0.04045), c)
    );
}

vec3 linearToSRGB(vec3 c) {	
    return mix(
        pow(c, vec3(0.41666)) * 1.055 - vec3(0.055),
        c * 12.92,
        vec3(lessThanEqual(c, vec3(0.0031308)))
    );
}

const vec3 lumCoefficients = vec3(0.2126, 0.7152, 0.0722);

float getLuminanceFromSRGB(vec3 sRGB) {
    return dot(sRGBToLinear(sRGB), lumCoefficients);
}

float getContrastRatio(vec3 sRGBsample, float targetLuminance) {
    float sampleLuminance = getLuminanceFromSRGB(sRGBsample);
    float l1 = max(sampleLuminance, targetLuminance);
    float l2 = min(sampleLuminance, targetLuminance);
    return (l1 + 0.05) / (l2 + 0.05);
}

float getContrastRatio(vec3 sRGB1, vec3 sRGB2) {
    float lum1 = getLuminanceFromSRGB(sRGB1);
    float lum2 = getLuminanceFromSRGB(sRGB2);
    float l1 = max(lum1, lum2);
    float l2 = min(lum1, lum2);
    return (l1 + 0.05) / (l2 + 0.05);
}
