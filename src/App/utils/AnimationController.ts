import {
    Camera,
    CubicInterpolant,
    LinearInterpolant,
    MathUtils,
    Vector3,
    WebGLRenderer,
    type IUniform,
    type Interpolant,
    type DiscreteInterpolant,
    type QuaternionLinearInterpolant,
} from "three"
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import type { TransformControls } from "three/examples/jsm/controls/TransformControls.js"

export type AnimationFrame<T> = {
    frame: T
    time: number
}

export interface AnimationTrack {
    apply(progress: number): void
}

export type AnimationInterpolant =
    | typeof CubicInterpolant
    | typeof LinearInterpolant
    | typeof DiscreteInterpolant
    | typeof QuaternionLinearInterpolant

export class CameraAnimation implements AnimationTrack {
    private readonly interpolant: Interpolant
    private readonly camera: Camera
    private readonly target: Vector3

    constructor(
        camera: Camera,
        target: Vector3,
        frames: AnimationFrame<Vector3>[],
        InterpolantClass: AnimationInterpolant = CubicInterpolant
    ) {
        this.camera = camera
        this.target = target
        this.interpolant = new InterpolantClass(
            frames.map(({ time }) => time),
            frames.flatMap(({ frame }) => frame.toArray()),
            3
        )
    }

    apply(progress: number): void {
        const times = this.interpolant.parameterPositions
        const start = times[0]
        const end = times[times.length - 1]
        const time = MathUtils.lerp(
            start,
            end,
            MathUtils.smootherstep(progress, start, end)
        )
        this.camera.position.fromArray(this.interpolant.evaluate(time))
        this.camera.lookAt(this.target)
    }
}

export class MaterialAnimation implements AnimationTrack {
    private readonly interpolant: Interpolant
    private readonly uniform: IUniform<number>

    constructor(
        uniform: IUniform<number>,
        frames: AnimationFrame<number>[],
        InterpolantClass: AnimationInterpolant = LinearInterpolant
    ) {
        this.uniform = uniform
        this.interpolant = new InterpolantClass(
            frames.map(({ time }) => time),
            frames.map(({ frame }) => frame),
            1
        )
    }

    apply(progress: number): void {
        this.uniform.value = this.interpolant.evaluate(progress)[0]
    }
}

export class AnimationController {
    private readonly tracks: AnimationTrack[]
    private readonly controls: OrbitControls
    private readonly transformControls: TransformControls
    private readonly container: HTMLCanvasElement
    private readonly orbitEnabled: boolean
    private readonly transformEnabled: boolean
    private readonly inert: boolean
    private readonly duration: number
    private startTime?: number
    active = true

    constructor(
        renderer: WebGLRenderer,
        controls: OrbitControls,
        transformControls: TransformControls,
        tracks: AnimationTrack[],
        duration = 2400
    ) {
        if (duration <= 0 || !Number.isFinite(duration)) {
            throw new Error("Animation requires a positive duration")
        }

        this.tracks = tracks
        this.controls = controls
        this.transformControls = transformControls
        this.duration = duration
        this.container = renderer.domElement

        this.orbitEnabled = controls.enabled
        this.transformEnabled = transformControls.enabled
        this.inert = this.container.inert
        controls.enabled = false
        transformControls.enabled = false
        this.container.inert = true
        this.tracks.forEach((track) => track.apply(0))
    }

    update(time: number): void {
        this.startTime ??= time
        const progress = MathUtils.clamp(
            (time - this.startTime) / this.duration,
            0,
            1
        )
        this.tracks.forEach((track) => track.apply(progress))
        if (progress === 1) {
            this.active = false
            this.restoreInteraction()
        }
    }

    private restoreInteraction(): void {
        this.controls.enabled = this.orbitEnabled
        this.transformControls.enabled = this.transformEnabled
        this.container.inert = this.inert
    }
}
