import { string } from "three/tsl"
import type { FontSwatchState } from "../components/FontSwatch"
import { getContrastRatio } from "./utils/contrast"

export type ReactCallbacks = {
    setSwatch?: (state: FontSwatchState) => void
}

type FontPreviewInput = {
    color: string
    backgroundColor: string
    darkModeEnabled?: boolean
    darkBackgroundColor?: string
    darkModeColor?: string
}

export class CallbackBridge {
    private readonly callbacks?: ReactCallbacks

    constructor(callbacks: ReactCallbacks = {}) {
        this.callbacks = callbacks
    }

    setSwatch({
        color,
        backgroundColor,
        darkModeEnabled = false,
        darkBackgroundColor = "#000000",
    }: FontPreviewInput): void {
        if (!this.callbacks?.setSwatch) {
            return
        }

        let contrastRatio = getContrastRatio(color, backgroundColor)
        const darkMode = {
            normalDarkTextPassAA: false,
            normalDarkTextPassAAA: false,
            largeDarkTextPassAA: false,
            largeDarkTextPassAAA: false,
        }
        const contrastRatioDark = getContrastRatio(color, darkBackgroundColor)
        if (darkModeEnabled) {
            darkMode.normalDarkTextPassAA = contrastRatioDark >= 4.5
            darkMode.normalDarkTextPassAAA = contrastRatioDark >= 7
            darkMode.largeDarkTextPassAA = contrastRatioDark >= 3
            darkMode.largeDarkTextPassAAA = contrastRatioDark >= 4.5
        }

        this.callbacks.setSwatch({
            color,
            backgroundColor,
            contrastRatio: String(Number(contrastRatio.toFixed(2))),
            normalTextPassAA: contrastRatio >= 4.5,
            normalTextPassAAA: contrastRatio >= 7,
            largeTextPassAA: contrastRatio >= 3,
            largeTextPassAAA: contrastRatio >= 4.5,
            darkModeEnabled,
            darkBackgroundColor,
            contrastRatioDark: String(Number(contrastRatioDark.toFixed(2))),
            ...darkMode,
        })
    }
}

export default CallbackBridge
