# Contrast Color Picker

A Color Palette Picker with an interactive 3D view that shows colors matching a selected contrast ratio.

Though many color combinations are pleasing to the eye, not all provide enough contrast for readable text and backgrounds (see [WebAIM’s Contrast Checker](https://webaim.org/resources/contrastchecker/).) The Color Picker displays colors in a sRGB Volume that pass the WCAG guidelines for the selected color and contrast ratio.

## Motivation

- How many colors have a valid opposite color?
- Do any colors have both black and white backgrounds?
- Can the volume reveal why certain color schemes are rarely seen or impossible to use, and why particular schemes are so prevalent?
- What does the volume look like?

## Usage

### Modes

- `Font`: pick your font color, and the solver displays background colors that pass.
- `Background`: pick your background color, and the solver displays the font colors that pass.
- `Opposite`: pick a font color that has a passing complementary color for its background; or vice versa
- `Darkmode`: pick a font color for two different background colors, and the solver displays the intersection of both volumes.
- `None`: displays the color cube with no active search.

### Vision Options

- changes the output space to match different vison kernels
- crop color output to match differnt kernels.

Kernels avaliable:

- deuteranopia
- protanopia
- tritanopia

### Solver

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
