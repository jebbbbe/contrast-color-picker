import {
    DoubleSide,
    GLSL3,
    ShaderLib,
    ShaderMaterial,
    UniformsLib,
    UniformsUtils,
} from "three"

import frag from "./glsl/ColorCubeMaterial.frag.glsl?raw"
import vert from "./glsl/SdfMaterial.vert.glsl?raw"

import type { ShaderMaterialParameters } from "three"

export const ColorCubeTargetOutputColor = 0
export const ColorCubeTargetOutputLit = 1
export const ColorCubeTargetOutputNormal = 2
export const ColorCubeTargetOutputSteps = 3
export const ColorCubeTargetOutputWorldPosition = 4

export type ColorCubeMaterialParameters = ShaderMaterialParameters & {
    contrastRatio?: number
    targetOutput?: number
}

;(UniformsLib as any).colorCube = {
    contrastRatio: { value: 4.5 },
    targetOutput: { value: ColorCubeTargetOutputColor },
}

;(ShaderLib as any).colorCube = {
    uniforms: UniformsUtils.merge([
        UniformsLib.common,
        UniformsLib.fog,
        (UniformsLib as any).colorCube,
    ]),
    vertexShader: vert,
    fragmentShader: frag,
}

export class ColorCubeMaterial extends ShaderMaterial {
    constructor(parameters: ColorCubeMaterialParameters = {}) {
        super({
            glslVersion: GLSL3,
            uniforms: UniformsUtils.clone((ShaderLib as any).colorCube.uniforms),
            vertexShader: (ShaderLib as any).colorCube.vertexShader,
            fragmentShader: (ShaderLib as any).colorCube.fragmentShader,
            clipping: true,
            side: DoubleSide,
        })

        this.setValues(parameters)
    }

    get targetOutput(): number {
        return this.uniforms.targetOutput.value
    }

    set targetOutput(value: number) {
        this.uniforms.targetOutput.value = Math.max(0, Math.floor(value))
    }

    get contrastRatio(): number {
        return this.uniforms.contrastRatio.value
    }

    set contrastRatio(value: number) {
        this.uniforms.contrastRatio.value = Math.max(1, value)
    }
}

export default ColorCubeMaterial
