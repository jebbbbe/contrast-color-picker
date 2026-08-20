import type { Camera, Scene, WebGLRenderer } from "three"
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

export function logScenePixel(
    renderer: WebGLRenderer,
    scene: Scene,
    camera: Camera,
    controls: OrbitControls,
    clientX: number,
    clientY: number
): string {
    const canvas = renderer.domElement
    const rect = canvas.getBoundingClientRect()
    const gl = renderer.getContext()
    const drawWidth = gl.drawingBufferWidth
    const drawHeight = gl.drawingBufferHeight

    const x = Math.max(
        0,
        Math.min(
            drawWidth - 1,
            Math.floor(((clientX - rect.left) / rect.width) * drawWidth)
        )
    )

    const yFromTop = Math.max(
        0,
        Math.min(
            drawHeight - 1,
            Math.floor(((clientY - rect.top) / rect.height) * drawHeight)
        )
    )

    const y = drawHeight - 1 - yFromTop
    const pixel = new Uint8Array(4)

    controls.update()
    renderer.render(scene, camera)
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)

    const hex = `#${[pixel[0], pixel[1], pixel[2]]
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("")}`

    const result = {
        clientX,
        clientY,
        x,
        y,
        rgba: [...pixel],
        hex,
    }
    return result.hex
}

export default logScenePixel
