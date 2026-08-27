import { ShaderChunk } from "three"

import color from "./color.glsl?raw"
import quantize from "./quantize.glsl?raw"

// patch into shader chunk
const shaderChunk = ShaderChunk as Record<string, string>

shaderChunk["color_func"] = color
shaderChunk["quantize_func"] = quantize
