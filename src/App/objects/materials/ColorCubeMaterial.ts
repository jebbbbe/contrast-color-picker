import {
    Color,
    DoubleSide,
    GLSL3,
    Matrix3,
    ShaderLib,
    ShaderMaterial,
    UniformsLib,
    UniformsUtils,
} from "three"

import frag from "./glsl/ColorCubeMaterial.frag.glsl?raw"
import vert from "./glsl/ColorCubeMaterial.vert.glsl?raw"
import * as noop from "./glsl/chunk/registerChunks"

import type { ColorRepresentation, ShaderMaterialParameters } from "three"

function getSRGBLuminance(color: Color): number {
    const linear = color.clone().convertSRGBToLinear()
    return linear.r * 0.2126 + linear.g * 0.7152 + linear.b * 0.0722
}

export const TargetOutputColor = 0
export const TargetOutputLuminance = 1
export const TargetOutputSteps = 3

export const TransformDefault = 0
export const TransformProtanopia = 1
export const TransformDeuteranopia = 2
export const TransformTritanopia = 3
export const TransformMonochromacy = 4
export const TransformCustom = 5

export const RaycastBinarySearch = 0
export const RaycastBracketed = 1
export const RaycastBracketed2 = 2
export const RaycastBracketed3 = 3

export const SearchNone = 0
export const SearchOppositeColor = 1
export const SearchTargetColor = 2
export const SearchBlackAndWhite = 3

export type ColorCubeMaterialParameters = ShaderMaterialParameters & {
    contrastRatio?: number
    quantizeResult?: boolean
    raycastMode?: number
    searchMode?: number
    targetColor?: ColorRepresentation
    whitePoint?: ColorRepresentation
    blackPoint?: ColorRepresentation
    targetOutput?: number
    transformMode?: number
    transformSpaceMatrix?: Matrix3
}
;(UniformsLib as any).colorCube = {
    contrastRatio: { value: 4.5 },
    raycastMode: { value: RaycastBracketed3 },
    searchMode: { value: SearchTargetColor },
    targetColor: { value: new Color("#ffffff") },
    targetLuminance: { value: 1 },
    whitePoint: { value: new Color("#ffffff") },
    whitePointLuminance: { value: 1 },
    blackPoint: { value: new Color("#000000") },
    blackPointLuminance: { value: 0 },
    targetOutput: { value: TargetOutputColor },
    transformMode: { value: TransformDefault },
    transformSpaceMatrix: { value: new Matrix3() },
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
            uniforms: UniformsUtils.clone(
                (ShaderLib as any).colorCube.uniforms
            ),
            vertexShader: (ShaderLib as any).colorCube.vertexShader,
            fragmentShader: (ShaderLib as any).colorCube.fragmentShader,
            side: DoubleSide,
        })

        this.quantizeResult = false
        this.setValues(parameters)
    }

    get targetOutput(): number {
        return this.uniforms.targetOutput.value
    }

    set targetOutput(value: number) {
        this.uniforms.targetOutput.value = Math.max(0, Math.floor(value))
    }

    get quantizeResult(): boolean {
        return Boolean(this.defines?.QUANTIZE_RESULT)
    }

    set quantizeResult(value: boolean) {
        if (value) {
            this.defines = {
                ...this.defines,
                QUANTIZE_RESULT: 1,
            }
        } else if (this.defines?.QUANTIZE_RESULT !== undefined) {
            const { QUANTIZE_RESULT, ...defines } = this.defines
            void QUANTIZE_RESULT
            this.defines = defines
        }

        this.needsUpdate = true
    }

    get raycastMode(): number {
        return this.uniforms.raycastMode.value
    }

    set raycastMode(value: number) {
        this.uniforms.raycastMode.value = Math.max(0, Math.floor(value))
    }

    get searchMode(): number {
        return this.uniforms.searchMode.value
    }

    set searchMode(value: number) {
        this.uniforms.searchMode.value = Math.max(0, Math.floor(value))
    }

    get targetColor(): Color {
        return this.uniforms.targetColor.value
    }

    set targetColor(value: ColorRepresentation) {
        this.uniforms.targetColor.value.set(value).convertLinearToSRGB()
        this.uniforms.targetLuminance.value = getSRGBLuminance(
            this.uniforms.targetColor.value
        )
    }

    get whitePoint(): Color {
        return this.uniforms.whitePoint.value
    }

    set whitePoint(value: ColorRepresentation) {
        this.uniforms.whitePoint.value.set(value).convertLinearToSRGB()
        this.uniforms.whitePointLuminance.value = getSRGBLuminance(
            this.uniforms.whitePoint.value
        )
    }

    get blackPoint(): Color {
        return this.uniforms.blackPoint.value
    }

    set blackPoint(value: ColorRepresentation) {
        this.uniforms.blackPoint.value.set(value).convertLinearToSRGB()
        this.uniforms.blackPointLuminance.value = getSRGBLuminance(
            this.uniforms.blackPoint.value
        )
    }

    get transformMode(): number {
        return this.uniforms.transformMode.value
    }

    set transformMode(value: number) {
        this.uniforms.transformMode.value = Math.max(0, Math.floor(value))
    }

    get transformSpaceMatrix(): Matrix3 {
        return this.uniforms.transformSpaceMatrix.value
    }

    set transformSpaceMatrix(value: Matrix3) {
        this.uniforms.transformSpaceMatrix.value.copy(value).invert()
    }

    get contrastRatio(): number {
        return this.uniforms.contrastRatio.value
    }

    set contrastRatio(value: number) {
        this.uniforms.contrastRatio.value = Math.max(1, value)
    }
}

export default ColorCubeMaterial
