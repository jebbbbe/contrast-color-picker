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
import vert from "./glsl/SdfMaterial.vert.glsl?raw"
import * as noop from "./glsl/chunk/registerChunks"

import type { ColorRepresentation, ShaderMaterialParameters } from "three"

export const TargetOutputColor = 0
export const TargetOutputLuminance = 1
export const TargetOutputSteps = 3

export const TransformDefault = 0
export const TransformProtanopia = 1
export const TransformDeuteranopia = 2
export const TransformTritanopia = 3
export const TransformMonochromacy = 4
export const TransformCustom = 5

export const RaycastAccumulation = 0
export const RaycastBinarySearch = 1
export const RaycastBracketed = 2
export const RaycastBracketed2 = 3

export const SearchNone = 0
export const SearchOppositeColor = 1
export const SearchTargetColor = 2
export const SearchBlackAndWhite = 3

export type ColorCubeMaterialParameters = ShaderMaterialParameters & {
    contrastRatio?: number
    quantizeSearch?: boolean
    raycastMode?: number
    searchMode?: number
    targetColor?: ColorRepresentation
    targetOutput?: number
    transformMode?: number
    transformSpaceMatrix?: Matrix3
}
;(UniformsLib as any).colorCube = {
    contrastRatio: { value: 4.5 },
    raycastMode: { value: RaycastBracketed2 },
    searchMode: { value: SearchTargetColor },
    targetColor: { value: new Color("#ffffff") }, // "#7f7f7f"
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

        this.quantizeSearch = false
        this.setValues(parameters)
    }

    get targetOutput(): number {
        return this.uniforms.targetOutput.value
    }

    set targetOutput(value: number) {
        this.uniforms.targetOutput.value = Math.max(0, Math.floor(value))
    }

    get quantizeSearch(): boolean {
        return Boolean(this.defines?.QUANTIZE_SEARCH)
    }

    set quantizeSearch(value: boolean) {
        if (value) {
            this.defines = {
                ...this.defines,
                QUANTIZE_SEARCH: 1,
            }
        } else if (this.defines?.QUANTIZE_SEARCH !== undefined) {
            const { QUANTIZE_SEARCH, ...defines } = this.defines
            void QUANTIZE_SEARCH
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
        this.uniforms.targetColor.value.set(value)
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
        this.uniforms.transformSpaceMatrix.value.copy(value)
    }

    get contrastRatio(): number {
        return this.uniforms.contrastRatio.value
    }

    set contrastRatio(value: number) {
        this.uniforms.contrastRatio.value = Math.max(1, value)
    }
}

export default ColorCubeMaterial
