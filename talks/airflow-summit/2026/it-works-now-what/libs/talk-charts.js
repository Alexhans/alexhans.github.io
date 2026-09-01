/* ============================================================================
 * talk-charts.js — diagrams and charts for automated-bin-talk.qmd
 *
 * Two mechanisms, one event loop:
 *
 *  1. A generic step machine. Invisible reveal.js fragments
 *       <span class="fragment step" data-target="X" data-state="s" data-caption="...">
 *     drive state onto a target element (an inline SVG or a chart host). Inside a
 *     stateful SVG, anything carrying data-steps="s1 s2" stays lit for those
 *     states and dims otherwise; data-steps="_always" never dims. The caption for
 *     the active step is written into <div class="stepcap" data-for="X">, whose
 *     height is fixed in CSS so the diagram above it never jumps.
 *
 *  2. d3 charts, drawn on first view and re-animated when their slide is
 *     revisited. Each registers a draw fn and an optional onState hook so the
 *     same step fragments can also drive a chart.
 *
 * Two conventions worth knowing before editing:
 *
 *  - Every viewBox is 1120 units wide. That is the slide's content width, so the
 *    drawing lands 1:1 in slide coordinates and its height is exactly the H
 *    below. Widen the viewBox and the chart silently grows taller and overlaps
 *    whatever follows it.
 *  - Any axis a viewer could read as an authoritative price is expressed as a
 *    ratio to the first implementation. Absolute figures live in the speaker
 *    notes.
 * ========================================================================== */
