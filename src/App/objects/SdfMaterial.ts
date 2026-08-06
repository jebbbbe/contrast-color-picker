import {
    Color,
    FrontSide,
    GLSL3,
    ShaderLib,
    ShaderMaterial,
    UniformsLib,
    UniformsUtils,
    Vector3,
} from "three"

import sdfMaterialFrag from "./glsl/SdfMaterial.frag.glsl?raw"
import sdfMaterialVert from "./glsl/SdfMaterial.vert.glsl?raw"

import type { ColorRepresentation, ShaderMaterialParameters } from "three"

export type SdfMaterialParameters = ShaderMaterialParameters & {
    lightPosition?: Vector3
    surfaceColor?: ColorRepresentation
    sphereRadius?: number
}

;(UniformsLib as any).sdf = {
    lightPosition: { value: new Vector3(4, 6, 8) },
    surfaceColor: { value: new Color("#ef4444") },
    sphereRadius: { value: 0.35 },
}

;(ShaderLib as any).sdf = {
    uniforms: UniformsUtils.merge([
        UniformsLib.common,
        UniformsLib.fog,
        (UniformsLib as any).sdf,
    ]),
    vertexShader: sdfMaterialVert,
    fragmentShader: sdfMaterialFrag,
}

export class SdfMaterial extends ShaderMaterial {
    constructor(parameters: SdfMaterialParameters = {}) {
        super({
            glslVersion: GLSL3,
            uniforms: UniformsUtils.clone((ShaderLib as any).sdf.uniforms),
            vertexShader: (ShaderLib as any).sdf.vertexShader,
            fragmentShader: (ShaderLib as any).sdf.fragmentShader,
            clipping: true,
            side: FrontSide,
        })

        this.setValues(parameters)
    }

    get lightPosition(): Vector3 {
        return this.uniforms.lightPosition.value
    }

    set lightPosition(value: Vector3) {
        this.uniforms.lightPosition.value = value
    }

    get surfaceColor(): Color {
        return this.uniforms.surfaceColor.value
    }

    set surfaceColor(value: ColorRepresentation) {
        this.uniforms.surfaceColor.value = value
    }

    get sphereRadius(): number {
        return this.uniforms.sphereRadius.value
    }

    set sphereRadius(value: number) {
        this.uniforms.sphereRadius.value = value
    }
}

export default SdfMaterial
