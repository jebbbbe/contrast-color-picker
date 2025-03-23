import * as THREE from "three";
import { GUI } from 'dat.gui';
import { outputTargets, densityFunctions, transformModes } from "./constants.js"


export function addGui({ M, scene, sdfMaterial }) {
    let gui = new GUI({ width: 300 });

    const sim = gui.addFolder("Simulation")
    sim.addColor(M.var, "backgroundColor").name("Background Color").listen().onChange(() => {
        sdfMaterial.customUniforms.backgroundColor.value.set(M.var.backgroundColor);
    });
    sim.add(M.var, "backgroundOpacity", 0, 1).name("Background Opacity").listen().onChange(() => {
        sdfMaterial.customUniforms.backgroundOpacity.value = M.var.backgroundOpacity;
    });
    sim.add(M.var, "maxRayStep",1,128).listen().onChange(() => {
        sdfMaterial.customUniforms.MAX_STEPS.value = M.var.maxRayStep;
    })
    sim.add(M.var, "maxRayDepth",1,10000000).listen().onChange(() => {
        sdfMaterial.customUniforms.MAX_DEPTH.value = M.var.maxRayDepth;
    })
    sim.add(M.var, "drawingTarget", outputTargets).listen().onChange(() => {
        sdfMaterial.customUniforms.drawingTarget.value = M.var.drawingTarget;
    })
    

    gui.add(M.var, "densityFunction", densityFunctions).listen().onChange(() => {
        sdfMaterial.customUniforms.densityFunction.value = M.var.densityFunction;
    })
    gui.add(M.var, "contrastRatio",0,21,0.001).listen().onChange(() => {
        sdfMaterial.customUniforms.contrastRatio.value = M.var.contrastRatio;
    })
    gui.add(M.var, "transformMode",transformModes).listen().onChange(() => {
        sdfMaterial.customUniforms.transformMode.value = M.var.transformMode;
    })
    
    gui.add(M.var, "turnTable").name("Spin")


    
    


    const sphere = gui.addFolder("Sphere")
    sphere.add(M.var.spherePos, "x", 0, 1).listen()
    sphere.add(M.var.spherePos, "y", 0, 1).listen()
    sphere.add(M.var.spherePos, "z", 0, 1).listen()
    sphere.add(M.var.spherePos, "w", 0, 1).listen()
}