(function () {
  "use strict";

  var CY = "#11e1ee",
    CY_DK = "#0a8f98",
    MUT = "#9aa0a6",
    INK = "#ececf0",
    BAD = "#ff5c47",
    WARN = "#ffb020",
    GOOD = "#27d67b",
    LINE = "#263038",
    DIM = 0.14;

  var W = 1120; // slide content width; see header note
  var FONT = '"Source Sans Pro", Helvetica, Arial, sans-serif';

  /* ---------------------------------------------------------------- registry */
  var CHARTS = {};

  function chart(id, draw, onState) {
    CHARTS[id] = { draw: draw, onState: onState || null };
  }

  function host(id, h) {
    var el = document.getElementById(id);
    if (!el) return null;
    var sel = d3.select(el);
    sel.selectAll("*").remove();
    return sel
      .append("svg")
      .attr("viewBox", "0 0 " + W + " " + h)
      .attr("preserveAspectRatio", "xMidYMid meet");
  }

  function label(g, x, y, text, opts) {
    opts = opts || {};
    return g
      .append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("fill", opts.fill || MUT)
      .attr("font-size", opts.size || 15)
      .attr("font-weight", opts.weight || 400)
      .attr("text-anchor", opts.anchor || "start")
      .attr("font-family", FONT)
      .text(text);
  }

  /* =========================================================== c-tokens
   * The harness swap: same model, same SKILL.md byte for byte.
   */
  chart("c-tokens", function () {
    var H = 300;
    var svg = host("c-tokens", H);
    if (!svg) return;
    var data = [
      { k: "coding agent reading the skill", v: 989639, rel: "1×", c: MUT, ink: "#fff" },
      { k: "Airflow task reading the same skill", v: 7019, rel: "141× fewer", c: CY, ink: "#04252a" }
    ];
    var X0 = 430,
      BW = W - X0 - 40;
    var x = d3.scaleLog().domain([1000, 1100000]).range([40, BW]);

    data.forEach(function (d, i) {
      var y = 74 + i * 104;
      label(svg, X0 - 20, y + 6, d.k, { anchor: "end", fill: INK, size: 18 });
      svg
        .append("rect")
        .attr("x", X0)
        .attr("y", y - 26)
        .attr("height", 52)
        .attr("rx", 5)
        .attr("fill", d.c)
        .attr("opacity", i ? 0.95 : 0.42)
        .attr("width", 0)
        .transition()
        .delay(200 + i * 260)
        .duration(760)
        .attr("width", x(d.v));

      svg
        .append("text")
        .attr("x", X0 + 14)
        .attr("y", y + 8)
        .attr("fill", d.ink)
        .attr("font-size", 23)
        .attr("font-weight", 800)
        .attr("font-family", FONT)
        .attr("opacity", 0)
        .text(d.rel)
        .transition()
        .delay(700 + i * 260)
        .duration(300)
        .attr("opacity", 1);
    });

    label(svg, X0, 238, "tokens per run, log scale", { size: 14 });
    label(svg, 0, H - 34, "The same model read the same markdown.", {
      fill: CY,
      size: 21,
      weight: 600
    });
    label(svg, 0, H - 8, "Only the harness around it changed.", {
      fill: CY,
      size: 21,
      weight: 600
    });
  });

  /* =========================================================== c-ladder
   * Fourteen models against the identical exam. x = cost per run relative to
   * the frontier model (log), y = runs passed, radius = wall clock.
   * Label positions are hand-placed: the passing row is crowded between 1/100
   * and 1/40, so labels alternate above and below to stay legible.
   */
  chart("c-ladder", function () {
    var H = 430;
    var svg = host("c-ladder", H);
    if (!svg) return;
    var M = { t: 34, r: 168, b: 66, l: 62 };
    var iw = W - M.l - M.r,
      ih = H - M.t - M.b;
    var g = svg.append("g").attr("transform", "translate(" + M.l + "," + M.t + ")");

    var pts = [
      { m: "opus-5", rel: 1.0, pass: 3, s: 18.6, pos: "up" },
      { m: "deepseek v3.2", rel: 0.0945, pass: 3, s: 6.3, pos: "up" },
      { m: "mistral-large-3", rel: 0.0572, pass: 3, s: 2.6, pos: "dn" },
      { m: "ministral-3-8b", rel: 0.0224, pass: 2, s: 2.7, pos: "up", dx: 46 },
      { m: "gpt-oss-120b", rel: 0.0174, pass: 3, s: 5.1, pos: "dn" },
      { m: "gpt-oss-20b", rel: 0.00995, pass: 3, s: 4.4, pos: "up" },
      { m: "qwen3-32b", rel: 0.0199, pass: 2, s: 3.8, pos: "dn", dx: -46 },
      { m: "ministral-3-3b", rel: 0.0124, pass: 1, s: 2.2, pos: "up" },
      { m: "llama3-1-8b", rel: 0.00249, pass: 0, s: 3.5, pos: "up" }
    ];

    var x = d3.scaleLog().domain([0.0016, 1.7]).range([0, iw]);
    var y = d3.scaleLinear().domain([-0.45, 3.45]).range([ih, 0]);
    var r = d3.scaleSqrt().domain([2, 19]).range([9, 23]);

    [0, 1, 2, 3].forEach(function (p) {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", iw)
        .attr("y1", y(p))
        .attr("y2", y(p))
        .attr("stroke", p === 3 ? "#2f4a4d" : LINE)
        .attr("stroke-dasharray", p === 3 ? null : "3 5");
      label(g, -14, y(p) + 6, p + "/3", {
        anchor: "end",
        size: 16,
        fill: p === 3 ? CY : MUT
      });
    });
    label(g, -14, -14, "runs passed", { anchor: "end", size: 13 });
    label(g, iw, -14, "bubble size = wall clock", { anchor: "end", size: 13 });

    [
      [1, "1×"],
      [0.1, "1/10"],
      [0.01, "1/100"],
      [0.0025, "1/400"]
    ].forEach(function (t) {
      g.append("line")
        .attr("x1", x(t[0]))
        .attr("x2", x(t[0]))
        .attr("y1", 0)
        .attr("y2", ih)
        .attr("stroke", LINE)
        .attr("stroke-dasharray", "2 6");
      label(g, x(t[0]), ih + 26, t[1], { anchor: "middle", size: 16 });
    });
    label(g, 0, ih + 52, "← cheaper", { size: 14, fill: "#7d868c" });
    label(g, iw, ih + 52, "cost per run, relative to the frontier model", {
      anchor: "end",
      size: 14
    });

    var node = g
      .selectAll(".pt")
      .data(pts)
      .enter()
      .append("g")
      .attr("transform", function (d) {
        return "translate(" + x(d.rel) + "," + y(d.pass) + ")";
      });

    node
      .append("circle")
      .attr("r", 0)
      .attr("fill", function (d) {
        return d.pass === 3 ? CY : d.pass === 0 ? BAD : WARN;
      })
      .attr("opacity", 0.85)
      .attr("stroke", "#0c0d0f")
      .attr("stroke-width", 2)
      .transition()
      .delay(function (d, i) {
        return 120 + i * 85;
      })
      .duration(400)
      .attr("r", function (d) {
        return r(d.s);
      });

    node
      .append("text")
      // dx nudges a label sideways. Needed where two points are close enough on the
      // log axis that a centred label does not say which bubble it belongs to:
      // qwen3-32b and ministral-3-8b differ by 12% in cost, about 18px apart, so
      // their bubbles nearly touch. Each label is pushed towards its own side.
      .attr("x", function (d) {
        return d.dx || 0;
      })
      .attr("y", function (d) {
        return d.pos === "up" ? -r(d.s) - 11 : r(d.s) + 22;
      })
      .attr("text-anchor", "middle")
      .attr("fill", function (d) {
        return d.pass === 3 ? "#dff8fa" : d.pass === 0 ? "#ffc9c1" : "#ffe1ab";
      })
      .attr("font-size", 15)
      .attr("font-family", FONT)
      .attr("opacity", 0)
      .text(function (d) {
        return d.m;
      })
      .transition()
      .delay(function (d, i) {
        return 380 + i * 85;
      })
      .duration(300)
      .attr("opacity", 1);

    // Ring the punchline and lead a callout down into the empty middle.
    var hi = pts.filter(function (d) {
      return d.m === "gpt-oss-20b";
    })[0];
    var hx = x(hi.rel),
      hy = y(hi.pass),
      hr = r(hi.s) + 12;
    var ring = g
      .append("g")
      .attr("opacity", 0);
    ring
      .append("circle")
      .attr("cx", hx)
      .attr("cy", hy)
      .attr("r", hr)
      .attr("fill", "none")
      .attr("stroke", CY)
      .attr("stroke-width", 2);
    // Lead down then right into the empty band below 1/3, clear of the
    // ministral-3-3b marker that sits just right of the ring.
    var cx = hx + 180,
      cy = y(0.62);
    ring
      .append("path")
      .attr("d", "M" + hx + " " + (hy + hr) + " V " + (cy - 22) + " H " + (cx - 14))
      .attr("stroke", CY)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4 4")
      .attr("fill", "none");
    label(ring, cx, cy - 28, "open weights,", { fill: "#fff", size: 17, weight: 600 });
    label(ring, cx, cy - 6, "passes every run,", { fill: "#fff", size: 17, weight: 600 });
    label(ring, cx, cy + 16, "~1/100 the cost", { fill: CY, size: 17, weight: 700 });
    ring.transition().delay(1250).duration(500).attr("opacity", 1);

    label(g, iw + 16, y(1) + 6, "answered wrongly", { fill: "#ffe1ab", size: 15 });
    label(g, iw + 16, y(0) - 4, "never produced", { fill: "#ffc9c1", size: 15 });
    label(g, iw + 16, y(0) + 16, "a valid answer", { fill: "#ffc9c1", size: 15 });
  });

  /* =========================================================== c-less
   * Moving one field out of the model. Pass counts only, no cost.
   */
  chart("c-less", function () {
    var H = 400;
    var svg = host("c-less", H);
    if (!svg) return;
    var XA = 330,
      XB = 720,
      XC = 960;
    var y = d3.scaleLinear().domain([-0.3, 3.3]).range([H - 96, 54]);

    [0, 1, 2, 3].forEach(function (p) {
      svg
        .append("line")
        .attr("x1", 190)
        .attr("x2", XC + 20)
        .attr("y1", y(p))
        .attr("y2", y(p))
        .attr("stroke", LINE)
        .attr("stroke-dasharray", "3 6");
      label(svg, 170, y(p) + 6, p + "/3", { anchor: "end", size: 16 });
    });

    label(svg, XA, 28, "model decides", { anchor: "middle", fill: INK, size: 18, weight: 600 });
    label(svg, XB, 28, "Python decides", { anchor: "middle", fill: INK, size: 18, weight: 600 });
    label(svg, XC, 28, "no inference", { anchor: "middle", fill: CY, size: 18, weight: 700 });

    // dy separates the two flat rows that would otherwise sit on the same line
    var rows = [
      { m: "seven models", a: 3, b: 3, up: false, dy: -16 },
      { m: "qwen3-32b", a: 2, b: 2, up: false, dy: -16 },
      { m: "ministral-3-8b", a: 2, b: 3, up: true, dy: 0 },
      { m: "ministral-3-3b", a: 1, b: 2, up: true, dy: 0 },
      { m: "llama3-1-8b", a: 0, b: 1, up: true, dy: 0 }
    ];

    rows.forEach(function (d, i) {
      var col = d.up ? GOOD : MUT;
      var ya = y(d.a) + d.dy,
        yb = y(d.b) + d.dy;
      var path = svg
        .append("path")
        .attr(
          "d",
          "M" + XA + " " + ya + " C " + (XA + 140) + " " + ya + ", " + (XB - 140) + " " + yb + ", " + XB + " " + yb
        )
        .attr("stroke", col)
        .attr("stroke-width", d.up ? 3.5 : 2)
        .attr("fill", "none")
        .attr("opacity", d.up ? 0.95 : 0.45);
      var L = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", L + " " + L)
        .attr("stroke-dashoffset", L)
        .transition()
        .delay(200 + i * 120)
        .duration(700)
        .attr("stroke-dashoffset", 0);

      [
        [XA, ya],
        [XB, yb]
      ].forEach(function (p, j) {
        svg
          .append("circle")
          .attr("cx", p[0])
          .attr("cy", p[1])
          .attr("r", 0)
          .attr("fill", col)
          .transition()
          .delay(200 + i * 120 + j * 380)
          .duration(220)
          .attr("r", d.up ? 7 : 5);
      });

      label(svg, XA - 24, ya + 6, d.m, {
        anchor: "end",
        size: 16,
        fill: d.up ? "#d6ffe8" : MUT,
        weight: d.up ? 600 : 400
      });
      if (d.up) label(svg, XB + 18, yb + 7, "↑", { size: 20, fill: GOOD, weight: 800 });
    });

    svg
      .append("line")
      .attr("x1", XB + 44)
      .attr("x2", XC - 22)
      .attr("y1", y(3))
      .attr("y2", y(3))
      .attr("stroke", CY)
      .attr("stroke-dasharray", "4 5")
      .attr("opacity", 0)
      .transition()
      .delay(1300)
      .duration(400)
      .attr("opacity", 0.7);
    svg
      .append("circle")
      .attr("cx", XC)
      .attr("cy", y(3))
      .attr("r", 0)
      .attr("fill", CY)
      .transition()
      .delay(1300)
      .duration(400)
      .attr("r", 11);

    label(svg, 250, H - 44, "passed every run", {
      anchor: "end",
      fill: INK,
      size: 17,
      weight: 600
    });
    label(svg, XA, H - 44, "7 of 14", { anchor: "middle", fill: MUT, size: 20, weight: 700 });
    label(svg, XB, H - 44, "8 of 14", { anchor: "middle", fill: GOOD, size: 20, weight: 700 });
    label(svg, XC, H - 44, "3 of 3", { anchor: "middle", fill: CY, size: 20, weight: 700 });
    label(svg, 190, H - 14, "The bottom of the ladder came up, and every row got cheaper.", {
      size: 15
    });
  });

  /* =========================================================== c-rows
   * The four implementations, three small multiples, every bar a ratio to the
   * first one. Zero is a floor marker rather than a bar of no height.
   */
  chart("c-rows", function () {
    var H = 400;
    var svg = host("c-rows", H);
    if (!svg) return;

    var series = [
      { t: "cost per run", v: [1, 0.0474, 0.0448, 0], c: CY },
      { t: "wall clock", v: [1, 0.1016, 0.0951, 0.0098], c: GOOD },
      { t: "tokens", v: [1, 0.0071, 0.0068, 0], c: WARN }
    ];
    var names = ["01", "02", "05", "06"];

    var PT = 58,
      PH = 224,
      COL = 64,
      bw = 44,
      PANEL = 350;
    var y = d3.scaleLog().domain([0.004, 1.6]).range([PH, 0]).clamp(true);

    series.forEach(function (s, si) {
      var gx = 92 + si * PANEL;
      var g = svg.append("g").attr("transform", "translate(" + gx + "," + PT + ")");
      label(g, 0, -20, s.t, { fill: "#fff", size: 19, weight: 600 });

      [
        [1, "1×"],
        [0.1, "1/10"],
        [0.01, "1/100"]
      ].forEach(function (t) {
        label(g, -12, y(t[0]) + 5, t[1], { anchor: "end", size: 13 });
        g.append("line")
          .attr("x1", -6)
          .attr("x2", COL * 4 - 8)
          .attr("y1", y(t[0]))
          .attr("y2", y(t[0]))
          .attr("stroke", LINE)
          .attr("stroke-dasharray", "2 6");
      });

      g.append("line")
        .attr("x1", -6)
        .attr("x2", COL * 4 - 8)
        .attr("y1", PH)
        .attr("y2", PH)
        .attr("stroke", "#3a464d");

      s.v.forEach(function (v, i) {
        var cx = i * COL + 6;
        if (v <= 0) {
          g.append("line")
            .attr("x1", cx)
            .attr("x2", cx + bw)
            .attr("y1", PH)
            .attr("y2", PH)
            .attr("stroke", s.c)
            .attr("stroke-width", 6)
            .attr("opacity", 0)
            .transition()
            .delay(880 + si * 110)
            .duration(400)
            .attr("opacity", 1);
          g.append("text")
            .attr("x", cx + bw / 2)
            .attr("y", PH + 22)
            .attr("text-anchor", "middle")
            .attr("fill", s.c)
            .attr("font-size", 16)
            .attr("font-weight", 800)
            .attr("font-family", FONT)
            .attr("opacity", 0)
            .text("zero")
            .transition()
            .delay(960 + si * 110)
            .duration(400)
            .attr("opacity", 1);
          return;
        }
        var top = y(v);
        g.append("rect")
          .attr("x", cx)
          .attr("width", bw)
          .attr("rx", 3)
          .attr("y", PH)
          .attr("height", 0)
          .attr("fill", s.c)
          .attr("opacity", i === 0 ? 0.5 : 0.92)
          .transition()
          .delay(180 + si * 110 + i * 85)
          .duration(600)
          .attr("y", top)
          .attr("height", PH - top);
      });

      // per-panel implementation labels, directly under their bars
      names.forEach(function (n, i) {
        label(g, i * COL + 6 + bw / 2, PH + 44, n, {
          anchor: "middle",
          size: 16,
          fill: i === 3 ? CY : MUT,
          weight: i === 3 ? 700 : 400
        });
      });
    });

    label(
      svg,
      92,
      H - 34,
      "01 coding agent + markdown skill · 02 agent inside a DAG · 05 agent extracts, Python decides · 06 no inference",
      { size: 14 }
    );
    label(svg, 92, H - 8, "Every bar is a ratio to implementation 01. All four pass the identical exam.", {
      size: 16,
      fill: CY
    });
  });

  /* =========================================================== c-share
   * Where the twelve seconds went.
   */
  chart("c-share", function () {
    var H = 300;
    var svg = host("c-share", H);
    if (!svg) return;
    var X0 = 250,
      BW = 700;
    var x = d3.scaleLinear().domain([0, 12.4]).range([0, BW]);

    var bars = [
      { lab: "agent in the DAG", infer: 12.28, orch: 0.12, y: 96 },
      { lab: "no inference", infer: 0, orch: 1.2, y: 176 }
    ];

    bars.forEach(function (b, i) {
      label(svg, X0 - 20, b.y + 8, b.lab, { anchor: "end", fill: INK, size: 19 });
      if (b.infer > 0) {
        svg
          .append("rect")
          .attr("x", X0)
          .attr("y", b.y - 20)
          .attr("height", 42)
          .attr("rx", 4)
          .attr("fill", WARN)
          .attr("opacity", 0.85)
          .attr("width", 0)
          .transition()
          .delay(200)
          .duration(800)
          .attr("width", x(b.infer));
      }
      svg
        .append("rect")
        .attr("x", X0 + x(b.infer))
        .attr("y", b.y - 20)
        .attr("height", 42)
        .attr("rx", 3)
        .attr("fill", CY)
        .attr("width", 0)
        .transition()
        .delay(i ? 500 : 900)
        .duration(500)
        .attr("width", Math.max(4, x(b.orch)));
    });

    var hx = X0 + x(12.28);
    svg
      .append("path")
      .attr("d", "M" + (hx + 3) + " 68 V 44 H " + (hx + 120))
      .attr("stroke", CY)
      .attr("fill", "none")
      .attr("opacity", 0)
      .transition()
      .delay(1400)
      .duration(400)
      .attr("opacity", 0.85);
    label(svg, hx + 128, 50, "everything Airflow did", { fill: CY, size: 17, weight: 700 });

    label(svg, X0, 236, "inference", { fill: WARN, size: 16, weight: 600 });
    label(svg, X0 + 108, 236, "·  orchestration, branching, cross-run state", { fill: CY, size: 16 });
    label(svg, X0, 276, "Airflow's own work took about a tenth of a second out of twelve.", {
      fill: "#fff",
      size: 20,
      weight: 600
    });
  });

  /* =========================================================== c-cases
   * Twelve recorded days across a festive period, scored two ways. Driven by
   * step fragments: unscored -> naive -> ask the source.
   */
  var CASES = [
    { d: "15 Dec", naive: 1, note: "ordinary week" },
    { d: "17 Dec", naive: 1, note: "nothing tomorrow" },
    { d: "22 Dec", naive: 1, note: "ordinary week" },
    { d: "28 Dec", naive: 0, note: "pulled forward to Monday" },
    { d: "29 Dec", naive: 0, note: "already collected today" },
    { d: "2 Jan", naive: 0, note: "Saturday collection" },
    { d: "5 Jan", naive: 0, note: "no festive cue" },
    { d: "7 Jan", naive: 1, note: "Thursday collection" },
    { d: "12 Jan", naive: 0, note: "fortnight already ran" },
    { d: "14 Jan", naive: 1, note: "nothing tomorrow" },
    { d: "19 Jan", naive: 0, note: "schedule resynced" },
    { d: "26 Jan", naive: 1, note: "back to normal" }
  ];

  function casesDraw(state) {
    var H = 340;
    var svg = host("c-cases", H);
    if (!svg) return;
    var CW = 172,
      CH = 108,
      GX = 15,
      GY = 20;

    CASES.forEach(function (c, i) {
      var col = i % 6,
        row = (i / 6) | 0;
      var x = col * (CW + GX),
        y = 44 + row * (CH + GY);
      var pass = state === "naive" ? c.naive === 1 : state === "source" ? true : null;
      var fill = pass ? "#12312a" : "#3a1714";
      var stroke = pass ? GOOD : BAD;

      var g = svg.append("g").attr("transform", "translate(" + x + "," + y + ")");
      g.append("rect")
        .attr("width", CW)
        .attr("height", CH)
        .attr("rx", 8)
        .attr("fill", "#171b1f")
        .attr("stroke", LINE)
        .attr("stroke-width", 1.5);
      if (pass !== null) {
        g.append("rect")
          .attr("width", CW)
          .attr("height", CH)
          .attr("rx", 8)
          .attr("fill", fill)
          .attr("stroke", stroke)
          .attr("stroke-width", 2)
          .attr("opacity", 0)
          .transition()
          .delay(50 + i * 42)
          .duration(260)
          .attr("opacity", 1);
      }
      g.append("text")
        .attr("x", 13)
        .attr("y", 28)
        .attr("fill", "#fff")
        .attr("font-size", 18)
        .attr("font-weight", 600)
        .attr("font-family", FONT)
        .text(c.d);
      if (pass !== null) {
        g.append("text")
          .attr("x", CW - 13)
          .attr("y", 29)
          .attr("text-anchor", "end")
          .attr("fill", pass ? GOOD : BAD)
          .attr("font-size", 21)
          .attr("font-weight", 800)
          .attr("font-family", FONT)
          .attr("opacity", 0)
          .text(pass ? "✓" : "✗")
          .transition()
          .delay(50 + i * 42)
          .duration(260)
          .attr("opacity", 1);
      }
      // wrap the note onto two lines
      var words = c.note.split(" "),
        l1 = [],
        l2 = [];
      words.forEach(function (w) {
        (l1.join(" ").length + w.length < 19 ? l1 : l2).push(w);
      });
      [l1, l2].forEach(function (ln, k) {
        if (!ln.length) return;
        g.append("text")
          .attr("x", 13)
          .attr("y", 58 + k * 21)
          .attr("fill", MUT)
          .attr("font-size", 14)
          .attr("font-family", FONT)
          .text(ln.join(" "));
      });
    });

    var msg =
      state === "naive"
        ? "assume it is always the same weekday:  6 of 12"
        : state === "source"
          ? "ask the council every time, never compute the schedule:  12 of 12"
          : "twelve recorded days, each with its answer written down when it was recorded";
    label(svg, 0, 22, msg, {
      fill: state === "naive" ? BAD : state === "source" ? GOOD : MUT,
      size: 19,
      weight: 600
    });
  }
  chart(
    "c-cases",
    function () {
      var el = document.getElementById("c-cases");
      casesDraw(el && el.dataset.state ? el.dataset.state : null);
    },
    function (state) {
      casesDraw(state);
    }
  );

  /* =========================================================== c-morph
   * The same job, four ways, as one graph that rearranges itself.
   *
   * Nodes are keyed by id across the four states, so anything that survives a
   * transition SLIDES to its new position instead of being redrawn. That is the
   * whole point: you watch `answer` stop being the end of the flow and become an
   * input to a decision, and you watch `me` travel from the left-hand side,
   * where the human starts the work, to the right-hand side, where the human is
   * merely told. Edges are keyed too and interpolate their path data.
   *
   * The `real` state is traced off the actual DAG's graph view, including the
   * two branches that were skipped on the run in the screenshot.
   */
  var MID = 152;

  var MORPH = {
    /* ---- 1. a person doing it by hand ---------------------------------- */
    human: {
      nodes: [
        { id: "me", kind: "person", x: 18, y: MID - 34, w: 48, h: 68 },
        { id: "web", kind: "manual", x: 110, y: MID - 34, w: 140, h: 68, t: ["council", "website"] },
        { id: "pc", kind: "manual", x: 290, y: MID - 34, w: 140, h: 68, t: ["type your", "postcode"] },
        { id: "addr", kind: "manual", x: 470, y: MID - 34, w: 150, h: 68, t: ["pick your", "address"] },
        { id: "read", kind: "manual", x: 660, y: MID - 34, w: 140, h: 68, t: ["read the", "date"] },
        { id: "answer", kind: "answer", x: 840, y: MID - 34, w: 180, h: 68, t: ["27 Aug", "recycling"] },
        { id: "remember", kind: "manual", x: 840, y: MID + 72, w: 180, h: 58, t: ["remember on the night"] }
      ],
      edges: [
        { f: "me", t: "web" }, { f: "web", t: "pc" }, { f: "pc", t: "addr" },
        { f: "addr", t: "read" }, { f: "read", t: "answer" },
        { f: "answer", t: "remember", v: 1 }
      ],
      notes: [
        { x: 110, y: MID - 52, s: "every box in this row is you", c: MUT, z: 15 },
        { x: 840, y: MID + 156, s: "Miss it and the bin waits another two weeks.", c: BAD, z: 17, w: 600 }
      ]
    },

    /* ---- 2. the person calls an agent skill ---------------------------- */
    skill: {
      nodes: [
        { id: "me", kind: "person", x: 18, y: MID - 34, w: 48, h: 68 },
        { id: "skill", kind: "skill", x: 130, y: MID - 34, w: 220, h: 68, t: ["/bin-skill"], mono: 1 },
        { id: "qbox", kind: "qbox", x: 430, y: MID - 46, w: 200, h: 92, t: ["[...]"] },
        { id: "answer", kind: "answer", x: 750, y: MID - 34, w: 180, h: 68, t: ["27 Aug", "recycling"] }
      ],
      edges: [{ f: "me", t: "skill" }, { f: "skill", t: "qbox" }, { f: "qbox", t: "answer" }],
      notes: [
        { x: 130, y: MID + 62, s: "still starts with you", c: MUT, z: 16 },
        { x: 430, y: MID + 74, s: "", c: MUT, z: 16 },
        { x: 750, y: MID - 52, s: "same answer", c: CY, z: 16, weight: 700 }
      ]
    },

    /* ---- 3. unattended: a schedule, a decision, a notifier -------------
     * Geometry is held in step with H2S.dag in reduced-charts.js, which draws
     * the same picture on "From Agent Skill to Airflow Dag". Same 1120-unit
     * width, so the x values and the widths are that object's numbers verbatim;
     * the y values are its numbers re-expressed against MID, which is where
     * this chart keeps its main row across all four states. Not ported: that
     * slide's stats row and its "now happens every day" note. The numbers were
     * spent there; the measurement under this slide is the inference bar.
     */
    dag: {
      nodes: [
        { id: "clock", kind: "clock", x: 18, y: MID - 32, w: 48, h: 64 },
        { id: "ask", kind: "task", x: 96, y: MID - 32, w: 156, h: 64, t: ["ask the", "agent"] },
        { id: "answer", kind: "answer", x: 292, y: MID - 32, w: 162, h: 64, t: ["27 Aug", "recycling"] },
        { id: "decide", kind: "branch", x: 494, y: MID - 32, w: 172, h: 64, t: ["decide whether", "to alert"] },
        { id: "nothing", kind: "task", x: 706, y: MID - 102, w: 176, h: 60, t: ["note why", "nothing is due"] },
        { id: "notify", kind: "notify", x: 706, y: MID + 40, w: 176, h: 60, t: ["send the", "reminder"] },
        { id: "me", kind: "person", x: 922, y: MID + 42, w: 48, h: 56 }
      ],
      edges: [
        { f: "clock", t: "ask" }, { f: "ask", t: "answer" }, { f: "answer", t: "decide" },
        { f: "decide", t: "nothing" }, { f: "decide", t: "notify" }, { f: "notify", t: "me" }
      ],
      notes: [
        { x: 494, y: MID + 146, s: "decision logic is plain Python. Unit-testable.", c: GOOD, z: 16 },
        { x: 902, y: MID + 140, s: "Airflow sends the notification, not the agent.", c: MUT, z: 15 }
      ],
      brace: { x1: 494, x2: 882, y: MID + 120 }
    },

    /* ---- 4. the one that actually runs -------------------------------- */
    real: {
      nodes: [
        /* The clock is the same node at the same coordinates as in `dag`, so it
         * does not move across the 2 -> 3 step: it holds still as an anchor while
         * the row rearranges around it, which is what makes the two unattended
         * states read as opening the same way. It replaces a "daily run" text
         * note, and the cadence is stated in words on the earlier Airflow slide.
         *
         * Room for it was taken from the four loosest-padded boxes rather than
         * spread evenly: `check` and `find` are the tight ones and keep their
         * widths. `decide` also keeps its 148 deliberately -- see below. */
        { id: "clock", kind: "clock", x: 18, y: MID - 32, w: 48, h: 64 },
        { id: "check", kind: "task", x: 82, y: MID - 30, w: 148, h: 60, t: ["check the", "collection schedule"] },
        { id: "find", kind: "task", x: 246, y: MID - 30, w: 160, h: 60, t: ["find the next", "upcoming collection"] },
        /* Width pinned at 148. renderMorph redraws a surviving box at its final
         * width at t=0 while interpolating its edges from the old path, so any
         * surviving edge whose source box changed width sits detached for the
         * whole transition. `decide > nothing` is the only edge that survives
         * 2 -> 3, so this width is the entire artefact: 148 keeps it at the 16.6
         * screen px it already is today, and narrowing further would grow it. */
        { id: "decide", kind: "branch", x: 422, y: MID - 30, w: 148, h: 60, t: ["decide whether", "to alert"] },
        { id: "nothing", kind: "task", x: 588, y: MID - 124, w: 154, h: 58, dim: 1, t: ["note why nothing", "needs saying yet"] },
        { id: "alertnow", kind: "task", x: 588, y: MID - 30, w: 154, h: 58, dim: 1, t: ["alert now —", "schedule changed"] },
        { id: "pick", kind: "task", x: 588, y: MID + 64, w: 154, h: 58, t: ["pick tonight's", "reminder time"] },
        { id: "wait", kind: "sensor", x: 760, y: MID + 64, w: 136, h: 58, t: ["wait until", "reminder time"] },
        { id: "send", kind: "notify", x: 914, y: MID + 64, w: 108, h: 58, t: ["send the", "reminder"] },
        { id: "me", kind: "person", x: 1038, y: MID + 66, w: 44, h: 54 }
      ],
      edges: [
        { f: "clock", t: "check" },
        { f: "check", t: "find" }, { f: "find", t: "decide" },
        { f: "decide", t: "nothing" }, { f: "decide", t: "alertnow" }, { f: "decide", t: "pick" },
        { f: "pick", t: "wait" }, { f: "wait", t: "send" }, { f: "send", t: "me" }
      ],
      notes: [
        /* Follows `wait`'s left edge so it stays flush with the sensor it
         * describes. It reaches 1092 of 1120 and overhangs the person by about
         * 10 units; x 750 would end it exactly at the person. */
        { x: 760, y: MID + 140, s: "DateTimeSensorAsync — deferred, holding no worker", c: CY, z: 15 }
      ]
    }
  };

  var MORPH_ORDER = ["human", "skill", "dag", "real"];

  var KIND = {
    manual: { fill: "#14171b", stroke: "#4a565e", dash: "5 4", text: MUT, sw: 1.5 },
    skill: { fill: "#14171b", stroke: CY_DK, dash: null, text: CY, sw: 2 },
    qbox: { fill: "#14171b", stroke: CY, dash: null, text: CY, sw: 2.5 },
    answer: { fill: "#0e2b2f", stroke: CY, dash: null, text: "#dff8fa", sw: 2 },
    task: { fill: "#171b1f", stroke: "#38474f", dash: null, text: INK, sw: 1.8 },
    branch: { fill: "#171b1f", stroke: "#5b6b74", dash: null, text: INK, sw: 1.8 },
    notify: { fill: "#122420", stroke: GOOD, dash: null, text: "#d6ffe8", sw: 2 },
    sensor: { fill: "#171b1f", stroke: CY, dash: "6 4", text: INK, sw: 1.8 }
  };

  function edgePath(a, b, vert) {
    if (vert) {
      var x = a.x + a.w / 2;
      return "M" + x + " " + (a.y + a.h) + " C " + x + " " + (a.y + a.h + 22) + ", " +
        x + " " + (b.y - 22) + ", " + x + " " + b.y;
    }
    var x1 = a.x + a.w,
      y1 = a.y + a.h / 2,
      x2 = b.x,
      y2 = b.y + b.h / 2;
    var dx = Math.max(26, (x2 - x1) * 0.45);
    return "M" + x1 + " " + y1 + " C " + (x1 + dx) + " " + y1 + ", " + (x2 - dx) + " " + y2 + ", " + x2 + " " + y2;
  }

  ["c-morph", "c-morph2", "c-morph3", "c-morph4"].forEach(function (MID_ID) {
  chart(
    MID_ID,
    function () {
      var el = document.getElementById(MID_ID);
      if (!el) return;
      // Full rebuild only on first draw / slide re-entry; state changes animate.
      d3.select(el).selectAll("*").remove();
      var svg = d3
        .select(el)
        .append("svg")
        .attr("viewBox", "0 0 " + W + " 380")
        .attr("preserveAspectRatio", "xMidYMid meet");

      var defs = svg.append("defs");
      defs
        .append("marker")
        .attr("id", "abt-arrow")
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 9)
        .attr("refY", 5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto-start-reverse")
        .append("path")
        .attr("d", "M 0 0 L 10 5 L 0 10 z")
        .attr("fill", "#5b6b74");

      svg.append("g").attr("class", "m-edges");
      svg.append("g").attr("class", "m-brace");
      svg.append("g").attr("class", "m-nodes");
      svg.append("g").attr("class", "m-notes");
      el.__svg = svg;
      renderMorph(MID_ID, el.dataset.state || el.dataset.initial || "human", false);
    },
    function (state) {
      var e = document.getElementById(MID_ID);
      renderMorph(MID_ID, state || (e && e.dataset.initial) || "human", true);
    }
  );
  });

  function renderMorph(id, state, animate) {
    var el = document.getElementById(id);
    if (!el || !el.__svg) return;
    if (MORPH_ORDER.indexOf(state) < 0) state = "human";
    var svg = el.__svg;
    var spec = MORPH[state];
    var D = animate ? 780 : 0;
    var byId = {};
    spec.nodes.forEach(function (n) {
      byId[n.id] = n;
    });

    /* ---- edges ---- */
    var ed = svg
      .select(".m-edges")
      .selectAll("path")
      .data(spec.edges, function (d) {
        return d.f + ">" + d.t;
      });
    ed.exit().transition().duration(D / 2).attr("opacity", 0).remove();
    var edEnter = ed
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#4a5a63")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#abt-arrow)")
      .attr("opacity", 0)
      .attr("d", function (d) {
        return edgePath(byId[d.f], byId[d.t], d.v);
      });
    edEnter.transition().delay(D * 0.45).duration(D * 0.5).attr("opacity", 1);
    ed.transition()
      .duration(D)
      .attr("opacity", 1)
      .attr("d", function (d) {
        return edgePath(byId[d.f], byId[d.t], d.v);
      });

    /* ---- nodes ---- */
    var nd = svg
      .select(".m-nodes")
      .selectAll("g.m-node")
      .data(spec.nodes, function (d) {
        return d.id;
      });

    nd.exit()
      .transition()
      .duration(D / 2)
      .attr("opacity", 0)
      .remove();

    var enter = nd
      .enter()
      .append("g")
      .attr("class", "m-node")
      .attr("opacity", 0)
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    enter.each(function (d) {
      drawNode(d3.select(this), d);
    });
    enter.transition().delay(D * 0.4).duration(D * 0.6).attr("opacity", 1);

    // Anything that survives is redrawn in place (labels can change) and slid.
    nd.each(function (d) {
      var g = d3.select(this);
      g.selectAll("*").remove();
      drawNode(g, d);
    })
      .transition()
      .duration(D)
      .ease(d3.easeCubicInOut)
      .attr("opacity", function (d) {
        return d.dim ? 0.5 : 1;
      })
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    /* ---- brace (only some states) ---- */
    var braces = spec.brace ? [spec.brace] : [];
    var br = svg.select(".m-brace").selectAll("path").data(braces);
    br.exit().remove();
    br.enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", GOOD)
      .attr("stroke-width", 1.6)
      .attr("opacity", 0)
      .merge(br)
      .attr("d", function (b) {
        return "M" + b.x1 + " " + (b.y - 10) + " V " + b.y + " H " + b.x2 + " V " + (b.y - 10);
      })
      .transition()
      .delay(D * 0.5)
      .duration(D * 0.5)
      .attr("opacity", 0.8);

    /* ---- notes ---- */
    var nt = svg
      .select(".m-notes")
      .selectAll("text")
      .data(spec.notes, function (d) {
        return d.s;
      });
    nt.exit().transition().duration(D / 3).attr("opacity", 0).remove();
    nt.enter()
      .append("text")
      .attr("font-family", FONT)
      .attr("x", function (d) {
        return d.x;
      })
      .attr("y", function (d) {
        return d.y;
      })
      .attr("fill", function (d) {
        return d.c;
      })
      .attr("font-size", function (d) {
        return d.z || 15;
      })
      .attr("font-weight", function (d) {
        return d.weight || 400;
      })
      .attr("opacity", 0)
      .text(function (d) {
        return d.s;
      })
      .transition()
      .delay(D * 0.55)
      .duration(D * 0.45)
      .attr("opacity", 1);
  }

  function drawNode(g, d) {
    if (d.kind === "person" || d.kind === "clock") {
      var cx = d.w / 2,
        cy = d.h / 2;
      if (d.kind === "person") {
        g.append("circle").attr("cx", cx).attr("cy", cy - 16).attr("r", 9)
          .attr("fill", "none").attr("stroke", CY).attr("stroke-width", 2.2);
        g.append("path")
          .attr("d", "M" + cx + " " + (cy - 7) + " V " + (cy + 12) +
            " M" + (cx - 11) + " " + (cy - 1) + " H " + (cx + 11) +
            " M" + cx + " " + (cy + 12) + " L " + (cx - 9) + " " + (cy + 26) +
            " M" + cx + " " + (cy + 12) + " L " + (cx + 9) + " " + (cy + 26))
          .attr("fill", "none").attr("stroke", CY).attr("stroke-width", 2.2);
      } else {
        g.append("circle").attr("cx", cx).attr("cy", cy).attr("r", 17)
          .attr("fill", "none").attr("stroke", CY).attr("stroke-width", 2.2);
        g.append("path").attr("d", "M" + cx + " " + (cy - 9) + " V " + cy + " H " + (cx + 8))
          .attr("fill", "none").attr("stroke", CY).attr("stroke-width", 2.2);
      }
      return;
    }

    var k = KIND[d.kind] || KIND.task;
    g.append("rect")
      .attr("width", d.w)
      .attr("height", d.h)
      .attr("rx", 9)
      .attr("fill", k.fill)
      .attr("stroke", k.stroke)
      .attr("stroke-width", k.sw)
      .attr("stroke-dasharray", k.dash);

    if (d.kind === "branch") {
      // A fork glyph in the bottom-right corner, clear of the label text.
      g.append("path")
        .attr("d", "M" + (d.w - 26) + " " + (d.h - 9) + " h 7 l 6 -6 m -6 6 l 6 6")
        .attr("fill", "none")
        .attr("stroke", "#8b9aa3")
        .attr("stroke-width", 1.8)
        .attr("stroke-linecap", "round");
    }

    var lines = d.t || [];
    var big = d.kind === "qbox";
    var fs = big ? 44 : d.mono ? 22 : 17;
    var lh = big ? 0 : 20;
    var y0 = d.h / 2 - ((lines.length - 1) * lh) / 2 + (big ? 15 : 6);
    lines.forEach(function (ln, i) {
      g.append("text")
        .attr("x", d.w / 2)
        .attr("y", y0 + i * lh)
        .attr("text-anchor", "middle")
        .attr("fill", k.text)
        .attr("font-size", fs)
        .attr("font-weight", big ? 800 : d.mono ? 600 : 500)
        .attr("font-family", d.mono ? '"SFMono-Regular", Consolas, monospace' : FONT)
        .text(ln);
    });

    if (d.dim) {
      g.append("text")
        .attr("x", d.w / 2)
        .attr("y", d.h + 16)
        .attr("text-anchor", "middle")
        .attr("fill", "#c86a9a")
        .attr("font-size", 13)
        .attr("font-family", FONT)
        .text("skipped");
    }
  }

  /* ====================================================== step machine */
  function applyState(target) {
    var el = document.getElementById(target);
    if (!el) return;
    var steps = Array.prototype.slice.call(
      document.querySelectorAll('.step[data-target="' + target + '"]')
    );
    var vis = steps.filter(function (s) {
      return s.classList.contains("visible");
    });
    var cur = vis.length ? vis[vis.length - 1] : null;
    var state = cur ? cur.dataset.state : null;

    el.dataset.state = state || "";

    // The caption of the active step, or - before the first click, and again if
    // you step back past it - the strip's own data-caption0. A state a diagram
    // starts in has no fragment to hang a caption on, so without a default the
    // opening state is the only one that has to be narrated out loud. Strips
    // that set no default keep the old behaviour and blank.
    var cap = document.querySelector('.stepcap[data-for="' + target + '"]');
    if (cap)
      cap.innerHTML =
        cur && cur.dataset.caption ? cur.dataset.caption : cap.dataset.caption0 || "";

    if (el.classList.contains("stateful")) {
      Array.prototype.forEach.call(el.querySelectorAll("[data-steps]"), function (p) {
        var list = p.dataset.steps.split(/\s+/);
        var on = !state || list.indexOf("_always") >= 0 || list.indexOf(state) >= 0;
        p.style.opacity = on ? 1 : DIM;
      });
    }

    if (CHARTS[target] && CHARTS[target].onState) CHARTS[target].onState(state);
  }

  function syncAll() {
    var seen = {};
    Array.prototype.forEach.call(document.querySelectorAll(".step[data-target]"), function (s) {
      seen[s.dataset.target] = true;
    });
    Object.keys(seen).forEach(applyState);
  }

  function drawSlide(slide) {
    if (!slide) return;
    Object.keys(CHARTS).forEach(function (id) {
      var el = document.getElementById(id);
      if (el && slide.contains(el)) CHARTS[id].draw();
    });
    syncAll();
  }

  function boot(Reveal) {
    Reveal.on("ready", function (e) {
      syncAll();
      drawSlide(e.currentSlide);
    });
    Reveal.on("slidechanged", function (e) {
      drawSlide(e.currentSlide);
    });
    // Reveal fires once per fragment *index*, so when several fragments share a
    // data-fragment-index only e.fragment is the first of the group. Reading just
    // that one silently dropped every other target in the group, which is how a
    // slide could advance its diagram and leave its bar chart behind.
    function applyFromEvent(e) {
      var list = e.fragments && e.fragments.length ? e.fragments : [e.fragment];
      var seen = {};
      Array.prototype.forEach.call(list, function (f) {
        var t = f && f.dataset && f.dataset.target;
        if (t && !seen[t]) {
          seen[t] = 1;
          applyState(t);
        }
      });
    }
    Reveal.on("fragmentshown", applyFromEvent);
    Reveal.on("fragmenthidden", applyFromEvent);
    if (Reveal.isReady && Reveal.isReady()) {
      syncAll();
      drawSlide(Reveal.getCurrentSlide());
    }
  }

  var tries = 0;
  (function waitForReveal() {
    if (typeof window.Reveal !== "undefined" && window.Reveal.on) {
      boot(window.Reveal);
      return;
    }
    if (tries++ > 300) return;
    setTimeout(waitForReveal, 50);
  })();

  // Additive: lets a sibling deck keep its own diagrams in its own file while
  // sharing this step machine. Registration must happen before Reveal fires
  // "ready", which it does: both files load synchronously in the after-body.
  window.abtChart = chart;

  window.abtDrawAll = function () {
    Object.keys(CHARTS).forEach(function (id) {
      if (document.getElementById(id)) CHARTS[id].draw();
    });
    syncAll();
  };
})();
