# Contrast Color Picker

Though many color combinations are pleasing to the eye, not all of them work as readable font and background combinations. Which is why ([WCAG contrast](https://webaim.org/resources/contrastchecker/)) exists. The Color Picker displays colors in a sRGB cube that pass the WCAG guidelines for the selected color and contrast ratio.

I had a few questions that prompted this color picker:

- how many colors have an opposite color that pass?
- do any colors have both black and white backgrounds?
- can the volume reveal why certain color combinations are rarely seen or impossible to use, and why particular color schemes are so prevalent today?
- what does the volume look like?

## Modes

- `Font`: pick your font color, and the solver displays background colors that pass.
- `Background`: pick your background color, and the solver displays the font colors that pass.
- `Opposite`: pick a font color that has a passing complementary color for its background; or vice versa
- `Darkmode`: pick a font color for two different background colors, and the solver displays the intersection of both volumes.
- `None`: displays the color cube with no active search.

## Vision Options

- changes the output space to match different vison kernels
- crop color output to match differnt kernels.

Kernels avaliable:

- deuteranopia
- protanopia
- tritanopia
- custom

## Solver

The Volumetric Solver uses a custom shader to pathtrace into the color cube. It first finds a search interval with a ray marching approach, refines that interval with binary search, and then quantizes the result to the nearest passing color.

## Install

```bash
npm install
npm run dev
```

## Refrences

- [WebAIM contrast](https://webaim.org/articles/contrast/)
- [WebAIM contrast checker](https://webaim.org/resources/contrastchecker/)
- [Relative luminance](https://www.w3.org/TR/WCAG21/relative-luminance.html)
