import * as THREE from "three"

import { ColorCubeEdges } from "./ColorCubeEdges"
import { Marker } from "./Marker"
import * as ColorCube from "./materials/ColorCubeMaterial"

/* prettier-ignore */
const transformSpaceMatrices = {
    default:      new THREE.Matrix3(),
    protanopia:   new THREE.Matrix3(0.567, 0.433, 0.000, 0.558, 0.442, 0.000, 0.000, 0.242, 0.758),
    deuteranopia: new THREE.Matrix3(0.625, 0.375, 0.000, 0.700, 0.300, 0.000, 0.000, 0.300, 0.700),
    tritanopia:   new THREE.Matrix3(0.950, 0.050, 0.000, 0.433, 0.567, 0.000, 0.000, 0.475, 0.525),
    monochromacy: new THREE.Matrix3(0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114),
    custom:       new THREE.Matrix3(),
}

export class ColorCubeVolume extends THREE.Group {
    readonly mesh: THREE.Mesh<THREE.BoxGeometry, ColorCube.ColorCubeMaterial>
    readonly wireframe: ColorCubeEdges
    activeMarker: Marker | undefined
    readonly markers: {
        target: Marker
        sample1: Marker
        sample2: Marker
    }

    private readonly transformSpaceMatrices = transformSpaceMatrices
    private transformSpaceModeValue = ColorCube.TransformDefault

    constructor() {
        super()

        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new ColorCube.ColorCubeMaterial()
        this.mesh = new THREE.Mesh(geometry, material)
        this.wireframe = new ColorCubeEdges(geometry)

        const visible = material.searchMode === ColorCube.SearchTargetColor
        this.markers = {
            target: new Marker(visible, material.targetColor1),
            sample1: new Marker(visible, 0x000000),
            sample2: new Marker(false, 0xffffff),
        }
        this.transformSpaceMode = ColorCube.TransformDefault
        this.add(this.mesh, this.wireframe, ...Object.values(this.markers))
    }

    get transformSpaceMode(): number {
        return this.transformSpaceModeValue
    }

    get customTransformSpaceMatrix(): THREE.Matrix3 {
        return this.transformSpaceMatrices.custom
    }

    set transformSpaceMode(value: number) {
        const nextValue = Math.max(0, Math.floor(value))
        let nextMatrix = this.transformSpaceMatrices.default

        if (nextValue === ColorCube.TransformDefault) {
            nextMatrix = this.transformSpaceMatrices.default
        } else if (nextValue === ColorCube.TransformProtanopia) {
            nextMatrix = this.transformSpaceMatrices.protanopia
        } else if (nextValue === ColorCube.TransformDeuteranopia) {
            nextMatrix = this.transformSpaceMatrices.deuteranopia
        } else if (nextValue === ColorCube.TransformTritanopia) {
            nextMatrix = this.transformSpaceMatrices.tritanopia
        } else if (nextValue === ColorCube.TransformMonochromacy) {
            nextMatrix = this.transformSpaceMatrices.monochromacy
        } else if (nextValue === ColorCube.TransformCustom) {
            nextMatrix = this.transformSpaceMatrices.custom
        } else {
            nextMatrix = this.transformSpaceMatrices.default
        }

        this.transformSpaceModeValue = nextValue
        this.mesh.material.transformSpaceMatrix.copy(nextMatrix)
    }
}

export default ColorCubeVolume

/*

export const SearchNone = 0
2 markers
hide 3rd marker


export const SearchOppositeColor 
2 markers
hide 3rd marker
swamp swaps both colors and font sample
clicking sets 1 marker, sets otehr marker to the opposite color

export const SearchTargetColor - FONT
2 markers
hide 3rd marker
materail.target color = background color
click changes font color

export const SearchTargetColor = BACKGROUND
2 markers
hide 3rd marker
materail.target color = font color
click changes background color


export const SearchBlackAndWhite = 3
3 markers
click changes font color

*/
