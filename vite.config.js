import { defineConfig } from "vite";

export default defineConfig({
    root: "src", // Set the root directory to `src`
    publicDir: "../public", // Point to the public directory relative to the project root
    build: {
        outDir: "../build" // Ensure the output is still in `dist`
    }
});
