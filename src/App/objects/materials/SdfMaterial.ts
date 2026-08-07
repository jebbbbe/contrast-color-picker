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

import frag from "./glsl/SdfMaterial.frag.glsl?raw"
import vert from "./glsl/SdfMaterial.vert.glsl?raw"

import type { ColorRepresentation, ShaderMaterialParameters } from "three"

export const SdfShapeSphere = 0
export const SdfShapeBox = 1
export const SdfShapeRoundBox = 2
export const SdfShapeCone = 3
export const SdfShapeSolidAngle = 4
export const SdfShapeCutHollowSphere = 5
export const SdfShapeOctahedron = 6
export const SdfShapeTriangle = 7

export const SdfTargetOutputColor = 0
export const SdfTargetOutputLit = 1
export const SdfTargetOutputNormal = 2
export const SdfTargetOutputSteps = 3
export const SdfTargetOutputWorldPosition = 4

export type SdfMaterialParameters = ShaderMaterialParameters & {
    lightPosition?: Vector3
    color?: ColorRepresentation
    size?: number
    shape?: number
    targetOutput?: number
    clipToBounds?: boolean
}
;(UniformsLib as any).sdf = {
    lightPosition: { value: new Vector3(4, 6, 8) },
    color: { value: new Color("#ffffff") },
    size: { value: 1.0 },
    shape: { value: SdfShapeSphere },
    targetOutput: { value: SdfTargetOutputColor },
    clipToBounds: { value: 0 },
}
;(ShaderLib as any).sdf = {
    uniforms: UniformsUtils.merge([
        UniformsLib.common,
        UniformsLib.fog,
        (UniformsLib as any).sdf,
    ]),
    vertexShader: vert,
    fragmentShader: frag,
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

    get color(): Color {
        return this.uniforms.color.value
    }

    set color(value: ColorRepresentation) {
        this.uniforms.color.value = value
    }

    get size(): number {
        return this.uniforms.size.value
    }

    set size(value: number) {
        this.uniforms.size.value = Math.max(0.01, value)
    }

    get shape(): number {
        return this.uniforms.shape.value
    }

    set shape(value: number) {
        this.uniforms.shape.value = Math.max(0, Math.floor(value))
    }

    get targetOutput(): number {
        return this.uniforms.targetOutput.value
    }

    set targetOutput(value: number) {
        this.uniforms.targetOutput.value = Math.max(0, Math.floor(value))
    }

    get clipToBounds(): boolean {
        return this.uniforms.clipToBounds.value === 1
    }

    set clipToBounds(value: number | boolean) {
        this.uniforms.clipToBounds.value = value ? 1 : 0
    }
}

export default SdfMaterial
