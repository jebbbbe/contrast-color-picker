import { useEffect, useRef, useState } from "react"
import ThreeSceneApp from "./App/main"
import FontSwatch, {
    initialFontSwatchState,
    type FontSwatchState,
} from "./components/FontSwatch"
import Header from "./components/Header"
import LevaComponent from "./components/LevaComponent"
import Footer from "./components/Footer"

function App() {
    const threeSceneMountRef = useRef<HTMLDivElement | null>(null)
    const guiMountRef = useRef<HTMLDivElement | null>(null)
    const [app, setApp] = useState<ThreeSceneApp | null>(null)
    const [swatch, setSwatch] = useState<FontSwatchState>(
        initialFontSwatchState
    )

    useEffect(() => {
        if (!threeSceneMountRef.current || !guiMountRef.current) {
            return
        }

        const app = new ThreeSceneApp(
            threeSceneMountRef.current,
            guiMountRef.current,
            {
                setSwatch: setSwatch,
            }
        )
        setApp(app)
        app.animate()
        ;(globalThis as any).app = app

        return () => {
            app.dispose()
            setApp(null)
        }
    }, [])

    return (
        <main>
            <Header />
            <article className="content">
                <div className="container">
                    <div className="app-holder">
                        <div id="app" ref={threeSceneMountRef} />
                    </div>
                    <div className="leva-holder">
                        <LevaComponent app={app} />
                    </div>
                    <div className="gui-holder" ref={guiMountRef} />
                </div>
                <div className="container">
                    <FontSwatch swatch={swatch} />
                </div>
            </article>
            <Footer />
        </main>
    )
}

export default App
