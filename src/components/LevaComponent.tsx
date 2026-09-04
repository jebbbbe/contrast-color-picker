import { useEffect, useState } from "react"
import { button, Leva, useControls } from "leva"
import type { ColorSyncChangeEvent } from "../App/ColorSync"
import { SearchBackgroundColor } from "../App/ColorSync"
import * as ColorCube from "../App/objects/materials/ColorCubeMaterial"
import {
    contrastPresetValues,
    searchTitles,
    type AppStubType,
} from "../constants"

type ContrastPresetState = "" | number

function getContrastPresetValue(contrastRatio: number): ContrastPresetState {
    return contrastRatio === 3 || contrastRatio === 4.5 || contrastRatio === 7
        ? contrastRatio
        : ""
}

function getColorControlState(searchMode: number): {
    fontDisabled: boolean
    backgroundDisabled: boolean
    darkModeDisabled: boolean
} {
    switch (searchMode) {
        case ColorCube.SearchOppositeColor:
        case SearchBackgroundColor:
        case ColorCube.SearchTargetColor:
            return {
                fontDisabled: false,
                backgroundDisabled: false,
                darkModeDisabled: true,
            }
        case ColorCube.SearchBlackAndWhite:
            return {
                fontDisabled: false,
                backgroundDisabled: false,
                darkModeDisabled: false,
            }
        case ColorCube.SearchNone:
        default:
            return {
                fontDisabled: true,
                backgroundDisabled: true,
                darkModeDisabled: true,
            }
    }
}

function LevaComponent({ bridge }: { bridge: AppStubType["gui"] }) {
    const [searchMode, setSearchMode] = useState(bridge.local.colorSync.state.searchMode)
    const [fontColor, setFontColor] = useState(bridge.local.colorSync.state.fontColor)
    const [backgroundColor, setBackgroundColor] = useState(
        bridge.local.colorSync.state.backgroundColor
    )
    const [darkModeColor, setDarkModeColor] = useState(
        bridge.local.colorSync.state.darkModeColor
    )
    const [contrastRatio, setContrastRatio] = useState(
        bridge.local.colorCubeMaterial.contrastRatio
    )
    const [contrastPreset, setContrastPreset] = useState<ContrastPresetState>(
        getContrastPresetValue(bridge.local.colorCubeMaterial.contrastRatio)
    )
    const { fontDisabled, backgroundDisabled, darkModeDisabled } =
        getColorControlState(searchMode)

    const [, setLeva] = useControls(
        () => ({
            "Search Mode": {
                value: searchMode,
                options: searchTitles,
                onChange: (value: number) => {
                    bridge.setSearchMode(value)
                    syncFromBridgeState()
                },
            },
            "WCAG Contrast": {
                value: contrastPreset,
                options: [...contrastPresetValues],
                onChange: (value: ContrastPresetState) => {
                    if (value === "") {
                        syncFromBridgeState()
                        return
                    }

                    bridge.setContrastPreset(value)
                    syncFromBridgeState()
                },
            },
            "Contrast Ratio": {
                value: contrastRatio,
                min: 1,
                max: 21,
                step: 0.001,
                onChange: (value: number) => {
                    bridge.local.colorCubeMaterial.contrastRatio = value
                    syncFromBridgeState()
                },
            },
            Swap: button(() => {
                bridge.swapColors()
                syncFromBridgeState()
            }),
            Font: {
                value: fontColor,
                disabled: fontDisabled,
                onChange: (value: string) => {
                    bridge.setFontColor(value)
                    syncFromBridgeState()
                },
            },
            Background: {
                value: backgroundColor,
                disabled: backgroundDisabled,
                onChange: (value: string) => {
                    bridge.setBackgroundColor(value)
                    syncFromBridgeState()
                },
            },
            "Dark Mode": {
                value: darkModeColor,
                disabled: darkModeDisabled,
                onChange: (value: string) => {
                    bridge.setDarkModeColor(value)
                    syncFromBridgeState()
                },
            },
        }),
        [
            bridge,
            searchMode,
            contrastPreset,
            contrastRatio,
            fontColor,
            backgroundColor,
            darkModeColor,
            fontDisabled,
            backgroundDisabled,
            darkModeDisabled,
        ]
    )

    function syncFromBridgeState(): void {
        const { colorSync, colorCubeMaterial } = bridge.local
        const nextSearchMode = colorSync.state.searchMode
        const nextFontColor = colorSync.state.fontColor
        const nextBackgroundColor = colorSync.state.backgroundColor
        const nextDarkModeColor = colorSync.state.darkModeColor
        const nextContrastRatio = colorCubeMaterial.contrastRatio
        const nextContrastPreset = getContrastPresetValue(nextContrastRatio)

        setSearchMode(nextSearchMode)
        setFontColor(nextFontColor)
        setBackgroundColor(nextBackgroundColor)
        setDarkModeColor(nextDarkModeColor)
        setContrastRatio(nextContrastRatio)
        setContrastPreset(nextContrastPreset)
        setLeva({
            "Search Mode": nextSearchMode,
            "WCAG Contrast": nextContrastPreset,
            "Contrast Ratio": nextContrastRatio,
            Font: nextFontColor,
            Background: nextBackgroundColor,
            "Dark Mode": nextDarkModeColor,
        })
    }

    useEffect(() => {
        syncFromBridgeState()

        const handleChange = (_event: ColorSyncChangeEvent): void => {
            syncFromBridgeState()
        }

        bridge.local.colorSync.addEventListener("change", handleChange)

        return () => {
            bridge.local.colorSync.removeEventListener("change", handleChange)
        }
    }, [bridge])

    return (
        <>
            <Leva
                // theme={levaTheme} // you can pass a custom theme (see the styling section)
                fill={true} // default = false, true makes the pane fill the parent dom node it's rendered in
                flat={true} // default = false, true removes border radius and shadow
                // oneLineLabels // default = false, alternative layout for labels, with labels and fields on separate rows
                collapsed={false} // default = false, when true the GUI is collapsed
                // hidden // default = false, when true the GUI is hidden
                // neverHide // default = false, when true the GUI stays visible even when no controls are mounted
                // hideCopyButton // default = false, hides the copy button in the title bar
                titleBar={false}
                neverHide={true}
                // titleBar = {false}
            />
        </>
    )
}

export default LevaComponent
