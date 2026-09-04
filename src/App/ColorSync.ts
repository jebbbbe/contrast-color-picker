import * as THREE from "three"
import type CallbackBridge from "./CallbackBridge"
import type { ColorCubeVolume } from "./objects/ColorCubeVolume"
import type { Marker } from "./objects/Marker"
import * as ColorCube from "./objects/materials/ColorCubeMaterial"
import { getOppositeHexColor } from "./utils/contrast"

export const SearchBackgroundColor = 4

export type ColorSyncState = {
    searchMode: number
    fontColor: string
    backgroundColor: string
    darkModeColor: string
}

export type ColorSyncChangeEvent = {
    type: "change"
    searchModeChanged: boolean
}

export class ColorSync extends THREE.EventDispatcher<{
    change: ColorSyncChangeEvent
}> {
    private readonly colorCube: ColorCubeVolume
    private readonly callbackBridge: CallbackBridge
    private appliedSearchMode: number
    readonly state: ColorSyncState

    constructor(colorCube: ColorCubeVolume, callbackBridge: CallbackBridge) {
        super()
        this.colorCube = colorCube
        this.callbackBridge = callbackBridge

        const { markers, mesh } = colorCube

        this.state = {
            searchMode: mesh.material.searchMode,
            fontColor: markers.font.getHex(),
            backgroundColor: markers.background.getHex(),
            darkModeColor: markers.darkmode.getHex(),
        }
        this.appliedSearchMode = this.state.searchMode

        this.update({})
    }

    setSearchMode(searchMode: number): void {
        this.update({ searchMode })
    }

    setFontColor(fontColor: string): void {
        if (this.state.searchMode === ColorCube.SearchOppositeColor) {
            this.update({
                fontColor,
                backgroundColor: getOppositeHexColor(fontColor),
            })
            return
        }

        this.update({ fontColor })
    }

    setBackgroundColor(backgroundColor: string): void {
        if (this.state.searchMode === ColorCube.SearchOppositeColor) {
            this.update({
                fontColor: getOppositeHexColor(backgroundColor),
                backgroundColor,
            })
            return
        }

        this.update({ backgroundColor })
    }

    setDarkModeColor(darkModeColor: string): void {
        this.update({ darkModeColor })
    }

    swapColors(): void {
        this.update({
            fontColor: this.state.backgroundColor,
            backgroundColor: this.state.fontColor,
        })
    }

    pickColor(hitHex: string): void {
        if (this.state.searchMode === ColorCube.SearchNone) {
            return
        }

        if (this.state.searchMode === SearchBackgroundColor) {
            this.setBackgroundColor(hitHex)
            return
        }

        this.setFontColor(hitHex)
    }

    syncMarker(marker: Marker): void {
        const { font, background, darkmode } = this.colorCube.markers
        const hex = marker.getHex()

        if (marker === font) {
            this.setFontColor(hex)
            return
        }

        if (marker === background) {
            this.setBackgroundColor(hex)
            return
        }

        if (marker === darkmode) {
            this.setDarkModeColor(hex)
        }
    }

    private update(patch: Partial<ColorSyncState>): void {
        const searchModeChanged =
            patch.searchMode !== undefined &&
            patch.searchMode !== this.appliedSearchMode

        Object.assign(this.state, patch)
        const { markers, mesh } = this.colorCube
        const material = mesh.material
        const { searchMode, fontColor, backgroundColor, darkModeColor } =
            this.state

        material.searchMode = searchMode
        if (searchMode === SearchBackgroundColor) {
            material.searchMode = ColorCube.SearchTargetColor
        }

        material.targetColor = fontColor
        if (searchMode === ColorCube.SearchTargetColor) {
            material.targetColor = backgroundColor
        }

        material.whitePoint = backgroundColor
        material.blackPoint = darkModeColor

        markers.font.updateColor(fontColor)
        markers.background.updateColor(backgroundColor)
        markers.darkmode.updateColor(darkModeColor)

        markers.font.visible = searchMode !== ColorCube.SearchNone
        markers.background.visible = searchMode !== ColorCube.SearchNone
        markers.darkmode.visible = searchMode === ColorCube.SearchBlackAndWhite
        this.appliedSearchMode = searchMode

        this.callbackBridge.setSwatch({
            color: fontColor,
            backgroundColor,
            darkModeEnabled: searchMode === ColorCube.SearchBlackAndWhite,
            darkBackgroundColor: darkModeColor,
        })

        this.dispatchEvent({
            type: "change",
            searchModeChanged,
        })
    }
}

export default ColorSync
