import * as THREE from "three"

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
    readonly material: ColorCube.ColorCubeMaterial

    private readonly targetColorMarker: THREE.Mesh<
        THREE.SphereGeometry,
        THREE.MeshBasicMaterial
    >

    private readonly transformSpaceMatrices = transformSpaceMatrices
    private transformSpaceModeValue = ColorCube.TransformDefault

    constructor() {
        super()

        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new ColorCube.ColorCubeMaterial()
        const mesh = new THREE.Mesh(geometry, material)
        const edges = new THREE.EdgesGeometry(geometry)
        const edgePositions = edges.getAttribute("position")
        const edgeColors = edgePositions.array.slice() as Float32Array

        for (let i = 0; i < edgeColors.length; i++) {
            edgeColors[i] += 0.5
        }

        edges.setAttribute("color", new THREE.BufferAttribute(edgeColors, 3))

        const wireframe = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ vertexColors: true })
        )
        const targetColorMarker = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 16, 16),
            new THREE.MeshBasicMaterial({
                fog: false,
                vertexColors: false,
                transparent: false,
            })
        )

        mesh.onBeforeRender = () => {
            this.syncTargetColorMarker()
        }

        this.material = material
        this.targetColorMarker = targetColorMarker
        this.transformSpaceMode = ColorCube.TransformDefault
        this.syncTargetColorMarker()
        this.add(mesh, wireframe, targetColorMarker)
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

        if (nextValue === ColorCube.TransformProtanopia) {
            nextMatrix = this.transformSpaceMatrices.protanopia
        } else if (nextValue === ColorCube.TransformDeuteranopia) {
            nextMatrix = this.transformSpaceMatrices.deuteranopia
        } else if (nextValue === ColorCube.TransformTritanopia) {
            nextMatrix = this.transformSpaceMatrices.tritanopia
        } else if (nextValue === ColorCube.TransformMonochromacy) {
            nextMatrix = this.transformSpaceMatrices.monochromacy
        } else if (nextValue === ColorCube.TransformCustom) {
            nextMatrix = this.transformSpaceMatrices.custom
        }

        this.transformSpaceModeValue = nextValue
        this.material.transformSpaceMatrix.copy(nextMatrix)
    }

    private syncTargetColorMarker(): void {
        this.targetColorMarker.visible =
            this.material.searchMode === ColorCube.SearchTargetColor

        if (!this.targetColorMarker.visible) {
            return
        }

        const { r, g, b } = this.material.targetColor
        this.targetColorMarker.position.set(r - 0.5, g - 0.5, b - 0.5)
        this.targetColorMarker.material.color.copy(this.material.targetColor)
    }
}

export default SdfColorCube
