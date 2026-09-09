# todo

- [x] links
- [x] mobile first css
- [/] ssg
- [/] search params
- [x] always use leva oneLineLabels
- [ ] refrence links in footer
- [ ] readme.md
- [x] display current contrast
- [ ] move color space to UI
- [ ] darkmode?
- [ ] better ray march algo
    - [x] reduce number of steps
    - [x] use correct color format and matrix inverses
    - [x] better quantize fn?
    - [ ] merge into one file
- [x] shader compile time

# perf

| title           | desktop fps, ms | mobile fps, ms |
| --------------- | --------------- | -------------- |
| bracketed 3     | 120, 8          | 15, 69         |
| uniform format  | 120, 8          | 17, 60         |
| lum uniforms    | 120, 8          | 18, 55         |
| raycast branch  | 120, 8          | 20, 50         |
| quantize result | 120, 8          | 35, 26         |
