### Backround

I was intrigued by how blood pressure is measured using modern-day devices. After getting acquainted with the basic principles, I wanted to challenge myself to try to create a barebones simulation of the basic mechanisms of measuring blood pressure.

I ended up creating essentially a (fairly buggy) particle collision system with collapsing and expanding walls.

I used [p5.js](https://p5js.org/) to create the simulation.

### Run

`python3 -m http.server` and then open `localhost:8000` in your browser.

### Attributions

1. [Oscillatory Blood Pressure Monitoring Devices](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1121444/)
2. [atomizer's implementation of de Casteljau's algorithm](https://gist.github.com/atomizer/1049745)
3. [A particle collision system example on the p5.js website](https://p5js.org/examples/simulate-particle-system.html)

### Low-Res Demo

A known bug here is the occasional escaping of the blood particle from the confines of the arterial walls. See `sketch.js: 95` for more details.

!![blood_pressure_monitor_3](https://user-images.githubusercontent.com/20759715/112196448-0f206700-8c31-11eb-9555-208c243444d8.gif)
