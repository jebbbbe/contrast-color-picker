import * as THREE from "three";
// import { GUI } from 'dat.gui';
import { GUI } from 'lil-gui';
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
    sim.add(M.var, "maxRayStep",1,1024).listen().onChange(() => {
        sdfMaterial.customUniforms.MAX_STEPS.value = M.var.maxRayStep;
    })
    sim.add(M.var, "maxRayDepth",1,8).listen().name("exp maxRayDepth").onChange(() => {
        sdfMaterial.customUniforms.MAX_DEPTH.value = 10**M.var.maxRayDepth;
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


    gui.addColor(M.var, "selectedColor").name("selected Color").listen().onChange(() => {
        sdfMaterial.customUniforms.selectedColor.value.set( M.var.selectedColor )
    })

    const sphere = gui.addFolder("Sphere")
    sphere.add(M.var.spherePos, "x", 0, 1).listen()
    sphere.add(M.var.spherePos, "y", 0, 1).listen()
    sphere.add(M.var.spherePos, "z", 0, 1).listen()
    sphere.add(M.var.spherePos, "w", 0, 1, 0.001).listen()

    const mat3 = gui.addFolder("mat3")

    let stub = {
        "0":M.var.customTransformMatrix.elements[0],
        "1":M.var.customTransformMatrix.elements[1],
        "2":M.var.customTransformMatrix.elements[2],
        "3":M.var.customTransformMatrix.elements[3],
        "4":M.var.customTransformMatrix.elements[4],
        "5":M.var.customTransformMatrix.elements[5],
        "6":M.var.customTransformMatrix.elements[6],
        "7":M.var.customTransformMatrix.elements[7],
        "8":M.var.customTransformMatrix.elements[8],
    }
    mat3.add({fn:restMat3}, "fn").name("reset")
    mat3.add(stub, "0",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[0] = stub["0"]}).listen()
    mat3.add(stub, "1",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[1] = stub["1"]}).listen()
    mat3.add(stub, "2",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[2] = stub["2"]}).listen()
    mat3.add(stub, "3",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[3] = stub["3"]}).listen()
    mat3.add(stub, "4",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[4] = stub["4"]}).listen()
    mat3.add(stub, "5",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[5] = stub["5"]}).listen()
    mat3.add(stub, "6",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[6] = stub["6"]}).listen()
    mat3.add(stub, "7",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[7] = stub["7"]}).listen()
    mat3.add(stub, "8",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[8] = stub["8"]}).listen()
    function restMat3(mat = M.var.customTransformMatrix){ 
        mat.identity();
        stub["0"] = 1
        stub["1"] = 0
        stub["2"] = 0
        stub["3"] = 0
        stub["4"] = 1
        stub["5"] = 0
        stub["6"] = 0
        stub["7"] = 0
        stub["8"] = 1
    }

    sim.close()
    sphere.close()
    mat3.close()
}
