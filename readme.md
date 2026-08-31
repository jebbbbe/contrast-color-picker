# [Contrast Color Picker](https://www.contrastcolorpicker.com/)

Though many color combinations are pleasing to the eye, not every one will have the contrast needed to be accesible to users with visual disabilities. The Web Content Accessibility Guidelines ([WCAG contrast](https://webaim.org/resources/contrastchecker/)) outlines specific contrast requirements for text on background and this program allows web designers to visualize, pick, and preview accessible font and background color combinations in an interactive 3D viewer.

The viewer displays color volumes in sRGB that pass the WCAG guidelines for the selected color and contrast ratio.

## MODES

- `Font`: pick your font color, and the solver displays background colors that pass.
- `Background`: pick your background color, and the solver displays the font colors that pass.
- `Opposite`: pick a font color that has a passing complementary color for its background; or vice versa
- `Darkmode`: pick a font color for two different background colors, and the solver displays the intersection of both volumes.
- `None`: displays the color cube with no active search.

## VISION OPTIONS

- changes the output space to match different vison kernels
- crops color output to match differnt kernels.

Kernels avaliable:

- deuteranopia
- protanopia
- monochromacy
- tritanopia
- custom

## SOLVER

The Volumetric Solver uses a custom shader to pathtrace into the color cube. It first finds a search interval with a ray marching approach, refines that interval with binary search, and then quantizes the result to the nearest passing color.

## INSTALL

```bash
npm install
npm run dev
```

## REFERENCES

- WebAIM contrast checker: https://webaim.org/resources/contrastchecker/
