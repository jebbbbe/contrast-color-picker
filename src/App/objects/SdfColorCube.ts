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

const _markerSphereGeometry = new THREE.SphereGeometry(0.02, 16, 16)
const _markerPositionColor = new THREE.Color()

type Dot = THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
type MarkerData = {
    primary: Dot
    inverse: Dot
}

export class Marker extends THREE.Group {
    constructor(visible = false, color: THREE.ColorRepresentation = 0x000000) {
        super()

        const primary: Dot = new THREE.Mesh(
            _markerSphereGeometry,
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(),
                fog: false,
                vertexColors: false,
                transparent: false,
                depthTest: false,
            })
        )
        const inverse: Dot = new THREE.Mesh(
            _markerSphereGeometry,
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(),
                fog: false,
                vertexColors: false,
                transparent: false,
                side: THREE.BackSide,
                depthTest: false,
            })
        )

        inverse.renderOrder = 1
        primary.renderOrder = 2
        inverse.scale.setScalar(1.2)

        const userData = this.userData as MarkerData

        userData.primary = primary
        userData.inverse = inverse
        this.add(inverse, primary)

        this.update(visible, color)
    }

    update(visible: boolean, color: THREE.ColorRepresentation): void {
        const { primary, inverse } = this.userData as MarkerData

        this.visible = visible
        primary.material.color.set(color)
        inverse.material.color.setRGB(
            1 - primary.material.color.r,
            1 - primary.material.color.g,
            1 - primary.material.color.b
        )

        if (!visible) {
            return
        }

        const { r, g, b } = _markerPositionColor
            .set(color)
            .convertLinearToSRGB()

        this.position.set(r - 0.5, g - 0.5, b - 0.5)
    }
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
        const edges = new THREE.EdgesGeometry(geometry)
        const edgePositions = edges.getAttribute("position")
        const edgeColors = edgePositions.array.slice() as Float32Array

        for (let i = 0; i < edgeColors.length; i++) {
            edgeColors[i] += 0.5
        }
        const edgeColor = new THREE.Color()

        for (let i = 0; i < edgeColors.length; i += 3) {
            edgeColor.setRGB(
                edgeColors[i],
                edgeColors[i + 1],
                edgeColors[i + 2],
                THREE.LinearSRGBColorSpace
            )

            edgeColors[i] = edgeColor.r
            edgeColors[i + 1] = edgeColor.g
            edgeColors[i + 2] = edgeColor.b
        }

        edges.setAttribute("color", new THREE.BufferAttribute(edgeColors, 3))

        const wireframe = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ vertexColors: true })
        )
        const targetColorMarker = new Marker(
            material.searchMode === ColorCube.SearchTargetColor,
            material.targetColor
        )
        const onClickMarker = new Marker(false)

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
        this.mesh.material.transformSpaceMatrix.copy(nextMatrix)
    }
}

export default SdfColorCube
