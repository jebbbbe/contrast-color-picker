import {
    Color,
    DoubleSide,
    GLSL3,
    ShaderLib,
    ShaderMaterial,
    UniformsLib,
    UniformsUtils,
} from "three"

import frag from "./glsl/ColorCubeMaterial.frag.glsl?raw"
import vert from "./glsl/SdfMaterial.vert.glsl?raw"

import type { ColorRepresentation, ShaderMaterialParameters } from "three"

export const ColorCubeTargetOutputColor = 0
export const ColorCubeTargetOutputLit = 1
export const ColorCubeTargetOutputNormal = 2
export const ColorCubeTargetOutputSteps = 3
export const ColorCubeTargetOutputWorldPosition = 4

export const ColorCubeTransformModeDefault = 0
export const ColorCubeTransformModeProtanopia = 1
export const ColorCubeTransformModeDeuteranopia = 2
export const ColorCubeTransformModeTritanopia = 3
export const ColorCubeTransformModeMonochromacy = 4

export type ColorCubeMaterialParameters = ShaderMaterialParameters & {
    contrastRatio?: number
    targetColor?: ColorRepresentation
    useTargetColor?: boolean
    targetOutput?: number
    transformMode?: number
    transformSpaceMode?: number
}

;(UniformsLib as any).colorCube = {
    contrastRatio: { value: 4.5 },
    targetColor: { value: new Color("#ffffff") },
    useTargetColor: { value: false },
    targetOutput: { value: ColorCubeTargetOutputColor },
    transformMode: { value: ColorCubeTransformModeDefault },
    transformSpaceMode: { value: ColorCubeTransformModeDefault },
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

    get targetColor(): Color {
        return this.uniforms.targetColor.value
    }

    set targetColor(value: ColorRepresentation) {
        this.uniforms.targetColor.value.set(value)
    }

    get useTargetColor(): boolean {
        return this.uniforms.useTargetColor.value
    }

    set useTargetColor(value: number | boolean) {
        this.uniforms.useTargetColor.value = Boolean(value)
    }

    get transformMode(): number {
        return this.uniforms.transformMode.value
    }

    set transformMode(value: number) {
        this.uniforms.transformMode.value = Math.max(0, Math.floor(value))
    }

    get transformSpaceMode(): number {
        return this.uniforms.transformSpaceMode.value
    }

    set transformSpaceMode(value: number) {
        this.uniforms.transformSpaceMode.value = Math.max(0, Math.floor(value))
    }

    get contrastRatio(): number {
        return this.uniforms.contrastRatio.value
    }

    set contrastRatio(value: number) {
        this.uniforms.contrastRatio.value = Math.max(1, value)
    }
}

export default ColorCubeMaterial
