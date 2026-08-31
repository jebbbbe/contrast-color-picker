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

        const contrastRatio = getContrastRatio(color, backgroundColor)
        const darkMode = {
            normalDarkTextPassAA: false,
            normalDarkTextPassAAA: false,
            largeDarkTextPassAA: false,
            largeDarkTextPassAAA: false,
        }
        if (darkModeEnabled) {
            const contrastRatio = getContrastRatio(color, darkBackgroundColor)
            darkMode.normalDarkTextPassAA = contrastRatio >= 4.5
            darkMode.normalDarkTextPassAAA = contrastRatio >= 7
            darkMode.largeDarkTextPassAA = contrastRatio >= 3
            darkMode.largeDarkTextPassAAA = contrastRatio >= 4.5
        }

        this.callbacks.setSwatch({
            color,
            backgroundColor,
            normalTextPassAA: contrastRatio >= 4.5,
            normalTextPassAAA: contrastRatio >= 7,
            largeTextPassAA: contrastRatio >= 3,
            largeTextPassAAA: contrastRatio >= 4.5,
            darkModeEnabled,
            darkBackgroundColor,
            ...darkMode,
        })
    }
}

export default CallbackBridge
