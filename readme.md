# [Contrast Color Picker](https://www.contrastcolorpicker.com/)

Pick accessible font and background color combinations and preview [WCAG contrast](https://webaim.org/resources/contrastchecker/) in an interactive 3d viewer.
The viewer displays the passing color volume in sRGB for the selected color and contrast ratio.

## modes

- `Font`: pick font color while the solver displays the background color.
- `Background`: pick background color while the solver displays the font color.
- `Opposite`: displays colors with passing opposite colors; clicking updates both.
- `Darkmode`: uses two background colors and displays the intersection of both volumes.
- `None`: displays the color cube with no active search.

## vision options

- change output space to match different vison kernels
- crop color output to match differnt kernels.

kernels avaliable:

- deuteranopia
- protanopia
- monochromacy
- tritanopia
- custom

## solver

The Volumetric Solver uses a custom shader to pathtrace into the color cube. First finding a search interval with a ray marching approach, refines that interval with binary search,then quantizes the result to the nearest passing color.

## install

```bash
npm install
npm run dev
```

## refrences

- WebAIM contrast checker: https://webaim.org/resources/contrastchecker/
