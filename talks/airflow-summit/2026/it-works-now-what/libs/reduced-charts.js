/* ============================================================================
 * reduced-charts.js — diagrams that exist only in reduced-deck-v2.qmd
 *
 * Registers through window.abtChart, the same hook who-knows-charts.js uses, so
 * this deck shares the step machine in talk-charts.js without either of the two
 * earlier decks being touched. Load order: talk-charts.js, then this.
 *
 * Every viewBox is 1120 units wide, which is the slide content width, so the
 * drawing lands 1:1 in slide coordinates.
 *
 * These five exist because the converged deck needs things the exploratory decks
 * did not have:
 *   c-design  the design space opening up around a system that already works
 *   c-toair   the agent-shaped solution becoming a Dag, check fixed underneath
 *   c-props   four real properties you might verify, replacing abstract rings
 *   c-trace   an actual trace, with the six sandbox refusals in it
 *   c-cheap   blocked -> add the missing service -> rerun -> answer
 * ========================================================================== */
(function () {
  "use strict";

  if (!window.abtChart) {
    console.error("reduced-charts.js: talk-charts.js must load first");
    return;
  }
  var chart = window.abtChart;

  var CY = "#11e1ee",
    CY_DK = "#0a8f98",
    MUT = "#9aa0a6",
    INK = "#ececf0",
    BAD = "#ff5c47",
    WARN = "#ffb020",
    GOOD = "#27d67b";

  var W = 1120;
  var FONT = '"Source Sans Pro", Helvetica, Arial, sans-serif';
  var MONO = '"SFMono-Regular", Consolas, monospace';

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

  function txt(g, x, y, s, o) {
    o = o || {};
    return g
      .append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("fill", o.fill || MUT)
      .attr("font-size", o.size || 15)
      .attr("font-weight", o.weight || 400)
      .attr("text-anchor", o.anchor || "start")
      .attr("font-family", o.mono ? MONO : FONT)
      .attr("opacity", o.opacity == null ? 1 : o.opacity)
      .text(s);
  }

  function arrowDefs(svg, id, colour) {
    svg
      .append("defs")
      .append("marker")
      .attr("id", id)
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 9)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto-start-reverse")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .attr("fill", colour);
  }

  /* ======================================================== c-design
   * It works. Now what? The design space opens up around the working system,
   * and the question is not "is it opaque" but "how would I know a change was
   * an improvement". No results yet: this slide only poses the problem.
   */
  var DESIGN = [
    { t: "the tools", a: -140 },
    { t: "the model", a: -95 },
    { t: "how much is inference", a: -50 },
    { t: "where it runs", a: 50 },
    { t: "the workflow around it", a: 95 },
    { t: "the prompt", a: 140 }
  ];

  function renderDesign(state, animate) {
    var el = document.getElementById("c-design");
    if (!el || !el.__svg) return;
    var svg = el.__svg,
      D = animate ? 520 : 0;
    var open = state === "space" || state === "ask";
    svg
      .selectAll("g.ds")
      .transition()
      .duration(D)
      .delay(function (d, i) {
        return open ? i * 90 : 0;
      })
      .attr("opacity", open ? 1 : 0);
    svg.select(".dsask").transition().duration(D).attr("opacity", state === "ask" ? 1 : 0);
  }

  chart(
    "c-design",
    function () {
      var el = document.getElementById("c-design");
      if (!el) return;
      d3.select(el).selectAll("*").remove();
      var H = 400;
      var svg = d3
        .select(el)
        .append("svg")
        .attr("viewBox", "0 0 " + W + " " + H)
        .attr("preserveAspectRatio", "xMidYMid meet");

      var cx = 300,
        cy = 176;

      // the thing that already works
      svg
        .append("rect")
        .attr("x", cx - 130)
        .attr("y", cy - 46)
        .attr("width", 260)
        .attr("height", 92)
        .attr("rx", 11)
        .attr("fill", "#122420")
        .attr("stroke", GOOD)
        .attr("stroke-width", 2.6);
      txt(svg, cx, cy - 8, "it works", { anchor: "middle", fill: "#d6ffe8", size: 24, weight: 700 });
      txt(svg, cx, cy + 22, "right answer, twice", { anchor: "middle", fill: GOOD, size: 16 });

      DESIGN.forEach(function (d) {
        var g = svg.append("g").attr("class", "ds").attr("opacity", 0);
        var rad = (d.a * Math.PI) / 180;
        var x = cx + 300 * Math.cos(rad),
          y = cy + 150 * Math.sin(rad);
        g.append("path")
          .attr("d", "M" + (cx + 132 * Math.cos(rad)) + " " + (cy + 50 * Math.sin(rad)) + " L " + (x - 12) + " " + y)
          .attr("stroke", "#3c4c56")
          .attr("stroke-width", 1.6)
          .attr("stroke-dasharray", "4 4");
        txt(g, x, y + 6, d.t, { fill: INK, size: 18 });
      });

      var ask = svg.append("g").attr("class", "dsask").attr("opacity", 0);
      txt(ask, 20, H - 40, "I might need to change any of these", { size: 18 });
      txt(ask, 20, H - 10, "If I change something, how do I know it will \"still work\" as intended?", {
        fill: CY,
        size: 23,
        weight: 700
      });

      el.__svg = svg;
      // Self-animating on entry: draw at "base" with no transition, then let the
      // staggered render run on the next frame. Same technique as c-loop, and it
      // means the slide needs no fragments and therefore no clicks.
      renderDesign("base", false);
      var want = el.dataset.state || el.dataset.initial || "base";
      if (want !== "base") {
        requestAnimationFrame(function () {
          renderDesign(want, true);
        });
      }
    },
    function (state) {
      renderDesign(state || "base", true);
    }
  );

  /* ======================================================== c-toair
   * The architectural mutation the earlier decks only mentioned in notes: the
   * agent-shaped solution becomes a Dag. The check is drawn once, underneath,
   * and never moves, because that is the whole point of the slide.
   */
  function renderToAir(state, animate) {
    var el = document.getElementById("c-toair");
    if (!el || !el.__svg) return;
    var svg = el.__svg,
      D = animate ? 700 : 0;
    var after = state === "after" || state === "same" || state === "grew";
    var grew = state === "grew";
    svg.selectAll("g.before").transition().duration(D).attr("opacity", after ? 0.12 : 1);
    svg.selectAll("g.after").transition().duration(D).attr("opacity", after ? 1 : 0);
    // The state word is not dimmed with its group: at 0.12 the tail of the
    // longer word showed from behind the shorter one.
    svg.selectAll("g.statelab-b").transition().duration(D).attr("opacity", after ? 0 : 1);
    svg.selectAll("g.statelab-a").transition().duration(D).attr("opacity", after ? 1 : 0);
    svg.select(".kept").transition().duration(D).attr("opacity", state === "same" || grew ? 1 : 0);
    svg.select(".grewlines").transition().duration(D).attr("opacity", grew ? 1 : 0);
    svg
      .select(".checkframe")
      .transition()
      .duration(D)
      .attr("stroke", state === "same" ? CY : CY_DK)
      .attr("stroke-width", state === "same" ? 3 : 2);
  }

  chart(
    "c-toair",
    function () {
      var el = document.getElementById("c-toair");
      if (!el) return;
      d3.select(el).selectAll("*").remove();
      var H = 372;
      var svg = d3
        .select(el)
        .append("svg")
        .attr("viewBox", "0 0 " + W + " " + H)
        .attr("preserveAspectRatio", "xMidYMid meet");
      arrowDefs(svg, "rd-a", "#4a5a63");

      var TY = 70,
        TH = 92;

      // BEFORE: one opaque call
      var b = svg.append("g").attr("class", "before");
      txt(svg.append("g").attr("class", "statelab-b"), 20, 46, "before", { size: 15 });
      b.append("rect")
        .attr("x", 20)
        .attr("y", TY)
        .attr("width", 250)
        .attr("height", TH)
        .attr("rx", 10)
        .attr("fill", "#14171b")
        .attr("stroke", CY_DK)
        .attr("stroke-width", 2);
      txt(b, 145, TY + 42, "a coding agent", { anchor: "middle", fill: INK, size: 18, weight: 500 });
      txt(b, 145, TY + 68, "and a page of prose", { anchor: "middle", size: 15 });
      b.append("path")
        .attr("d", "M270 " + (TY + TH / 2) + " H 340")
        .attr("stroke", "#4a5a63")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#rd-a)");
      b.append("rect")
        .attr("x", 350)
        .attr("y", TY)
        .attr("width", 210)
        .attr("height", TH)
        .attr("rx", 10)
        .attr("fill", "#0e2b2f")
        .attr("stroke", CY)
        .attr("stroke-width", 2);
      txt(b, 455, TY + 50, "the answer", { anchor: "middle", fill: "#dff8fa", size: 18, weight: 500 });
      txt(b, 600, TY + 42, "and I still had to", { fill: MUT, size: 16 });
      txt(b, 600, TY + 64, "remember to ask", { fill: MUT, size: 16 });

      // AFTER: the same job as explicit stages
      var a = svg.append("g").attr("class", "after").attr("opacity", 0);
      txt(svg.append("g").attr("class", "statelab-a").attr("opacity", 0),
          20, 46, "after", { fill: CY, size: 15, weight: 600 });
      var stages = [
        { t: ["every week"], k: "trig" },
        { t: ["ask the agent"], k: "ai" },
        { t: ["decide whether", "to alert"], k: "branch" },
        { t: ["say nothing", "or send it"], k: "out" }
      ];
      var sw = 240,
        gap = 22,
        x0 = 20;
      stages.forEach(function (st, i) {
        var x = x0 + i * (sw + gap);
        a.append("rect")
          .attr("x", x)
          .attr("y", TY)
          .attr("width", sw)
          .attr("height", TH)
          .attr("rx", 10)
          .attr("fill", st.k === "ai" ? "#0e2b2f" : "#171b1f")
          .attr("stroke", st.k === "ai" ? CY : "#38474f")
          .attr("stroke-width", st.k === "ai" ? 2.4 : 1.8);
        var y0 = TY + TH / 2 - ((st.t.length - 1) * 20) / 2 + 6;
        st.t.forEach(function (ln, k) {
          txt(a, x + sw / 2, y0 + k * 20, ln, {
            anchor: "middle",
            fill: st.k === "ai" ? "#dff8fa" : INK,
            size: 17,
            weight: 500
          });
        });
        if (i < stages.length - 1) {
          a.append("path")
            .attr("d", "M" + (x + sw) + " " + (TY + TH / 2) + " H " + (x + sw + gap - 4))
            .attr("stroke", "#4a5a63")
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#rd-a)");
        }
      });
      txt(a, 20, TY + TH + 30, "Airflow remembers to ask, and Airflow decides whether to speak.", {
        fill: CY,
        size: 17
      });

      // The check panel. Its SHAPE is fixed; its CONTENTS grow, which is the
      // honest version. Claiming "the same check throughout" was wrong: running
      // daily created requirements that did not exist when I asked by hand.
      svg
        .append("rect")
        .attr("class", "checkframe")
        .attr("x", 20)
        .attr("y", 244)
        .attr("width", W - 40)
        .attr("height", 116)
        .attr("rx", 12)
        .attr("fill", "none")
        .attr("stroke", CY_DK)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "8 6");
      txt(svg, 40, 236, "the check", { fill: CY, size: 16, weight: 700 });
      txt(svg, 44, 278, "recorded world in", { fill: INK, size: 18 });
      txt(svg, 44, 306, "expected answer out", { fill: INK, size: 18 });
      txt(svg, 400, 278, "Its whole vocabulary is a recorded input", { size: 17 });
      txt(svg, 400, 306, "and the answer I expect back.", { size: 17 });

      var kept = svg.append("g").attr("class", "kept").attr("opacity", 0);
      txt(kept, 44, 344, "every case I already had: still passing", { fill: GOOD, size: 17, weight: 600 });

      // The two requirements that only exist once it runs daily. The argument for
      // them is in the speaker notes; the slide just shows them arriving.
      var gl = svg.append("g").attr("class", "grewlines").attr("opacity", 0);
      txt(gl, 470, 344, "+ is it actually tomorrow?", { fill: WARN, size: 17, mono: 1 });
      txt(gl, 760, 344, "+ don't repeat yourself", { fill: WARN, size: 17, mono: 1 });

      el.__svg = svg;
      renderToAir(el.dataset.state || "before", false);
    },
    function (state) {
      renderToAir(state || "before", true);
    }
  );

  /* ======================================================== c-props
   * Replaces the abstract concentric rings. Four real properties, each one
   * bigger than the last, all of them things actually verified in this work.
   */
  var PROPS = [
    { s: "small", t: "Given this recorded state, produce the expected decision.", c: CY_DK },
    { s: "larger", t: "Run the workflow and check the notification actually went out.", c: CY },
    { s: "larger", t: "Exercise the real Dag boundary: branching, retries, state between runs.", c: WARN },
    { s: "system", t: "Kill part of the infrastructure and check the property still holds.", c: BAD }
  ];

  function renderProps(state, animate) {
    var el = document.getElementById("c-props");
    if (!el || !el.__svg) return;
    var svg = el.__svg,
      D = animate ? 480 : 0;
    var n = { base: 1, p2: 2, p3: 3, p4: 4, fear: 4 }[state];
    if (n == null) n = 1;
    svg
      .selectAll("g.pr")
      .transition()
      .duration(D)
      .attr("opacity", function (d, i) {
        return i < n ? 1 : 0.1;
      });
    svg.select(".fearnote").transition().duration(D).attr("opacity", state === "fear" ? 1 : 0);
  }

  chart(
    "c-props",
    function () {
      var el = document.getElementById("c-props");
      if (!el) return;
      d3.select(el).selectAll("*").remove();
      var H = 400;
      var svg = d3
        .select(el)
        .append("svg")
        .attr("viewBox", "0 0 " + W + " " + H)
        .attr("preserveAspectRatio", "xMidYMid meet");

      var y0 = 40,
        rh = 66,
        gap = 14;
      svg
        .selectAll("g.pr")
        .data(PROPS)
        .enter()
        .append("g")
        .attr("class", "pr")
        .attr("opacity", 0.1)
        .each(function (d, i) {
          var g = d3.select(this),
            y = y0 + i * (rh + gap);
          // the bar widens with the size of the property under test
          var w = 380 + i * 186;
          g.append("rect")
            .attr("x", 150)
            .attr("y", y)
            .attr("width", w)
            .attr("height", rh)
            .attr("rx", 9)
            .attr("fill", "#171b1f")
            .attr("stroke", d.c)
            .attr("stroke-width", 2);
          txt(g, 140, y + 40, d.s, { anchor: "end", fill: d.c, size: 16, weight: 700 });
          txt(g, 170, y + 40, d.t, { fill: INK, size: 17 });
        });

      var fn = svg.append("g").attr("class", "fearnote").attr("opacity", 0);
      txt(fn, 150, H - 34, "All four are checks. None of them is about whether a model wrote a nice sentence.", {
        size: 17
      });
      txt(fn, 150, H - 6, "Which one you need depends on what you are actually afraid of being wrong.", {
        fill: CY,
        size: 22,
        weight: 700
      });

      el.__svg = svg;
      renderProps(el.dataset.state || "base", false);
    },
    function (state) {
      renderProps(state || "base", true);
    }
  );

  /* ======================================================== c-trace
   * A real trace from artifacts/01-it-works: 22 model turns, of which two
   * fetched anything and six were refused by the sandbox. The refusals are the
   * point, because they were being read as the model fumbling.
   *
   * Commands are the actual denied ones, with the council host and the repo path
   * replaced the same way the rest of this deck anonymises them.
   */
  var TRACE_ROWS = [
    { n: 3, k: "call", s: "GET  the council page" },
    { n: 4, k: "deny", s: "cd /tmp && curl …  →  refused" },
    { n: 7, k: "think", s: "read the page's JavaScript" },
    { n: 9, k: "deny", s: 'grep -n -E "<form|ajax|Postcode" /tmp/…  →  refused' },
    { n: 10, k: "deny", s: "grep -n -m 60 -E … /tmp/…  →  refused" },
    { n: 13, k: "call", s: "POST the address lookup" },
    { n: 15, k: "call", s: "POST the collection lookup" },
    { n: 18, k: "deny", s: "grep -o -E … <repo>/…  →  refused" },
    { n: 20, k: "deny", s: "rm -f <repo>/…  →  refused" },
    { n: 22, k: "answer", s: "Thursday 27 Aug · recycling + food" }
  ];

  function renderTrace(state, animate) {
    var el = document.getElementById("c-trace");
    if (!el || !el.__svg) return;
    var svg = el.__svg,
      D = animate ? 460 : 0;
    var lit = state === "deny" || state === "why";
    svg
      .selectAll("g.tr")
      .transition()
      .duration(D)
      .attr("opacity", function (d) {
        return !lit || d.k === "deny" ? 1 : 0.28;
      });
    svg.select(".denynote").transition().duration(D).attr("opacity", lit ? 1 : 0);
    svg.select(".whynote").transition().duration(D).attr("opacity", state === "why" ? 1 : 0);
  }

  chart(
    "c-trace",
    function () {
      var el = document.getElementById("c-trace");
      if (!el) return;
      d3.select(el).selectAll("*").remove();
      var H = 420;
      var svg = d3
        .select(el)
        .append("svg")
        .attr("viewBox", "0 0 " + W + " " + H)
        .attr("preserveAspectRatio", "xMidYMid meet");

      txt(svg, 20, 22, "one run, 22 model turns, abridged", { size: 14 });

      var y0 = 40,
        rh = 30;
      svg
        .selectAll("g.tr")
        .data(TRACE_ROWS)
        .enter()
        .append("g")
        .attr("class", "tr")
        .each(function (d, i) {
          var g = d3.select(this),
            y = y0 + i * rh;
          var col = d.k === "deny" ? BAD : d.k === "answer" ? GOOD : d.k === "call" ? CY : MUT;
          g.append("rect")
            .attr("x", 20)
            .attr("y", y)
            .attr("width", 1080)
            .attr("height", rh - 6)
            .attr("rx", 4)
            .attr("fill", d.k === "deny" ? "#22120f" : "#14171b")
            .attr("stroke", d.k === "deny" ? BAD : "#232c33")
            .attr("stroke-width", d.k === "deny" ? 1.4 : 1);
          txt(g, 34, y + 17, String(d.n), { fill: MUT, size: 13, mono: 1 });
          txt(g, 66, y + 17, d.s, { fill: col, size: 15, mono: 1 });
        });

      var dn = svg.append("g").attr("class", "denynote").attr("opacity", 0);
      txt(dn, 20, H - 44, "Six of the twenty-two were my own sandbox refusing a command.", {
        fill: BAD,
        size: 19,
        weight: 600
      });
      var wn = svg.append("g").attr("class", "whynote").attr("opacity", 0);
      txt(wn, 20, H - 14, "The check told me it was right. Only the trace told me why it took so long.", {
        fill: CY,
        size: 22,
        weight: 700
      });

      el.__svg = svg;
      renderTrace(el.dataset.state || "base", false);
    },
    function (state) {
      renderTrace(state || "base", true);
    }
  );

  /* ======================================================== c-cheap
   * blocked -> add the missing service -> rerun -> inject the failure -> answer.
   * The mechanics of how the image was built are deliberately absent: the point
   * is that the environment was cheap to change, not how pip was invoked.
   */
  var CHEAP = [
    { t: ["blocked"], s: "no triggerer in my compose file", c: BAD },
    { t: ["add the service"], s: "one block of yaml", c: MUT },
    { t: ["bring it up"], s: "", c: MUT },
    { t: ["kill it mid-defer"], s: "", c: WARN },
    { t: ["answered"], s: "task survived, nothing resubmitted", c: GOOD }
  ];

  function renderCheap(state, animate) {
    var el = document.getElementById("c-cheap");
    if (!el || !el.__svg) return;
    var svg = el.__svg,
      D = animate ? 420 : 0;
    var n = { base: 0, go: 5, ten: 5 }[state];
    if (n == null) n = 0;
    svg
      .selectAll("g.ch")
      .transition()
      .duration(D)
      .delay(function (d, i) {
        return i * 130;
      })
      .attr("opacity", function (d, i) {
        return i < n ? 1 : 0.12;
      });
    svg.select(".tencall").transition().duration(D).delay(700).attr("opacity", state === "ten" ? 1 : 0);
  }

  chart(
    "c-cheap",
    function () {
      var el = document.getElementById("c-cheap");
      if (!el) return;
      d3.select(el).selectAll("*").remove();
      var H = 260;
      var svg = d3
        .select(el)
        .append("svg")
        .attr("viewBox", "0 0 " + W + " " + H)
        .attr("preserveAspectRatio", "xMidYMid meet");
      arrowDefs(svg, "rd-c", "#4a5a63");

      var bw = 196,
        gap = 26,
        x0 = 20,
        by = 60,
        bh = 76;
      svg
        .selectAll("g.ch")
        .data(CHEAP)
        .enter()
        .append("g")
        .attr("class", "ch")
        .attr("opacity", 0.12)
        .each(function (d, i) {
          var g = d3.select(this),
            x = x0 + i * (bw + gap);
          g.append("rect")
            .attr("x", x)
            .attr("y", by)
            .attr("width", bw)
            .attr("height", bh)
            .attr("rx", 9)
            .attr("fill", "#171b1f")
            .attr("stroke", d.c)
            .attr("stroke-width", 2);
          txt(g, x + bw / 2, by + 34, d.t[0], { anchor: "middle", fill: d.c, size: 18, weight: 600 });
          if (d.s) txt(g, x + bw / 2, by + 58, d.s, { anchor: "middle", size: 13 });
          if (i < CHEAP.length - 1) {
            g.append("path")
              .attr("d", "M" + (x + bw) + " " + (by + bh / 2) + " H " + (x + bw + gap - 6))
              .attr("stroke", "#4a5a63")
              .attr("stroke-width", 2)
              .attr("marker-end", "url(#rd-c)");
          }
        });

      var tc = svg.append("g").attr("class", "tencall").attr("opacity", 0);
      txt(tc, 20, 190, "ten minutes, start to finish", { fill: GOOD, size: 24, weight: 800 });
      txt(tc, 20, 220, "On a shared cluster that is a ticket and a week, and I would have assumed instead.", {
        size: 17
      });

      el.__svg = svg;
      renderCheap(el.dataset.state || "base", false);
    },
    function (state) {
      renderCheap(state || "base", true);
    }
  );

  /* --------------------------------------------------------------------------
   * c-h2s / c-h2s2 — the manual chain becoming the agent-shaped one.
   *
   * Restores the morph from automated-bin-talk.qmd rather than reusing c-morph,
   * because this version needs a third state the shared chart does not have: the
   * "?" opens up and the reverse-engineering is shown inside it. Two element ids
   * so the deck can hold both editorial options at once:
   *   c-h2s   hand -> inside          one click, the answer arrives whole
   *   c-h2s2  hand -> skill -> inside two clicks, the "?" is felt before it opens
   *
   * Boxes are keyed b1..b4/ans, so the first two survive the morph and slide and
   * relabel into /bin-skill and "?", while the middle two collapse out. The
   * answer box is the same box the whole way, which is the point being made.
   * ------------------------------------------------------------------------ */
  var H2S = {
    hand: {
      boxes: [
        { k: "b1", x: 112, y: 76, w: 150, h: 64, t: ["access", "council website"], dash: 1 },
        { k: "b2", x: 292, y: 76, w: 150, h: 64, t: ["type your", "postcode"], dash: 1 },
        { k: "b3", x: 472, y: 76, w: 150, h: 64, t: ["pick your", "address"], dash: 1 },
        { k: "b4", x: 652, y: 76, w: 150, h: 64, t: ["read date", "and bin"], dash: 1 },
        { k: "ans", x: 832, y: 76, w: 176, h: 64, t: ["27 Aug", "recycling"], lit: 1 }
      ],
      edges: [["me", "b1"], ["b1", "b2"], ["b2", "b3"], ["b3", "b4"], ["b4", "ans"]],
      caps: [{ x: 112, y: 60, s: "manual instructions", size: 15 }]
    },
    skill: {
      boxes: [
        { k: "b1", x: 112, y: 76, w: 250, h: 64, t: ["/bin-skill"], mono: 1, lit: 1 },
        { k: "b2", x: 452, y: 76, w: 250, h: 64, t: ["[...]"], big: 1, lit: 1 },
        { k: "ans", x: 812, y: 76, w: 196, h: 64, t: ["27 Aug", "recycling"], lit: 1 }
      ],
      edges: [["me", "b1"], ["b1", "b2"], ["b2", "ans"]],
      caps: [
        { x: 112, y: 168, s: "still starts with you", size: 15 },
        { x: 452, y: 168, s: "", size: 16 },
        { x: 812, y: 60, s: "same answer", fill: CY, size: 15, weight: 700 }
      ]
    },
    dag: {
      boxes: [
        { k: "b1", x: 96, y: 110, w: 156, h: 64, t: ["ask the", "agent"] },
        { k: "ans", x: 292, y: 110, w: 162, h: 64, t: ["27 Aug", "recycling"], lit: 1 },
        { k: "decide", x: 494, y: 110, w: 172, h: 64, t: ["decide whether", "to alert"] },
        { k: "nothing", x: 706, y: 40, w: 176, h: 60, t: ["note why", "nothing is due"] },
        { k: "notify", x: 706, y: 182, w: 176, h: 60, t: ["send the", "reminder"], good: 1 }
      ],
      edges: [["clock", "b1"], ["b1", "ans"], ["ans", "decide"],
              ["decide", "nothing"], ["decide", "notify"], ["notify", "person"]],
      clock: 1,
      person: { x: 946, y: 184 },
      stats: [
        { v: "$0.04", l: "per question" },
        { v: "7 sec", l: "wall clock" },
        { v: "3", l: "model turns" },
        { v: "7k", l: "tokens" }
      ],
      brace: { x1: 494, x2: 882, y: 262 },
      statsY: 306,
      caps: [
        { x: 40, y: 216, s: "now happens every day", fill: CY, size: 15 },
        { x: 494, y: 288, s: "decision logic is plain Python. Unit-testable.", fill: GOOD, size: 16 },
        { x: 902, y: 282, s: "Airflow sends the notification, not the agent.", size: 15 }
      ]
    },
    inside: {
      boxes: [
        { k: "b1", x: 96, y: 96, w: 184, h: 64, t: ["/bin-skill"], mono: 1, lit: 1 },
        { k: "b2", x: 312, y: 34, w: 420, h: 190, t: [], lit: 1 },
        { k: "ans", x: 812, y: 96, w: 196, h: 64, t: ["27 Aug", "recycling"], lit: 1 }
      ],
      edges: [["me", "b1"], ["b1", "b2"], ["b2", "ans"]],
      inner: 1,
      stats: [
        { v: "$0.85", l: "per question" },
        { v: "2 min", l: "wall clock" },
        { v: "22", l: "model turns" },
        { v: "~1M", l: "tokens" }
      ],
      caps: [
        { x: 312, y: 266, s: "Nobody wrote this. The agent worked out enough of the system to solve it.",
          fill: CY, size: 17, weight: 700 }
      ]
    }
  };

  function h2sChart(ID) {
    chart(
      ID,
      function () {
        var svg = host(ID, 392);
        if (!svg) return;
        svg
          .append("defs")
          .append("marker")
          .attr("id", ID + "-ar")
          .attr("viewBox", "0 0 10 10")
          .attr("refX", 9)
          .attr("refY", 5)
          .attr("markerWidth", 6)
          .attr("markerHeight", 6)
          .attr("orient", "auto-start-reverse")
          .append("path")
          .attr("d", "M 0 0 L 10 5 L 0 10 z")
          .attr("fill", "#5b6b74");

        // The person is in every state but does not stay put: in the dag state they
        // move to the far right, which is the whole point of that slide.
        var me = svg
          .append("g")
          .attr("class", "h-me")
          .attr("stroke", CY)
          .attr("stroke-width", 2.4)
          .attr("fill", "none");
        me.append("circle").attr("cx", 40).attr("cy", 118).attr("r", 11);
        me.append("path").attr("d", "M40 129 V164 M26 142 H54 M40 164 L30 188 M40 164 L50 188");

        // and a clock takes the front when nobody starts it any more
        var ck = svg.append("g").attr("class", "h-clock").attr("opacity", 0);
        ck.append("circle").attr("cx", 42).attr("cy", 142).attr("r", 19)
          .attr("fill", "none").attr("stroke", CY).attr("stroke-width", 2.4);
        ck.append("path").attr("d", "M42 129 V143 H53")
          .attr("fill", "none").attr("stroke", CY).attr("stroke-width", 2.4);

        svg.append("g").attr("class", "h-brace").attr("opacity", 0)
          .append("path").attr("fill", "none").attr("stroke", GOOD).attr("stroke-width", 2);

        svg.append("g").attr("class", "h-edges");
        svg.append("g").attr("class", "h-boxes");
        svg.append("g").attr("class", "h-labels");
        svg.append("g").attr("class", "h-caps");
        svg.append("g").attr("class", "h-inner").attr("opacity", 0);
        svg.append("g").attr("class", "h-stats").attr("opacity", 0);
        var el = document.getElementById(ID);
        el.__h2s = svg;
        renderH2S(ID, el.dataset.state || el.dataset.initial || "hand", false);
      },
      function (state) {
        var el = document.getElementById(ID);
        renderH2S(ID, state || (el && el.dataset.initial) || "hand", true);
      }
    );
  }

  function renderH2S(id, state, animate) {
    var el = document.getElementById(id);
    if (!el || !el.__h2s) return;
    if (!H2S[state]) state = "hand";
    var svg = el.__h2s,
      spec = H2S[state],
      D = animate ? 720 : 0;

    var byK = {};
    spec.boxes.forEach(function (b) {
      byK[b.k] = b;
    });
    // the stick figure and the clock are edge anchors, not boxes
    byK.me = { x: 4, y: 110, w: 60, h: 64 };
    byK.clock = { x: 20, y: 110, w: 46, h: 64 };
    if (spec.person) byK.person = { x: spec.person.x - 22, y: spec.person.y - 24, w: 44, h: 56 };

    svg
      .select(".h-me")
      .transition()
      .duration(D)
      .attr(
        "transform",
        spec.person
          ? "translate(" + (spec.person.x - 40) + "," + (spec.person.y - 118) + ")"
          : "translate(0,0)"
      );
    svg.select(".h-clock").transition().duration(D).delay(spec.clock ? D / 2 : 0)
      .attr("opacity", spec.clock ? 1 : 0);

    var br = svg.select(".h-brace");
    if (spec.brace) {
      br.select("path").attr(
        "d",
        "M" + spec.brace.x1 + " " + (spec.brace.y - 9) + " V " + spec.brace.y +
          " H " + spec.brace.x2 + " V " + (spec.brace.y - 9)
      );
      br.transition().duration(D).delay(D / 2).attr("opacity", 1);
    } else {
      br.transition().duration(D / 3).attr("opacity", 0);
    }

    // ---- boxes: keyed, so survivors slide and resize rather than redraw -----
    var bx = svg
      .select(".h-boxes")
      .selectAll("rect")
      .data(spec.boxes, function (d) {
        return d.k;
      });
    bx.exit().transition().duration(D / 2).attr("opacity", 0).remove();
    bx.enter()
      .append("rect")
      .attr("rx", 10)
      .attr("opacity", 0)
      .attr("x", function (d) {
        return d.x;
      })
      .attr("y", function (d) {
        return d.y;
      })
      .attr("width", function (d) {
        return d.w;
      })
      .attr("height", function (d) {
        return d.h;
      })
      .merge(bx)
      .transition()
      .duration(D)
      .attr("opacity", 1)
      .attr("x", function (d) {
        return d.x;
      })
      .attr("y", function (d) {
        return d.y;
      })
      .attr("width", function (d) {
        return d.w;
      })
      .attr("height", function (d) {
        return d.h;
      })
      .attr("fill", function (d) {
        return d.good ? "#122420" : d.lit ? "#0e2b2f" : "#171b1f";
      })
      .attr("stroke", function (d) {
        return d.good ? GOOD : d.lit ? CY : "#4a5a63";
      })
      .attr("stroke-width", function (d) {
        return d.good || d.lit ? 2.4 : 1.8;
      })
      .attr("stroke-dasharray", function (d) {
        return d.dash ? "6 5" : null;
      });

    // ---- box text: crossfaded, because these relabel rather than move -------
    var lab = svg.select(".h-labels");
    lab.transition().duration(D / 3).attr("opacity", 0).on("end", function () {
      lab.selectAll("*").remove();
      spec.boxes.forEach(function (b) {
        var cx = b.x + b.w / 2,
          n = b.t.length;
        b.t.forEach(function (line, i) {
          txt(lab, cx, b.y + b.h / 2 + 7 + (i - (n - 1) / 2) * 22, line, {
            anchor: "middle",
            fill: b.lit ? "#dff8fa" : INK,
            size: b.big ? 34 : 17,
            weight: b.big || b.mono ? 700 : 400,
            mono: b.mono
          });
        });
      });
      lab.transition().duration(D / 3).attr("opacity", 1);
    });

    // ---- edges -------------------------------------------------------------
    var eds = spec.edges.map(function (e) {
      var a = byK[e[0]],
        b = byK[e[1]];
      if (!a || !b) return null;
      var x1 = a.x + a.w + 4,
        y1 = a.y + a.h / 2,
        x2 = b.x - 6,
        y2 = b.y + b.h / 2;
      if (Math.abs(y1 - y2) < 2) return { k: e.join(">"), d: "M" + x1 + " " + y1 + " H " + x2 };
      var dx = Math.max(24, (x2 - x1) * 0.5);
      return {
        k: e.join(">"),
        d: "M" + x1 + " " + y1 + " C " + (x1 + dx) + " " + y1 + ", " + (x2 - dx) + " " + y2 +
          ", " + x2 + " " + y2
      };
    }).filter(Boolean);
    if (spec.down) {
      var t = byK[spec.down[0]],
        u = byK[spec.down[1]];
      if (t && u) eds.push({ k: "down", d: "M" + (t.x + t.w / 2) + " " + (t.y + t.h) + " V " + (u.y - 6) });
    }
    var ep = svg
      .select(".h-edges")
      .selectAll("path")
      .data(eds, function (d) {
        return d.k;
      });
    ep.exit().transition().duration(D / 2).attr("opacity", 0).remove();
    ep.enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#5b6b74")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#" + id + "-ar)")
      .attr("opacity", 0)
      .attr("d", function (d) {
        return d.d;
      })
      .merge(ep)
      .transition()
      .duration(D)
      .attr("opacity", 1)
      .attr("d", function (d) {
        return d.d;
      });

    // ---- captions ----------------------------------------------------------
    var caps = svg.select(".h-caps");
    caps.transition().duration(D / 3).attr("opacity", 0).on("end", function () {
      caps.selectAll("*").remove();
      (spec.caps || []).forEach(function (c) {
        txt(caps, c.x, c.y, c.s, { fill: c.fill || MUT, size: c.size || 15, weight: c.weight || 400 });
      });
      caps.transition().duration(D / 3).attr("opacity", 1);
    });

    // ---- what is inside the "?" -------------------------------------------
    var inner = svg.select(".h-inner");
    if (spec.inner) {
      if (inner.attr("data-built") !== "1") {
        inner.attr("data-built", "1");
        var rows = [
          { s: "opens the page — no dropdown to click", fill: MUT },
          { s: "reads the page's JavaScript", fill: CY, weight: 600 },
          { s: "finds the endpoints behind the form", fill: CY },
          { s: "calls those instead, and answers", fill: GOOD, weight: 600 }
        ];
        rows.forEach(function (r, i) {
          var y = 80 + i * 40;
          inner
            .append("circle")
            .attr("cx", 336)
            .attr("cy", y - 5)
            .attr("r", 4)
            .attr("fill", r.fill);
          txt(inner, 352, y, r.s, { fill: r.fill, size: 17, weight: r.weight || 400 });
        });
      }
      inner.transition().duration(D).delay(D / 2).attr("opacity", 1);
    } else {
      inner.transition().duration(D / 3).attr("opacity", 0);
    }

    // Rebuild when the values change rather than only when the group is empty.
    // Building once meant whichever state drew first won, so arriving at the dag
    // state showed the previous state's numbers, and arriving from the right
    // showed the dag numbers on the state before it.
    var st = svg.select(".h-stats");
    if (spec.stats) {
      var sig =
        (spec.statsY || 292) +
        ":" +
        spec.stats
          .map(function (c) {
            return c.v + "/" + c.l;
          })
          .join("|");
      if (st.attr("data-sig") !== sig) {
        st.attr("data-sig", sig).interrupt().attr("opacity", 0).selectAll("*").remove();
        var sy = spec.statsY || 292;
        st.append("path")
          .attr("d", "M96 " + sy + " H 1008")
          .attr("stroke", "#263038")
          .attr("stroke-width", 1.4);
        spec.stats.forEach(function (c, i) {
          var x = 96 + i * 232;
          txt(st, x, sy + 52, c.v, { fill: CY, size: 40, weight: 800 });
          txt(st, x, sy + 78, c.l, { fill: MUT, size: 16 });
        });
      }
      st.transition().duration(D).delay(D / 2).attr("opacity", 1);
    } else {
      st.transition().duration(D / 3).attr("opacity", 0);
    }
  }

  h2sChart("c-h2s");
  h2sChart("c-h2s2");


  /* --------------------------------------------------------------------------
   * c-zoom — Airflow as the setting, then down to the small real example.
   *
   * Three states: a dense flow graph, one path inside it picked out, then that
   * path opening up as the bin flow. The wide graph is deliberately a drawing
   * with no readable labels: it says "this is the kind of place these end up"
   * without inviting anyone to parse it, and without putting a real internal
   * pipeline on a screen in Texas.
   *
   * Layout is seeded rather than random so the graph is identical every run.
   * ------------------------------------------------------------------------ */
  var ZOOM_NODES = null;

  function zoomLayout() {
    if (ZOOM_NODES) return ZOOM_NODES;
    var seed = 20260901;
    function rnd() {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    }
    var cols = [50, 244, 438, 632, 826, 1000];
    var counts = [5, 7, 6, 7, 5, 4];
    var nodes = [];
    cols.forEach(function (x, c) {
      var n = counts[c];
      for (var i = 0; i < n; i++) {
        var span = 250 / n;
        nodes.push({
          id: c + "-" + i,
          col: c,
          x: x,
          y: 26 + i * span + rnd() * (span - 16),
          w: c === 5 ? 74 : 96,
          h: 15
        });
      }
    });
    // one path through the graph, which is the flow the talk actually follows
    var pick = ["0-2", "1-3", "2-2", "3-4", "4-1", "5-1"];
    var byId = {};
    nodes.forEach(function (n) {
      byId[n.id] = n;
    });
    var edges = [];
    for (var c = 0; c < cols.length - 1; c++) {
      var from = nodes.filter(function (n) {
        return n.col === c;
      });
      var to = nodes.filter(function (n) {
        return n.col === c + 1;
      });
      from.forEach(function (a) {
        var k = 1 + Math.floor(rnd() * 2);
        for (var j = 0; j < k; j++) {
          var b = to[Math.floor(rnd() * to.length)];
          edges.push({ a: a, b: b, on: pick.indexOf(a.id) >= 0 && pick.indexOf(b.id) >= 0 });
        }
      });
    }
    ZOOM_NODES = { nodes: nodes, edges: edges, pick: pick, byId: byId };
    return ZOOM_NODES;
  }

  var ZOOM_SMALL = [
    { t: "trigger", lit: 0 },
    { t: "ask", lit: 0 },
    { t: "interpret", lit: 0 },
    { t: "decide", lit: 0 },
    { t: "outcome", lit: 1 }
  ];

  chart(
    "c-zoom",
    function () {
      var svg = host("c-zoom", 240);
      if (!svg) return;
      var L = zoomLayout();

      var ge = svg.append("g").attr("class", "z-edges");
      ge.selectAll("path")
        .data(L.edges)
        .enter()
        .append("path")
        .attr("class", function (d) {
          return d.on ? "z-e on" : "z-e";
        })
        .attr("fill", "none")
        .attr("stroke", "#232c32")
        .attr("stroke-width", 1.1)
        .attr("d", function (d) {
          var x1 = d.a.x + d.a.w,
            y1 = d.a.y + d.a.h / 2,
            x2 = d.b.x,
            y2 = d.b.y + d.b.h / 2,
            dx = (x2 - x1) * 0.5;
          return "M" + x1 + " " + y1 + " C " + (x1 + dx) + " " + y1 + ", " + (x2 - dx) + " " + y2 + ", " + x2 + " " + y2;
        });

      var gn = svg.append("g").attr("class", "z-nodes");
      gn.selectAll("rect")
        .data(L.nodes, function (d) {
          return d.id;
        })
        .enter()
        .append("rect")
        .attr("class", function (d) {
          return L.pick.indexOf(d.id) >= 0 ? "z-n on" : "z-n";
        })
        .attr("rx", 4)
        .attr("x", function (d) {
          return d.x;
        })
        .attr("y", function (d) {
          return d.y;
        })
        .attr("width", function (d) {
          return d.w;
        })
        .attr("height", function (d) {
          return d.h;
        })
        .attr("fill", "#191f24")
        .attr("stroke", "#2f3a41")
        .attr("stroke-width", 1.2);

      svg.append("g").attr("class", "z-lab").attr("opacity", 0);
      renderZoom(document.getElementById("c-zoom").dataset.initial || "wide", false);
    },
    function (state) {
      renderZoom(state || "wide", true);
    }
  );

  function renderZoom(state, animate) {
    var el = document.getElementById("c-zoom");
    if (!el) return;
    var svg = d3.select(el).select("svg");
    if (svg.empty()) return;
    var L = zoomLayout(),
      D = animate ? 760 : 0;
    var small = state === "small";
    // The pick still reads, it just happens inside the same click: the path
    // lights, then a beat later it opens out.
    var focus = small;
    var LIFT = small ? 420 : 0;

    // the noise recedes rather than disappearing: it is still the setting
    svg.selectAll(".z-e:not(.on)").transition().duration(D).delay(LIFT / 2).attr("opacity", small ? 0 : 1);
    svg.selectAll(".z-n:not(.on)")
      .transition()
      .duration(D / 2)
      .attr("opacity", small ? 0.16 : 1)
      .transition()
      .duration(D)
      .delay(LIFT / 2)
      .attr("opacity", small ? 0 : 1);
    svg.selectAll(".z-e.on")
      .transition()
      .duration(D / 2)
      .attr("stroke", small ? CY_DK : "#232c32")
      .attr("stroke-width", small ? 2 : 1.1)
      .transition()
      .duration(D)
      .delay(LIFT / 2)
      .attr("opacity", small ? 0 : 1);

    // the picked path opens out into the flow the rest of the talk uses
    svg.selectAll(".z-n.on")
      .transition()
      .duration(D / 2)
      .attr("stroke", small ? CY : "#2f3a41")
      .attr("stroke-width", small ? 1.8 : 1.2)
      .transition()
      .duration(D)
      .delay(LIFT)
      .attr("x", function (d, i) {
        return small ? 40 + i * 210 : d.x;
      })
      .attr("y", function (d) {
        return small ? 84 : d.y;
      })
      .attr("width", function (d, i) {
        return small ? (i === 5 ? 0 : 180) : d.w;
      })
      .attr("height", function () {
        return small ? 74 : 15;
      })
      .attr("rx", small ? 10 : 4)
      .attr("fill", function (d, i) {
        return small && ZOOM_SMALL[i] && ZOOM_SMALL[i].lit ? "#0e2b2f" : small ? "#171b1f" : "#191f24";
      })
      .attr("stroke", function (d, i) {
        if (small) return ZOOM_SMALL[i] && ZOOM_SMALL[i].lit ? CY : "#4a5a63";
        return "#2f3a41";
      })
      .attr("stroke-width", small ? 2.2 : 1.2)
      .attr("opacity", function (d, i) {
        return small && i === 5 ? 0 : 1;
      });

    var lab = svg.select(".z-lab");
    if (small) {
      if (lab.selectAll("*").empty()) {
        ZOOM_SMALL.forEach(function (b, i) {
          txt(lab, 40 + i * 210 + 90, 127, b.t, {
            anchor: "middle",
            fill: b.lit ? "#dff8fa" : INK,
            size: 17
          });
        });
      }
      lab.transition().duration(D).delay(LIFT + D / 2).attr("opacity", 1);
    } else {
      lab.transition().duration(D / 3).attr("opacity", 0);
    }

  }


  /* --------------------------------------------------------------------------
   * c-guess — how much of the workflow is a guess, in the only two states the
   * bin story actually has.
   *
   * Deck-local rather than a second instance of c-shrink, because c-shrink lives
   * in who-knows-charts.js with four states and two of those (narrow tools, and
   * Python doing the deciding) are already shown on the Airflow slide. This one
   * has two: nearly all of it was a guess, and then none of it was.
   * ------------------------------------------------------------------------ */
  // "encoded explicitly" rather than "code I can test", because inference is
  // testable too and saying otherwise contradicts half the talk. And nothing here
  // calls inference a guess.
  var GUESS = {
    all: { g: 0.82, lab: "most behaviour resolved by the model", note: "read the page, work out the schedule, decide, explain" },
    some: { g: 0.4, lab: "inference is one bounded part", note: "it reads and extracts; the branch is a plain function" },
    none: { g: 0.0, lab: "no runtime inference", note: "once I understood the problem, there was nothing left to resolve" }
  };

  chart(
    "c-guess",
    function () {
      var el0 = document.getElementById("c-guess");
      if (!el0) return;
      var C = el0.dataset.compact === "1";
      var svg = host("c-guess", C ? 118 : 250);
      if (!svg) return;
      var BX = 60, BW = 1000, BY = C ? 30 : 54, BH = C ? 40 : 104;

      svg.append("rect").attr("class", "g-det").attr("rx", 8)
        .attr("x", BX).attr("y", BY).attr("width", BW).attr("height", BH)
        .attr("fill", "#122420").attr("stroke", GOOD).attr("stroke-width", 2);
      svg.append("rect").attr("class", "g-ai").attr("rx", 8)
        .attr("x", BX).attr("y", BY).attr("width", BW).attr("height", BH)
        .attr("fill", "#0e2b2f").attr("stroke", CY).attr("stroke-width", 2.4);

      txt(svg.append("g"), 0, 0, "", {});
      svg.append("text").attr("class", "g-ail").attr("y", BY + BH / 2 + (C ? 6 : 7))
        .attr("text-anchor", "middle").attr("fill", "#dff8fa")
        .attr("font-size", C ? 16 : 19).attr("font-weight", 700).attr("font-family", FONT)
        .text("resolved at inference time");
      svg.append("text").attr("class", "g-detl").attr("y", BY + BH / 2 + (C ? 6 : 7))
        .attr("text-anchor", "middle").attr("fill", "#d6ffe8")
        .attr("font-size", C ? 16 : 19).attr("font-weight", 700).attr("font-family", FONT)
        .text("encoded explicitly");

      txt(svg, BX, BY - 12, "How much behaviour is resolved at inference time?", { size: C ? 15 : 16 });
      svg.append("text").attr("class", "g-hl").attr("x", BX).attr("y", BY + BH + (C ? 30 : 44))
        .attr("fill", CY).attr("font-size", C ? 18 : 23).attr("font-weight", 700).attr("font-family", FONT);
      svg.append("text").attr("class", "g-hs").attr("x", BX).attr("y", BY + BH + 72)
        .attr("fill", MUT).attr("font-size", 17).attr("font-family", FONT)
        .attr("opacity", C ? 0 : 1);

      renderGuess(document.getElementById("c-guess").dataset.initial || "all", false);
    },
    function (state) {
      renderGuess(state || "all", true);
    }
  );

  function renderGuess(state, animate) {
    var el = document.getElementById("c-guess");
    if (!el) return;
    var svg = d3.select(el).select("svg");
    if (svg.empty()) return;
    var sp = GUESS[state] || GUESS.all,
      D = animate ? 820 : 0,
      BX = 60, BW = 1000;
    var w = BW * sp.g;

    svg.select(".g-ai").transition().duration(D)
      .attr("width", Math.max(0, w)).attr("opacity", sp.g > 0.02 ? 1 : 0);
    svg.select(".g-det").transition().duration(D)
      .attr("x", BX + w).attr("width", BW - w);
    svg.select(".g-ail").transition().duration(D)
      .attr("x", BX + w / 2).attr("opacity", sp.g > 0.2 ? 1 : 0);
    svg.select(".g-detl").transition().duration(D)
      .attr("x", BX + w + (BW - w) / 2).attr("opacity", sp.g < 0.7 ? 1 : 0);
    svg.select(".g-hl").transition().duration(D / 2).attr("opacity", 0)
      .on("end", function () {
        d3.select(this).text(sp.lab).transition().duration(D / 2).attr("opacity", 1);
      });
    // In compact mode the second line would fall outside the viewBox, so it stays
    // hidden and the note lives in the speaker notes instead.
    var compact = el.dataset.compact === "1";
    svg.select(".g-hs").transition().duration(D / 2).attr("opacity", 0)
      .on("end", function () {
        d3.select(this)
          .text(sp.note)
          .transition()
          .duration(D / 2)
          .attr("opacity", compact ? 0 : 1);
      });
  }


  /* --------------------------------------------------------------------------
   * c-expand — the same loop, with the boundary moved outwards.
   *
   * Built for the alternative Glue section. The resting state is drawn on entry and
   * the expansion waits for one click, so the room can look at the small loop before
   * it grows. After that click the four beats play themselves on d3 delays.
   *
   *   1  the loop I already had          hypothesis -> experiment -> evidence
   *   2  the thing I need to test is outside it
   *   3  the boundary grows to contain it
   *   4  controls appear outside, pointing in
   *   5  the external service stays external
   * ------------------------------------------------------------------------ */
  chart(
    "c-expand",
    function () {
      var el = document.getElementById("c-expand");
      var svg = host("c-expand", 340);
      if (!svg) return;
      var T = 620;

      svg
        .append("defs")
        .append("marker")
        .attr("id", "ex-ar")
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 9)
        .attr("refY", 5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto-start-reverse")
        .append("path")
        .attr("d", "M 0 0 L 10 5 L 0 10 z")
        .attr("fill", "#5b6b74");

      // ---- beat 3: the boundary, drawn first so everything sits on top ------
      var box = svg
        .append("rect")
        .attr("x", 40)
        .attr("y", 96)
        .attr("width", 430)
        .attr("height", 130)
        .attr("rx", 14)
        .attr("fill", "none")
        .attr("stroke", WARN)
        .attr("stroke-width", 2.6)
        .attr("stroke-dasharray", "9 6");
      var boxlab = txt(svg, 48, 86, "what I can change", { fill: WARN, size: 16, weight: 600 });

      // ---- beat 1: the loop -------------------------------------------------
      var loop = svg.append("g");
      [
        { x: 62, w: 122, t: "hypothesis" },
        { x: 208, w: 122, t: "experiment" },
        { x: 354, w: 96, t: "evidence", good: 1 }
      ].forEach(function (n, i) {
        loop
          .append("rect")
          .attr("x", n.x)
          .attr("y", 130)
          .attr("width", n.w)
          .attr("height", 62)
          .attr("rx", 9)
          .attr("fill", n.good ? "#122420" : "#171b1f")
          .attr("stroke", n.good ? GOOD : "#4a5a63")
          .attr("stroke-width", n.good ? 2.2 : 1.8);
        txt(loop, n.x + n.w / 2, 167, n.t, {
          anchor: "middle",
          fill: n.good ? "#d6ffe8" : INK,
          size: 16
        });
        if (i < 2)
          loop
            .append("path")
            .attr("d", "M" + (n.x + n.w + 4) + " 161 H " + (n.x + n.w + 20))
            .attr("stroke", "#5b6b74")
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#ex-ar)");
      });
      loop
        .append("path")
        .attr("d", "M402 192 V 210 H 123 V 192")
        .attr("fill", "none")
        .attr("stroke", CY_DK)
        .attr("stroke-width", 1.8)
        .attr("stroke-dasharray", "5 4");

      // ---- beat 2: Airflow, initially outside ------------------------------
      var af = svg.append("g").attr("opacity", 0);
      af.append("rect")
        .attr("x", 560)
        .attr("y", 118)
        .attr("width", 300)
        .attr("height", 86)
        .attr("rx", 11)
        .attr("fill", "#14171b")
        .attr("stroke", CY)
        .attr("stroke-width", 2.4);
      txt(af, 710, 146, "Airflow itself", { anchor: "middle", fill: "#dff8fa", size: 18, weight: 700 });
      ["scheduler", "worker", "triggerer"].forEach(function (c, i) {
        var x = 578 + i * 94;
        af.append("rect")
          .attr("x", x)
          .attr("y", 160)
          .attr("width", 86)
          .attr("height", 30)
          .attr("rx", 6)
          .attr("fill", "#0e2b2f")
          .attr("stroke", CY_DK)
          .attr("stroke-width", 1.4);
        txt(af, x + 43, 180, c, { anchor: "middle", fill: CY, size: 13 });
      });
      var afout = txt(svg, 560, 108, "the thing I need to test", { fill: MUT, size: 15, opacity: 0 });

      // ---- beat 4: controls, outside, pointing in --------------------------
      // Controls sit outside and reach in, which is the claim of the slide, so each
      // one gets a short arrow crossing the boundary into Airflow.
      var ctl = svg.append("g").attr("opacity", 0);
      function reach(x1, y1, x2, y2, c) {
        ctl
          .append("path")
          .attr("d", "M" + x1 + " " + y1 + " L " + x2 + " " + y2)
          .attr("stroke", c)
          .attr("stroke-width", 1.8)
          .attr("fill", "none")
          .attr("marker-end", "url(#ex-ar)")
          .attr("opacity", 0.85);
      }
      txt(ctl, 566, 44, "▸ kill a worker", { fill: BAD, size: 16, weight: 600 });
      reach(700, 52, 754, 112, BAD);
      txt(ctl, 566, 70, "▸ restart the triggerer", { fill: BAD, size: 16, weight: 600 });
      reach(786, 76, 840, 112, BAD);
      txt(ctl, 566, 258, "▸ rewrite what it remembers", { fill: BAD, size: 16, weight: 600 });
      reach(760, 246, 706, 210, BAD);
      txt(ctl, 566, 284, "▸ watch what it does next", { fill: GOOD, size: 16, weight: 600 });
      reach(806, 272, 852, 210, GOOD);

      // ---- beat 5: the external service stays external ---------------------
      var ext = svg.append("g").attr("opacity", 0);
      ext
        .append("path")
        .attr("d", "M866 161 H 916")
        .attr("stroke", "#5b6b74")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#ex-ar)");
      ext
        .append("rect")
        .attr("x", 924)
        .attr("y", 130)
        .attr("width", 166)
        .attr("height", 62)
        .attr("rx", 9)
        .attr("fill", "#3a1714")
        .attr("stroke", BAD)
        .attr("stroke-width", 2.2);
      txt(ext, 1007, 158, "real Glue", { anchor: "middle", fill: "#ffc9c1", size: 17, weight: 700 });
      txt(ext, 1007, 180, "(But <70 sec job)", { anchor: "middle", fill: "#ff8b78", size: 13 });

      // ---- the expansion, held until asked for -----------------------------
      // Everything above draws the resting state: the loop I already had, inside a
      // boundary that only contains it. The four beats below are stored rather than
      // run, so the slide arrives still and a click starts it. One click, then the
      // beats play themselves on d3 delays.
      el.__expand = function () {
        afout.transition().duration(T).delay(T * 0.2).attr("opacity", 1);
        af.transition().duration(T).delay(T * 0.2).attr("opacity", 1);

        box.transition().duration(T).delay(T * 1.2)
          .attr("width", 850)
          .attr("height", 150)
          .attr("y", 88);
        boxlab.transition().duration(T).delay(T * 1.2).attr("opacity", 0)
          .transition().duration(T / 2)
          .text("everything the experiment has to touch")
          .attr("y", 74)
          .attr("opacity", 1);
        afout.transition().duration(T / 2).delay(T * 1.2).attr("opacity", 0);

        ctl.transition().duration(T).delay(T * 2.2).attr("opacity", 1);
        ext.transition().duration(T).delay(T * 3.2).attr("opacity", 1);
      };
    },
    function (state) {
      var el = document.getElementById("c-expand");
      if (el && el.__expand && state === "open") el.__expand();
    }
  );

})();
