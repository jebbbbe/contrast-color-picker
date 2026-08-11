import * as THREE from "three"

import { ColorCubeMaterial } from "./materials/ColorCubeMaterial"

export class SdfColorCube extends THREE.Group {
    readonly material: ColorCubeMaterial

    private readonly targetColorMarker: THREE.Mesh<
        THREE.SphereGeometry,
        THREE.MeshBasicMaterial
    >

    constructor() {
        super()

        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new ColorCubeMaterial()
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
            new THREE.MeshBasicMaterial()
        )

        mesh.onBeforeRender = () => {
            this.syncTargetColorMarker()
        }

        this.material = material
        this.targetColorMarker = targetColorMarker
        this.syncTargetColorMarker()
        this.add(mesh, wireframe, targetColorMarker)
    }

    private syncTargetColorMarker(): void {
        this.targetColorMarker.visible = this.material.useTargetColor

        if (!this.targetColorMarker.visible) {
            return
        }

        const { r, g, b } = this.material.targetColor
        this.targetColorMarker.position.set(r - 0.5, g - 0.5, b - 0.5)
        this.targetColorMarker.material.color.copy(this.material.targetColor)
    }
}

export default SdfColorCube
