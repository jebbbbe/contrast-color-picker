import { useEffect, useRef } from "react"
import ThreeSceneApp from "./App/main"
import FontSwatch from "./components/FontSwatch"
import Footer from "./components/Footer"
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
        <main>
            <Header />
            <article className="content">
                <div className="container">
                    <div className="app-holder">
                        <div id="app" ref={threeSceneMountRef} />
                    </div>
                </div>
                <div className="container">
                    <FontSwatch />
                </div>
            </article>
            <Footer />
        </main>
    )
}

export default App
