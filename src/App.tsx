import { useEffect, useRef } from "react"
import ThreeSceneApp from "./App/main"

function App() {
    const threeSceneMountRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!threeSceneMountRef.current) {
            return
        }

        const app = new ThreeSceneApp(threeSceneMountRef.current)

        return () => {
            app.dispose()
        }
    }, [])

    return <div id="app" ref={threeSceneMountRef} />
}

export default App
