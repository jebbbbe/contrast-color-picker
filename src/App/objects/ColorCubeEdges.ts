import * as THREE from "three"

import frag from "./materials/glsl/ColorCubeEdges.frag.glsl?raw"
import vert from "./materials/glsl/ColorCubeEdges.vert.glsl?raw"

export class ColorCubeEdges extends THREE.LineSegments<
    THREE.EdgesGeometry,
    THREE.ShaderMaterial
> {
    constructor(geometry: THREE.BoxGeometry) {
        const edges = new THREE.EdgesGeometry(geometry)
        const edgePositions = edges.getAttribute("position")
        const edgeColors = edgePositions.array.slice() as Float32Array

        for (let i = 0; i < edgeColors.length; i++) {
            edgeColors[i] += 0.5
        }

        edges.setAttribute("color", new THREE.BufferAttribute(edgeColors, 3))

        super(
            edges,
            new THREE.ShaderMaterial({
                vertexShader: vert,
                fragmentShader: frag,
            })
        )
    }
}

export default ColorCubeEdges
