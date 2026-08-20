import { useEffect, useRef } from "react"
import ThreeSceneApp from "./App/main"
import FontSwatch from "./components/FontSwatch"
import Header from "./components/Header"

function App() {
    const threeSceneMountRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!threeSceneMountRef.current) {
            return
        }

        const app = new ThreeSceneApp(threeSceneMountRef.current)
        app.animate()
		
		;(globalThis as any).app = app

        return () => {
            app.dispose()
        }
    }, [])

    return (
        <>
            <div id="app" ref={threeSceneMountRef} />

            {/* <div className="overlay"> */}
                {/* <Header /> */}
                {/* <FontSwatch /> */}
            {/* </div> */}
        </>
    )
}

export default App
