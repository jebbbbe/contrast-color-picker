// upload to https://thebookofshaders.com/edit.php
// visualises contrast for opposite color in a slice of the HSL color cylinder

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

vec3 rgb2hsl(vec3 color) { // rgb to hsl
    float r = color.r, g = color.g, b = color.b;
    float maxc = max(max(r, g), b);
    float minc = min(min(r, g), b);
    float h, s, l = (maxc + minc) * 0.5;

    if (maxc == minc) {
        h = s = 0.0; // achromatic
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
    if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0/2.0) return q;
    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
}

vec3 hsl2rgb(vec3 hsl) { // hsl to rgb
    float h = hsl.x, s = hsl.y, l = hsl.z;
    float r, g, b;

    if (s == 0.0) {
        r = g = b = l; // achromatic
    } else {
        float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
        float p = 2.0 * l - q;
        r = hue2rgb(p, q, h + 1.0/3.0);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1.0/3.0);
    }
    return vec3(r, g, b);
}

vec3 getOppositeHSLColor(vec3 rgb) {    // gets opposite color in hsl colorspace
    vec3 hsl = rgb2hsl(rgb);
    hsl.x = mod(hsl.x + 0.5, 1.0);       // Rotate hue 180°
    hsl.z = 1.0 - hsl.z;                 // Optional: invert luminance
    return hsl2rgb(hsl);
}

const float contrastRatio = 4.5; // target contrast ratio 4.5 for small text, 3 for big text, 7.5 for extras small text. range between 0 and 21. 

float densityByOppositeContrast(vec3 color) {
    color = hsl2rgb(color);
    // Compute relative luminance using sRGB coefficients.
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    // Compute the opposite color (inversion).
    // vec3 oppositeColor = vec3(1.0) - color;
    vec3 oppositeColor = getOppositeHSLColor(color);

    float luminanceOpp = dot(oppositeColor, vec3(0.2126, 0.7152, 0.0722));
    // Determine the higher and lower luminance.
    float L1 = max(luminance, luminanceOpp);
    float L2 = min(luminance, luminanceOpp);
    // Compute contrast ratio as (L1 + 0.05) / (L2 + 0.05).
    float contrastRatioCalc = (L1 + 0.05) / (L2 + 0.05);
    // If the contrast ratio is less than 4.5, set density to zero; otherwise, use a high density.
    return (contrastRatioCalc < contrastRatio) ? 0.0 : 1.0;
}


void main() {
	vec2 st = gl_FragCoord.xy/u_resolution;
	vec3 col = vec3(st,0.);

	float hue = 1.376;
	// hue = mod( (1.- hue)+2. , 1.); // constrain 0,1 range
	hue = clamp(hue,0.0,1.0);

	float oppHue = hue + 0.5;
	if (oppHue > 1.0) oppHue -= 1.0;
	
	vec2 side1 = st;
    side1.x *= 2.;
    side1.x = 1.-side1.x;
	vec2 side2 = st;
	side2.x -= 0.5;
    side2.x *= 2.;

	if(st.x < 0.5){
        col = hsl2rgb(vec3(hue,side1));
    }else{
    	col = hsl2rgb(vec3(oppHue,side2));
    }

	float mask = densityByOppositeContrast(col);
    if(mask == 0.0){
        col = vec3(0.);
    }
	
	gl_FragColor = vec4(col,1.0);
}

