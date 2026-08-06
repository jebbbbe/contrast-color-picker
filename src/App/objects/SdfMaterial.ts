import * as THREE from "three"

export class SdfMaterial extends THREE.ShaderMaterial {
    constructor() {
        super({
            name: "SdfMaterial",
            vertexShader: /*glsl*/ `
                varying vec3 vLocalPosition;

                void main() {
                    vLocalPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: /*glsl*/ `
                varying vec3 vLocalPosition;

                float sdf(vec3 p) {
                    return 1.0;
                }

                void main() {
                    float distanceToSurface = sdf(vLocalPosition);
                    vec3 color = vec3(1.0, 0.0, 0.0);
                    gl_FragColor = vec4(color, distanceToSurface * 0.0 + 1.0);
                }
            `,
        })
    }
}

export default SdfMaterial
