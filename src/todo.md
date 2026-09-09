# todo

- [x] links
- [x] mobile first css
- [/] ssg
- [/] search params
- [x] always use leva oneLineLabels
- [x] refrence links in footer
- [x] readme.md
- [x] display current contrast
- [x] move color space to UI
- [x] darkmode?
- [ ] better ray march algo
    - [x] reduce number of steps
    - [x] use correct color format and matrix inverses
    - [x] better quantize fn?
    - [ ] merge into one file
    - [ ] volume + d/dx
	- [ ] textures
- [x] shader compile time

# perf

| title           | desktop fps, ms | mobile fps, ms |
| --------------- | --------------- | -------------- |
| bracketed 3     | 120, 8          | 15, 69         |
| uniform format  | 120, 8          | 17, 60         |
| lum uniforms    | 120, 8          | 18, 55         |
| raycast branch  | 120, 8          | 20, 50         |
| quantize result | 120, 8          | 35, 26         |
