import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

function fullReloadOnChange() {
    return {
        name: "full-reload-on-change",
        handleHotUpdate({ server }) {
            server.ws.send({ type: "full-reload" })
            return []
        },
    }
}

export default defineConfig({
    plugins: [react(), fullReloadOnChange()],
    resolve: {
        alias: {
            "@types": fileURLToPath(new URL("./src/types.ts", import.meta.url)),
        },
    },
    build: {
        rolldownOptions: {
            output: {
                codeSplitting: {
                    includeDependenciesRecursively: false,
                    groups: [
                        {
                            name: "three",
                            priority: 2,
                            test: /node_modules[\\/]three[\\/]/,
                        },
                        {
                            name: "app",
                            priority: 1,
                            test: /[\\/]src[\\/]App[\\/]/,
                        },
                    ],
                },
            },
        },
    },
})
