import * as THREE from "three";
// import { GUI } from 'dat.gui';
import { GUI } from 'lil-gui';
import { outputTargets, densityFunctions, transformModes, solutions } from "./constants.js"


export function addGui({ M, scene, sdfMaterial }) {
    let gui = new GUI({ width: 300 });
    gui.add(M.var, "turnTable").name("Spin")
    
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
    gui.add(M.var, "transformMode",transformModes).listen().onChange(() => {
        sdfMaterial.customUniforms.transformMode.value = M.var.transformMode;
    })
    gui.add(M.var, "visualizeSolution", solutions).listen().onChange(() => {
        sdfMaterial.customUniforms.visualizeSolution.value = M.var.visualizeSolution;
    })


    gui.add(M.var, "contrastRatio",0,21,0.001).listen().onChange(() => {
        sdfMaterial.customUniforms.contrastRatio.value = M.var.contrastRatio;
    })
    


    gui.addColor(M.var, "selectedColor").name("selected Color").listen().onChange(() => {
        sdfMaterial.customUniforms.selectedColor.value.set( M.var.selectedColor )
    })

    // didnt work in glsl, hiding UI options, can investigare later, tweening two cube cliped planes seems annoying
    // gui.add({fn:sdfMaxDistreset}, "fn").name("reset")
    // gui.add(M.var, "sdfMaxDist", 0,2).listen().onChange(() => {
    //     sdfMaterial.customUniforms.sdfMaxDist.value = M.var.sdfMaxDist;
    // })
    // gui.add(M.var, "sdfMinDist", 0,5).listen().onChange(() => {
    //     sdfMaterial.customUniforms.sdfMinDist.value = M.var.sdfMinDist;
    // })


    const sphere = gui.addFolder("Sphere")
    sphere.add(M.var.spherePos, "x", 0, 1).listen()
    sphere.add(M.var.spherePos, "y", 0, 1).listen()
    sphere.add(M.var.spherePos, "z", 0, 1).listen()
    sphere.add(M.var.spherePos, "w", 0, 1, 0.001).listen()

    const mat3 = gui.addFolder("Vision Options")

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
    mat3.add({fn:restMat3}, "fn").name("Default")
    mat3.add({fn:setProtanopiaMatrix}, "fn").name("Protanopia")
    mat3.add({fn:setDeuteranopiaMatrix}, "fn").name("Deuteranopia")
    mat3.add({fn:setTritanopiaMatrix}, "fn").name("Tritanopia")
    mat3.add({fn:setMonochromacyMatrix}, "fn").name("Monochromacy")
    mat3.add({fn:randomizeMat3Summation}, "fn").name("Random") // constrains sums found in columns of other mat3
    // mat3.add({fn:randomizeMat3}, "fn").name("randomize")
    const matVals = mat3.addFolder("Values")
    matVals.add(stub, "0",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[0] = stub["0"]}).listen()
    matVals.add(stub, "1",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[1] = stub["1"]}).listen()
    matVals.add(stub, "2",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[2] = stub["2"]}).listen()
    matVals.add(stub, "3",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[3] = stub["3"]}).listen()
    matVals.add(stub, "4",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[4] = stub["4"]}).listen()
    matVals.add(stub, "5",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[5] = stub["5"]}).listen()
    matVals.add(stub, "6",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[6] = stub["6"]}).listen()
    matVals.add(stub, "7",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[7] = stub["7"]}).listen()
    matVals.add(stub, "8",0,1,0.001).listen().onChange(() => { M.var.customTransformMatrix.elements[8] = stub["8"]}).listen()
    
    function setStub(mat = M.var.customTransformMatrix){
        stub["0"] = mat.elements[0]
        stub["1"] = mat.elements[1]
        stub["2"] = mat.elements[2]
        stub["3"] = mat.elements[3]
        stub["4"] = mat.elements[4]
        stub["5"] = mat.elements[5]
        stub["6"] = mat.elements[6]
        stub["7"] = mat.elements[7]
        stub["8"] = mat.elements[8]
    }
    function restMat3(mat = M.var.customTransformMatrix){ 
        mat.identity();
        setStub()
    }
    
    function randomizeMat3Summation(mat = M.var.customTransformMatrix){
        let e0 = Math.random();
        let e1 = Math.random();
        let e2 = Math.random();
        let e3 = Math.random();
        let e4 = Math.random();
        let e5 = Math.random();
        let e6 = Math.random();
        let e7 = Math.random();
        let e8 = Math.random();
        const s1 = e0 + e1 + e2;
        const s2 = e3 + e4 + e5;
        const s3 = e6 + e7 + e8;
        e0 = e0/s1      
        e1 = e1/s1      
        e2 = e2/s1      
        e3 = e3/s2     
        e4 = e4/s2     
        e5 = e5/s2 
        e6 = e6/s3      
        e7 = e7/s3      
        e8 = e8/s3
        mat.set(
            e0, e1, e2,
            e3, e4, e5,
            e6, e7, e8,
        );
        setStub()
    }
    function randomizeMat3(mat = M.var.customTransformMatrix){
        let e0 = Math.random();
        let e1 = Math.random();
        let e2 = Math.random();
        let e3 = Math.random();
        let e4 = Math.random();
        let e5 = Math.random();
        let e6 = Math.random();
        let e7 = Math.random();
        let e8 = Math.random();
        mat.set(
            e0, e1, e2,
            e3, e4, e5,
            e6, e7, e8,
        );
        setStub()
    }

    function setProtanopiaMatrix(mat = M.var.customTransformMatrix){
        mat.set(
            0.567, 0.558, 0.0,
            0.433, 0.442, 0.242,
            0.0,   0.0,   0.758
        )
        mat.transpose()
        setStub()
    }
    function setDeuteranopiaMatrix(mat = M.var.customTransformMatrix){
        mat.set(
            0.625, 0.7, 0.0,
            0.375, 0.3, 0.3,
            0.0,   0.0, 0.7
        )
        mat.transpose()
        setStub()
    }
    function setTritanopiaMatrix(mat = M.var.customTransformMatrix){
        mat.set(
            0.95,  0.433,  0.0 ,
            0.05, 0.567, 0.475 ,
            0.0,   0.0, 0.525
        )
        mat.transpose()
        setStub()
    }
    function setMonochromacyMatrix(mat = M.var.customTransformMatrix){
        mat.set(
            0.299, 0.299 ,0.299,
            0.587, 0.587 ,0.587,
            0.114, 0.114 ,0.114
        )
        mat.transpose()
        setStub()
    }

    sim.close()
    sphere.hide()
    mat3.open()
    matVals.close()

    function sdfMaxDistreset(){
        M.var.sdfMaxDist = 0.466
        M.var.sdfMinDist = 2.35
        sdfMaterial.customUniforms.sdfMaxDist.value = M.var.sdfMaxDist;
        sdfMaterial.customUniforms.sdfMinDist.value = M.var.sdfMinDist;
    }
}