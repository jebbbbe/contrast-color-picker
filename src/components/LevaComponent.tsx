import { useEffect, useState } from "react"
import { button, LevaPanel, useControls, useCreateStore } from "leva"
import type { ColorSyncChangeEvent } from "../App/ColorSync"
import { SearchBackgroundColor } from "../App/ColorSync"
import * as ColorCube from "../App/objects/materials/ColorCubeMaterial"
import {
    contrastPresetValues,
    searchTitles,
	levaTheme,
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
    const [oneLineLabels, setOneLineLabels] = useState(false)
    const [searchMode, setSearchMode] = useState(
        bridge.local.colorSync.state.searchMode
    )
    const [fontColor, setFontColor] = useState(
        bridge.local.colorSync.state.fontColor
    )
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

    const otherStore = useCreateStore()
    const colorStore = useCreateStore()

    const [, setOther] = useControls(
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
        }),
        { store: otherStore },
        [
            bridge,
            searchMode,
            contrastPreset,
            contrastRatio,
        ]
    )

    const [, setColors] = useControls(
        () => ({
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
        { store: colorStore },
        [
            bridge,
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
        setOther({
            "Search Mode": nextSearchMode,
            "WCAG Contrast": nextContrastPreset,
            "Contrast Ratio": nextContrastRatio,
        })
        setColors({
            Font: nextFontColor,
            Background: nextBackgroundColor,
            "Dark Mode": nextDarkModeColor,
        })
    }

    // turn on one line labels
    useEffect(() => {
        const media = globalThis.matchMedia("(min-width: 701px)")
        const syncOneLineLabels = (): void => {
            setOneLineLabels(media.matches)
        }

        syncOneLineLabels()
        media.addEventListener("change", syncOneLineLabels)

        return () => {
            media.removeEventListener("change", syncOneLineLabels)
        }
    }, [])

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
            <div className="leva-column">
                <LevaPanel
                    store={otherStore}
					theme={levaTheme}
                    fill={true}
                    flat={true}
                    oneLineLabels={oneLineLabels}
                    collapsed={false}
                    titleBar={false}
                    neverHide={true}
                />
            </div>
            <div className="leva-column">
                <LevaPanel
                    store={colorStore}
					theme={levaTheme}
                    fill={true}
                    flat={true}
                    oneLineLabels={oneLineLabels}
                    collapsed={false}
                    titleBar={false}
                    neverHide={true}
                />
            </div>
        </>
    )
}

export default LevaComponent
