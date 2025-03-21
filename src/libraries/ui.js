import * as THREE from "three";
import { GUI } from 'dat.gui';
import { outputTargets, densityFunctions } from "./constants.js"


export function addGui({ M, scene, sdfMaterial }) {
    let gui = new GUI({ width: 300 });
    gui.addColor(M.var, "backgroundColor").name("Background Color").listen().onChange(() => {
        sdfMaterial.customUniforms.backgroundColor.value.set(M.var.backgroundColor);
    });
    gui.add(M.var, "backgroundOpacity", 0, 1).name("Background Opacity").listen().onChange(() => {
        sdfMaterial.customUniforms.backgroundOpacity.value = M.var.backgroundOpacity;
    });
    const sphere = gui.addFolder("Sphere")
    sphere.add(M.var.spherePos, "x", 0, 1).listen()
    sphere.add(M.var.spherePos, "y", 0, 1).listen()
    sphere.add(M.var.spherePos, "z", 0, 1).listen()
    sphere.add(M.var.spherePos, "w", 0, 1).listen()
    gui.add(M.var, "drawingTarget", outputTargets).listen().onChange(() => {
        sdfMaterial.customUniforms.drawingTarget.value = M.var.drawingTarget;
    })
}
