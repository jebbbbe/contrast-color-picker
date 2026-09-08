# todo

- [x] links
- [x] mobile first css
- [ ] ssg
- [ ] search params
- [x] always use leva oneLineLabels
- [ ] refrence links in footer
- [ ] move color space to UI
- [ ] better ray march algo
    - [ ] reduce number of steps
    - [ ] use correct color format and matrix inverses
    - [ ] better quantize fn?
    - [ ] merge into one file
- [ ] shader compile time

# perf

| title           | desktop fps, ms | mobile fps, ms |
| --------------- | --------------- | -------------- |
| bracketed 3     | 120, 8          | 15, 69         |
| uniform format  | 120, 8          | 17, 60         |
| lum uniforms    | 120, 8          | 18, 55         |
| raycast branch  | 120, 8          | 20, 50         |
| quantize result | 120, 8          | 35, 26         |
