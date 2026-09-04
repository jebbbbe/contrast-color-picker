import { useEffect, useMemo, useState } from "react"
import { button, buttonGroup, folder, Leva, useControls } from "leva"

function LevaComponent() {
    const schema = () => {
        const Folder = folder(
            {
                // saveCubeAsGlb: button(controls.saveCubeAsGlb),
                // saveCubeAsGltf: button(controls.saveCubeAsGltf),
            },
            { collapsed: true }
        )
        return {
			Folder
		}
    }
	useControls(schema())
    return (
        <Leva
            // theme={} // you can pass a custom theme (see the styling section)
            fill={true} // default = false, true makes the pane fill the parent dom node it's rendered in
            flat={true} // default = false, true removes border radius and shadow
            // oneLineLabels // default = false, alternative layout for labels, with labels and fields on separate rows
            collapsed={false} // default = false, when true the GUI is collapsed
            // hidden // default = false, when true the GUI is hidden
            // neverHide // default = false, when true the GUI stays visible even when no controls are mounted
            // hideCopyButton // default = false, hides the copy button in the title bar
            titleBar={{
                // Configure title bar options
                title: "Controls", // Custom title
                drag: false, // Enable dragging
                filter: false, // Enable filter/search
                // position: { x: 0, y: 0 }, // Initial position (when drag is enabled)
                // onDrag: () => {}, // Callback when dragged
            }}
            neverHide={true}
            // titleBar = {false}
        />
    )
}

export default LevaComponent
