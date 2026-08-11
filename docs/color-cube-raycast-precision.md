# Color Cube Raycast Precision Notes

## Summary

- `highp` should be the default for the binary-search raycast.
- `mediump` is borderline for transformed-space raycasts and will usually cap useful binary-search depth around `10` to `11` steps anyway.
- `lowp` is not suitable.
- Because the shader outputs RGB, the right convergence target is color error, not geometric error.
- For the current color-cube output, `10` steps is a good default and `11` is the practical upper bound if we want a safety margin.

## Built-In GLSL Precision Tiers

For fragment shaders, the relevant built-in precision options are `lowp`, `mediump`, and `highp`.

- `lowp`
  - Too coarse for this shader.
  - Not appropriate for ray-box intersection, inverse `mat3`, or binary-search boundary tests.
- `mediump`
  - Usually around half-float class precision.
  - On a unit-sized domain, practical resolution is roughly around `1 / 1024`.
  - This is enough for a short binary search, but not enough to justify many more refinement steps.
- `highp`
  - Preferred for transformed-space binary search.
  - Needed for stable entry/exit tests and inverse-transform membership checks.

## Why Transform Space Is Sensitive

The transformed-space path is more sensitive than the default path because it depends on:

- box intersection in ray space
- inverse transform evaluation
- comparisons against transformed unit-cube bounds
- repeated midpoint refinement

With shear-like `mat3` transforms, small floating-point errors move the sample across a hard inside/outside boundary. That is why transformed faces show artifacts before the default cube does.

## How Many Binary-Search Steps Do We Need?

### 1. The output is color

The current shader returns cube-local color directly:

`sampleColor = samplePoint - cubeMin`

That means binary-search error matters because it becomes RGB error.

So the correct question is not:

"How accurately did we find the surface in world space?"

It is:

"How small is the final RGB error on the output pixel?"

### 2. Worst-case interval size

The longest ray segment through a unit cube is its diagonal:

`sqrt(3) ~= 1.732`

After `N` binary-search steps, the remaining interval is approximately:

`1.732 / 2^N`

That is the worst-case position uncertainty along the ray.

### 3. Convert that to RGB error

Without any output-space transform, RGB comes directly from cube-local position, so channel error is on the same order as position error.

For an 8-bit output channel, one LSB is:

`1 / 255 ~= 0.00392`

Solve:

`1.732 / 2^N < 1 / 255`

This gives:

`N > log2(1.732 * 255) ~= 8.8`

So:

- `9` steps is the minimum that gets below one 8-bit color step in the no-transform case.
- `10` steps is the safer default.

### 4. Account for output-space transforms

`applyVisionTransform` mixes channels, so position error can be amplified into a larger channel error.

For the current matrices, the worst row-sum amplification is about `1.475`.

Using that worst case:

`1.732 / 2^N < 1 / (255 * 1.475)`

This gives:

`N > 9.35`

So:

- `10` steps is enough to stay under about one display LSB even after the current output transforms.
- `11` steps gives margin for precision loss and boundary tolerances.

## Precision-Limited Upper Bound

Even if we ask for more binary-search steps, lower float precision stops helping after a point.

For `mediump`, the useful precision on a unit interval is roughly around `0.001`.

That means:

- `10` steps already gets the interval down near the precision floor
- `11` steps may still be useful as a margin
- beyond that, extra steps are mostly wasted on `mediump`

So the practical step budget is:

- `highp`: `10` default, `11` max worth considering for this output
- `mediump`: `10` is already near the useful limit
- `lowp`: not viable

## Recommendation

For the current shader:

- keep the transformed-space binary-search path on `highp`
- use `10` binary-search steps as the default
- use `11` only if we still see visible banding or boundary wobble
- do not increase steps much beyond `11` unless the output target changes

## Since The Output Is RGB, How Should We Deal With That?

We should define convergence in output-color space, not just geometry space.

That leads to these rules:

- For normal on-screen rendering to an 8-bit color buffer, optimize until RGB error is below about one display LSB.
- Do not chase much more geometric precision than the framebuffer can show.
- If this pass becomes a data/debug pass where exact color values matter, render to a float target and then the step budget should be revisited.

In other words:

- screen color output: `10` to `11` steps is the correct range
- float/HDR/data output: reevaluate, because display quantization is no longer the limit

## Practical Conclusion

For the current Color Cube shader, the right answer is:

- prefer `highp`
- target `10` binary-search steps
- allow `11` as the upper practical bound
- treat RGB output resolution as the stopping criterion

That is enough precision for the visible result, and it matches the limit where lower fragment precision stops buying us anything.
