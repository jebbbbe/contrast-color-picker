import {
    WebGLRenderer,
    type Camera,
    type ColorRepresentation,
    type Scene,
} from "three"
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { SearchBackgroundColor } from "../ColorSync"
import {
    SearchBlackAndWhite,
    SearchOppositeColor,
    SearchTargetColor,
} from "../objects/materials/ColorCubeMaterial"
import { getContrastRatio, getOppositeHexColor } from "./contrast"

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

function save(url: string, name: string): void {
    const link = document.createElement("a")
    link.download = name.endsWith(".png") ? name : `${name}.png`
    link.href = url
    document.body.appendChild(link)
    link.click()
    link.remove()
}

/** Render the scene at the requested width and download the result as a PNG. */
export async function saveSceneImage(
    renderer: WebGLRenderer,
    scene: Scene,
    camera: Camera,
    width = 2048,
    name = "scene"
): Promise<void> {
    if (width <= 0 || !Number.isFinite(width)) {
        throw new Error("Image width must be a positive number")
    }

    const aspect = renderer.domElement.width / renderer.domElement.height
    const imageWidth = Math.round(width)
    const height = Math.max(1, Math.round(imageWidth / aspect))
    const canvas = document.createElement("canvas")
    canvas.width = imageWidth
    canvas.height = height
    const exportRenderer = new WebGLRenderer({ canvas, antialias: true })
    exportRenderer.outputColorSpace = renderer.outputColorSpace
    exportRenderer.toneMapping = renderer.toneMapping
    exportRenderer.toneMappingExposure = renderer.toneMappingExposure
    exportRenderer.setSize(imageWidth, height, false)

    try {
        exportRenderer.render(scene, camera)

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/png")
        )
        if (!blob) throw new Error("Could not encode scene image")

        const url = URL.createObjectURL(blob)
        save(url, name)
        URL.revokeObjectURL(url)
    } finally {
        exportRenderer.dispose()
    }
}

export function quantizeToPassingColor(
    hex: string,
    contrast: number,
    searchMode: number,
    fontColor: ColorRepresentation,
    backgroundColor: ColorRepresentation,
    darkModeColor: ColorRepresentation
): string {
    const passesSearchFilter = (candidate: string): boolean => {
        if (searchMode === SearchOppositeColor) {
            return (
                getContrastRatio(candidate, getOppositeHexColor(candidate)) >=
                contrast
            )
        }

        if (searchMode === SearchTargetColor) {
            return getContrastRatio(candidate, backgroundColor) >= contrast
        }

        if (searchMode === SearchBackgroundColor) {
            return getContrastRatio(candidate, fontColor) >= contrast
        }

        if (searchMode === SearchBlackAndWhite) {
            return (
                getContrastRatio(candidate, backgroundColor) >= contrast &&
                getContrastRatio(candidate, darkModeColor) >= contrast
            )
        }

        return true
    }

    if (passesSearchFilter(hex)) return hex

    const rgb = [
        Number.parseInt(hex.slice(1, 3), 16),
        Number.parseInt(hex.slice(3, 5), 16),
        Number.parseInt(hex.slice(5, 7), 16),
    ]

    for (let rOffset = -1; rOffset <= 1; rOffset++) {
        for (let gOffset = -1; gOffset <= 1; gOffset++) {
            for (let bOffset = -1; bOffset <= 1; bOffset++) {
                if (rOffset === 0 && gOffset === 0 && bOffset === 0) continue

                const candidateRgb = [
                    rgb[0] + rOffset,
                    rgb[1] + gOffset,
                    rgb[2] + bOffset,
                ]

                if (
                    candidateRgb.some((channel) => channel < 0 || channel > 255)
                ) {
                    continue
                }

                const candidate = `#${candidateRgb
                    .map((channel) => channel.toString(16).padStart(2, "0"))
                    .join("")}`

                if (passesSearchFilter(candidate)) return candidate
            }
        }
    }

    return hex
}
