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

export class SdfColorCube extends THREE.Group {
    readonly mesh: THREE.Mesh<THREE.BoxGeometry, ColorCube.ColorCubeMaterial>
    readonly markers: {
        onClick: Marker
        target: Marker
    }

    private readonly transformSpaceMatrices = transformSpaceMatrices
    private transformSpaceModeValue = ColorCube.TransformDefault

    constructor() {
        super()

        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new ColorCube.ColorCubeMaterial()
        const mesh = new THREE.Mesh(geometry, material)
        const wireframe = new ColorCubeEdges(geometry)
        const targetColorMarker = new Marker(
            material.searchMode === ColorCube.SearchTargetColor,
            material.targetColor
        )
        const onClickMarker = new Marker(
            material.searchMode === ColorCube.SearchTargetColor,
            0x000000
        )

        this.mesh = mesh
        this.markers = {
            onClick: onClickMarker,
            target: targetColorMarker,
        }
        this.transformSpaceMode = ColorCube.TransformDefault
        this.add(mesh, wireframe, ...Object.values(this.markers))
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

export default SdfColorCube
