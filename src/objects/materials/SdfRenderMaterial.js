import * as THREE from "three";
import * as ThreeTools from "threetools";
import vert from "./glsl/vert.glsl?raw"
import frag from "./glsl/frag.glsl?raw"

export class SdfRenderMaterial extends ThreeTools.CustomShaderMaterial {
	constructor(parameters = {}, share) {
		const customProperties = {
			vUv: { qualifier: "varying", type: "vec2" },
			backgroundColor: { qualifier: "uniform", type: "vec3", value: new THREE.Vector3(0.021, 0.470, 0.299) },
			backgroundOpacity: { qualifier: "uniform", type: "float", value: 1.0 },
			mixBackground: { qualifier: "uniform", type: "bool", value: true },
			u_camPos: { qualifier: "uniform", type: "vec3", value: new THREE.Vector3() },
			u_camDir: { qualifier: "uniform", type: "vec3", value: new THREE.Vector3() },
			u_fov: { qualifier: "uniform", type: "float", value: 10 },
			u_aspect: { qualifier: "uniform", type: "float", value: 1 },
			MAX_STEPS: { qualifier: "uniform", type: "int", value: 128 },
			MAX_DEPTH: { qualifier: "uniform", type: "float", value: 500000 },
			drawingTarget: { qualifier: "uniform", type: "int", value: 0 },
			spherePos: { qualifier: "uniform", type: "vec4", value: new THREE.Vector4(0.626, 0.740, 0.540, 0.466) },
			densityFunction: { qualifier: "uniform", type: "int", value: 0 },
			contrastRatio: { qualifier: "uniform", type: "float", value: 4.5 },
			transformMode: { qualifier: "uniform", type: "int", value: 0 },
			customTransformMatrix: { qualifier: "uniform", type: "mat3", value: new THREE.Matrix3() },
			selectedColor: { qualifier: "uniform", type: "vec3", value: new THREE.Color(0xff00f0) },

			sdfMaxDist: { qualifier: "uniform", type: "float", value: 0.466 },
			sdfMinDist: { qualifier: "uniform", type: "float", value: 2.35 },
			visualizeSolution: { qualifier: "uniform", type: "int", value: 0 },


		}
		super(parameters, customProperties)
		this.onBeforeCompile = (shader) => {
			this.linkUnifromsToShader(shader)
			shader.vertexShader = this.headers.vertex + vert
			shader.fragmentShader = this.headers.fragment + frag
			this.userData.shader = shader;
		}
	}
}
