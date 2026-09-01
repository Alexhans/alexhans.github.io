/* ============================================================================
 * who-knows-charts.js — diagrams for who-knows-automated-talk.qmd
 *
 * Registers into the step machine in talk-charts.js via window.abtChart, so both
 * decks share one engine and one set of fragment conventions while keeping their
 * diagrams in separate files. Load order matters: talk-charts.js first.
 *
 * Same conventions as talk-charts.js: every viewBox is 1120 units wide, which is
 * the slide content width, so the drawing lands 1:1 in slide coordinates and its
 * height is exactly the H below.
 *
 * The load-bearing one is c-shape. It is the generic workflow every talk in this
 * room already recognises, and it recurs four times: built up, shrunk into the
 * bin problem, annotated with what we learned, and finally carrying the team's
 * operating model. Nodes are keyed by id so a node that survives a state change
 * slides and relabels instead of being redrawn, which is what makes "the bins
 * were one instance of this" land visually rather than as a claim.
 * ========================================================================== */
(function () {
  "use strict";

  if (!window.abtChart) {
    console.error("who-knows-charts.js: talk-charts.js must load first");
    return;
  }
  var chart = window.abtChart;

  var CY = "#11e1ee",
    CY_DK = "#0a8f98",
    MUT = "#9aa0a6",
    INK = "#ececf0",
    BAD = "#ff5c47",
    WARN = "#ffb020",
    GOOD = "#27d67b",
    LINE = "#263038";

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

  /* ======================================================== c-shape
   * trigger -> state -> transform -> decision -> consequence.
   * The spine of the talk. Four instances, one per return visit.
   */
  var SHAPE_NODES = {
    generic: {
      trigger: ["something", "starts the work"],
      state: ["gather or", "fetch state"],
      transform: ["tools", "and code"],
      decision: ["a decision", "gets made"],
      consequence: ["something", "happens"]
    },
    bins: {
      trigger: ["every morning"],
      state: ["the council"],
      transform: ["parse the", "schedule"],
      decision: ["which bin,", "and is it tomorrow?"],
      consequence: ["a message", "on my phone"]
    }
  };

  var SHAPE_SUB = {
    trigger: "schedule · event · human · upstream data",
    consequence: "write · notify · trigger · decide"
  };

  var SHAPE_ORDER = ["trigger", "state", "transform", "decision", "consequence"];

  // Which nodes are lit at each state, in build-up order.
  var SHAPE_STATES = {
    t: ["trigger"],
    ts: ["trigger", "state"],
    tst: ["trigger", "state", "transform"],
    tstd: ["trigger", "state", "transform", "decision"],
    ai: ["trigger", "state", "transform", "decision"],
    full: SHAPE_ORDER,
    bins: SHAPE_ORDER,
    binsonly: SHAPE_ORDER,
    learned: SHAPE_ORDER,
    team: SHAPE_ORDER
  };

  function shapeGeom(state) {
    // The bin state is the same five boxes, drawn smaller and pulled inward, so
    // "I am going to make this much smaller" is something you watch rather than
    // something you are told.
    var small = state === "bins" || state === "binsonly";
    var w = small ? 150 : 186,
      h = small ? 76 : 92,
      y = small ? 168 : 148,
      gap = small ? 42 : 46,
      total = 5 * w + 4 * gap,
      x0 = (W - total) / 2;
    return { w: w, h: h, y: y, gap: gap, x0: x0 };
  }

  function renderShape(id, state, animate) {
    var el = document.getElementById(id);
    if (!el || !el.__svg) return;
    if (!SHAPE_STATES[state]) state = "t";
    var svg = el.__svg,
      D = animate ? 700 : 0;
    var g = shapeGeom(state);
    var lit = SHAPE_STATES[state];
    var labels =
      state === "bins" || state === "binsonly" ? SHAPE_NODES.bins : SHAPE_NODES.generic;

    var data = SHAPE_ORDER.map(function (k, i) {
      return {
        id: k,
        x: g.x0 + i * (g.w + g.gap),
        y: g.y,
        w: g.w,
        h: g.h,
        t: labels[k],
        on: lit.indexOf(k) >= 0,
        agent: (state === "ai" || state === "full" || state === "learned" || state === "team") && k === "decision"
      };
    });

    /* edges */
    var edges = data.slice(0, 4).map(function (d, i) {
      return { id: d.id + ">" + data[i + 1].id, a: d, b: data[i + 1] };
    });
    var ed = svg
      .select(".s-edges")
      .selectAll("path")
      .data(edges, function (d) {
        return d.id;
      });
    ed.enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#4a5a63")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#wk-arrow)")
      .merge(ed)
      .transition()
      .duration(D)
      .attr("opacity", function (d) {
        return d.a.on && d.b.on ? 1 : 0;
      })
      .attr("d", function (d) {
        var y = d.a.y + d.a.h / 2;
        return "M" + (d.a.x + d.a.w) + " " + y + " H " + d.b.x;
      });

    /* nodes */
    var nd = svg
      .select(".s-nodes")
      .selectAll("g.s-node")
      .data(data, function (d) {
        return d.id;
      });
    var enter = nd.enter().append("g").attr("class", "s-node").attr("opacity", 0);
    enter.append("rect").attr("rx", 10);
    enter.append("g").attr("class", "s-lab");
    var all = enter.merge(nd);

    all
      .transition()
      .duration(D)
      .attr("opacity", function (d) {
        return d.on ? 1 : 0.1;
      })
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    all
      .select("rect")
      .transition()
      .duration(D)
      .attr("width", function (d) {
        return d.w;
      })
      .attr("height", function (d) {
        return d.h;
      })
      .attr("fill", function (d) {
        return d.agent ? "#0e2b2f" : "#171b1f";
      })
      .attr("stroke", function (d) {
        return d.agent ? CY : "#38474f";
      })
      .attr("stroke-width", function (d) {
        return d.agent ? 2.5 : 1.8;
      });

    all.each(function (d) {
      var lab = d3.select(this).select(".s-lab");
      lab.selectAll("*").remove();
      var fs = d.w < 170 ? 15 : 17;
      var lh = 20;
      var y0 = d.h / 2 - ((d.t.length - 1) * lh) / 2 + 6;
      d.t.forEach(function (ln, i) {
        txt(lab, d.w / 2, y0 + i * lh, ln, {
          anchor: "middle",
          fill: d.agent ? "#dff8fa" : INK,
          size: fs,
          weight: 500
        });
      });
      if (d.agent) {
        txt(lab, d.w / 2, -10, "an agent, now", { anchor: "middle", fill: CY, size: 14, weight: 700 });
      }
      if (SHAPE_SUB[d.id] && (state === "t" || state === "ts" || state === "tst" || state === "tstd" || state === "ai" || state === "full")) {
        txt(lab, d.w / 2, d.h + 22, SHAPE_SUB[d.id], { anchor: "middle", size: 13 });
      }
    });

    /* annotations that only some states carry */
    var notes = [];
    if (state === "bins") {
      notes.push({ x: W / 2, y: 96, s: "the same five boxes, one very small problem", c: CY, z: 21, w: 700, a: "middle" });
      notes.push({ x: W / 2, y: 300, s: "small enough that I can change almost everything and see what happens", c: MUT, z: 16, a: "middle" });
    }
    if (state === "binsonly") {
      notes.push({ x: W / 2, y: 96, s: "a real system, small enough to watch all of it change", c: CY, z: 21, a: "middle" });
      notes.push({ x: W / 2, y: 300, s: "it runs in my house every morning", c: MUT, z: 16, a: "middle" });
    }
    if (state === "learned") {
      notes.push({ x: g.x0 + 2 * (g.w + g.gap) + g.w / 2, y: g.y + g.h + 30, s: "deterministic where it can be", c: GOOD, z: 15, a: "middle" });
      notes.push({ x: g.x0 + 3 * (g.w + g.gap) + g.w / 2, y: g.y + g.h + 30, s: "inference where it earns it", c: CY, z: 15, a: "middle" });
      notes.push({ x: g.x0 + 4 * (g.w + g.gap) + g.w / 2, y: g.y + g.h + 30, s: "kept away from the model", c: WARN, z: 15, a: "middle" });
      notes.push({ x: W / 2, y: 320, s: "This was never about bins. It was about making the loop cheap enough to change everything else.", c: "#fff", z: 20, a: "middle" });
    }
    if (state === "team") {
      notes.push({ x: W / 2, y: 96, s: "an economist and a coding agent change the workflow", c: INK, z: 18, a: "middle" });
      notes.push({ x: W / 2, y: 330, s: "traces come back as new checks", c: CY, z: 17, a: "middle" });
    }

    var nt = svg
      .select(".s-notes")
      .selectAll("text")
      .data(notes, function (d) {
        return d.s;
      });
    nt.exit().transition().duration(D / 2).attr("opacity", 0).remove();
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
        return d.z;
      })
      .attr("font-weight", function (d) {
        return d.z >= 20 ? 700 : 500;
      })
      .attr("text-anchor", function (d) {
        return d.a || "start";
      })
      .attr("opacity", 0)
      .text(function (d) {
        return d.s;
      })
      .transition()
      .delay(D * 0.5)
      .duration(D * 0.5)
      .attr("opacity", 1);

    /* the feedback arc, only on the team state */
    var arcs = state === "team" ? [1] : [];
    var ar = svg.select(".s-arc").selectAll("path").data(arcs);
    ar.exit().remove();
    var lastX = g.x0 + 4 * (g.w + g.gap) + g.w / 2,
      firstX = g.x0 + g.w / 2;
    ar.enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", CY)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6 5")
      .attr("marker-end", "url(#wk-arrow-cy)")
      .attr("opacity", 0)
      .merge(ar)
      .attr("d", "M" + lastX + " " + (g.y + g.h + 14) + " V 308 H " + firstX + " V " + (g.y + g.h + 14))
      .transition()
      .delay(D * 0.4)
      .duration(D * 0.6)
      .attr("opacity", 0.85);
  }

  ["c-shape", "c-shape2", "c-shape3", "c-shape4"].forEach(function (ID) {
    chart(
      ID,
      function () {
        var el = document.getElementById(ID);
        if (!el) return;
        d3.select(el).selectAll("*").remove();
        var svg = d3
          .select(el)
          .append("svg")
          .attr("viewBox", "0 0 " + W + " 360")
          .attr("preserveAspectRatio", "xMidYMid meet");
        arrowDefs(svg, "wk-arrow", "#4a5a63");
        arrowDefs(svg, "wk-arrow-cy", CY);
        svg.append("g").attr("class", "s-arc");
        svg.append("g").attr("class", "s-edges");
        svg.append("g").attr("class", "s-nodes");
        svg.append("g").attr("class", "s-notes");
        el.__svg = svg;
        renderShape(ID, el.dataset.state || el.dataset.initial || "t", false);
      },
      function (state) {
        var el = document.getElementById(ID);
        renderShape(ID, state || (el && el.dataset.initial) || "t", true);
      }
    );
  });

  /* ======================================================== c-loop
   * change -> run -> check -> change, with everything you might mutate feeding
   * into CHANGE. The first zoom-out, and the first statement of the thesis.
   *
   * Arcs run edge to edge rather than centre to centre: each one starts and ends
   * an angular node-radius away from its endpoints, so the arrowheads are visible
   * instead of buried under a circle.
   */
  chart("c-loop", function () {
    var H = 340;
    var svg = host("c-loop", H);
    if (!svg) return;
    arrowDefs(svg, "wk-loop-a", "#5b6b74");

    var cx = 330,
      cy = 168,
      r = 104,
      nr = 46;
    var steps = [
      { s: "CHANGE", a: -90, c: CY },
      { s: "RUN", a: 30, c: INK },
      { s: "CHECK", a: 150, c: GOOD }
    ];
    var trim = 30; // degrees of arc hidden by each node
    function pt(deg, rad) {
      var t = (deg * Math.PI) / 180;
      return [cx + (rad || r) * Math.cos(t), cy + (rad || r) * Math.sin(t)];
    }

    steps.forEach(function (st, i) {
      var a1 = st.a + trim,
        a2 = steps[(i + 1) % 3].a + 120 - trim;
      var p1 = pt(a1),
        p2 = pt(a2);
      var path = svg
        .append("path")
        .attr("d", "M" + p1[0] + " " + p1[1] + " A " + r + " " + r + " 0 0 1 " + p2[0] + " " + p2[1])
        .attr("fill", "none")
        .attr("stroke", "#5b6b74")
        .attr("stroke-width", 2.6)
        .attr("marker-end", "url(#wk-loop-a)")
        .attr("opacity", 0);
      path.transition().delay(420 + i * 200).duration(360).attr("opacity", 1);
    });

    steps.forEach(function (st, i) {
      var p = pt(st.a);
      var node = svg.append("g").attr("opacity", 0);
      node
        .append("circle")
        .attr("cx", p[0])
        .attr("cy", p[1])
        .attr("r", nr)
        .attr("fill", "#14171b")
        .attr("stroke", st.c)
        .attr("stroke-width", 2.6);
      txt(node, p[0], p[1] + 6, st.s, { anchor: "middle", fill: st.c, size: 17, weight: 700 });
      node.transition().delay(120 + i * 200).duration(360).attr("opacity", 1);
    });

    // Everything you might mutate, bracketed and fed into CHANGE as one bundle
    // rather than five lines crossing the diagram.
    var feeds = ["the prompt", "the model", "the tools", "the workflow", "the runtime"];
    var fy0 = 66,
      fstep = 38,
      fx = 780;
    txt(svg, fx, fy0 - 30, "anything you might want to change", { size: 15 });
    feeds.forEach(function (f, i) {
      var t = txt(svg, fx, fy0 + i * fstep, f, { fill: INK, size: 18, opacity: 0 });
      t.transition().delay(900 + i * 100).duration(300).attr("opacity", 1);
    });

    var top = fy0 - 12,
      bot = fy0 + (feeds.length - 1) * fstep + 6,
      mid = (top + bot) / 2;
    var brace = svg.append("g").attr("opacity", 0);
    brace
      .append("path")
      .attr("d", "M" + (fx - 22) + " " + top + " V " + bot)
      .attr("stroke", CY_DK)
      .attr("stroke-width", 2);
    var chY = cy - r; // CHANGE sits at the top of the ring
    brace
      .append("path")
      .attr("d", "M" + (fx - 22) + " " + mid + " H " + (fx - 120) + " V " + chY + " H " + (cx + nr + 16))
      .attr("stroke", CY_DK)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5 5")
      .attr("fill", "none");
    brace
      .append("path")
      .attr("d", "M" + (cx + nr + 16) + " " + chY + " L " + (cx + nr + 28) + " " + (chY - 7) + " V " + (chY + 7) + " Z")
      .attr("fill", CY_DK);
    brace.transition().delay(1400).duration(400).attr("opacity", 1);

    txt(svg, 30, H - 12, "If you want to change things quickly, this loop has to be cheap and trustworthy.", {
      fill: CY,
      size: 20,
      weight: 600
    });
  });

  /* ======================================================== c-reckless
   * A fixed frame with a middle that keeps changing. The middle cycles on a
   * timer, because the point is the churn rather than any one substitution.
   */
  chart("c-reckless", function () {
    var H = 340;
    var el = document.getElementById("c-reckless");
    if (!el) return;
    if (el.__timer) el.__timer.stop();
    var svg = host("c-reckless", H);
    if (!svg) return;
    arrowDefs(svg, "wk-rk", "#4a5a63");

    var FX = 20,
      FW = W - 40,
      FY = 40,
      FH = 200;

    // the frame that does not move
    svg
      .append("rect")
      .attr("x", FX)
      .attr("y", FY)
      .attr("width", FW)
      .attr("height", FH)
      .attr("rx", 14)
      .attr("fill", "none")
      .attr("stroke", CY_DK)
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "8 6");
    txt(svg, FX + 22, FY - 10, "the exam: recorded world in, expected answer out", {
      fill: CY,
      size: 17,
      weight: 700
    });

    var boxY = FY + 54,
      boxH = 92;
    [
      { x: 70, w: 210, t: ["recorded world"], sub: "held still" },
      { x: 840, w: 210, t: ["expected answer"], sub: "held still" }
    ].forEach(function (b) {
      var g = svg.append("g");
      g.append("rect")
        .attr("x", b.x)
        .attr("y", boxY)
        .attr("width", b.w)
        .attr("height", boxH)
        .attr("rx", 9)
        .attr("fill", "#171b1f")
        .attr("stroke", "#38474f")
        .attr("stroke-width", 1.8);
      txt(g, b.x + b.w / 2, boxY + 46, b.t[0], { anchor: "middle", fill: INK, size: 18, weight: 500 });
      txt(g, b.x + b.w / 2, boxY + 70, b.sub, { anchor: "middle", size: 15 });
    });

    svg
      .append("path")
      .attr("d", "M 280 " + (boxY + boxH / 2) + " H 400")
      .attr("stroke", "#4a5a63")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#wk-rk)");
    svg
      .append("path")
      .attr("d", "M 720 " + (boxY + boxH / 2) + " H 840")
      .attr("stroke", "#4a5a63")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#wk-rk)");

    // the middle, which does not sit still
    var mid = svg.append("g");
    mid
      .append("rect")
      .attr("x", 400)
      .attr("y", boxY - 8)
      .attr("width", 320)
      .attr("height", boxH + 16)
      .attr("rx", 11)
      .attr("fill", "#14171b")
      .attr("stroke", CY)
      .attr("stroke-width", 2.5);
    var midText = mid
      .append("text")
      .attr("x", 560)
      .attr("y", boxY + 44)
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", 21)
      .attr("font-weight", 600)
      .attr("font-family", FONT);
    var midSub = mid
      .append("text")
      .attr("x", 560)
      .attr("y", boxY + 72)
      .attr("text-anchor", "middle")
      .attr("fill", MUT)
      .attr("font-size", 16)
      .attr("font-family", FONT);

    var swaps = [
      ["one prompt", "then a different one"],
      ["wide tools", "then two narrow ones"],
      ["a frontier model", "then an open-weights one"],
      ["an agent deciding", "then Python deciding"],
      ["inference", "then none at all"]
    ];
    var i = 0;
    function tick() {
      var s = swaps[i % swaps.length];
      midText.transition().duration(180).attr("opacity", 0).on("end", function () {
        midText.text(s[0]).transition().duration(220).attr("opacity", 1);
      });
      midSub.transition().duration(180).attr("opacity", 0).on("end", function () {
        midSub.text(s[1]).transition().duration(220).attr("opacity", 1);
      });
      i++;
    }
    tick();
    el.__timer = d3.interval(tick, 1500);

    txt(svg, 20, FY + FH + 46, "The check never moves.", { fill: MUT, size: 19 });
    txt(svg, 20, FY + FH + 78, el.dataset.line || "So I get to be reckless in the middle.", {
      fill: CY,
      size: 25,
      weight: 700
    });
  });

  /* ======================================================== c-shrinkai
   * The judgement region physically shrinking. Three states.
   */
  var SHRINK = {
    a: { ai: 0.82, lab: "the agent does all of it", note: "read the page, work out the schedule, decide, explain" },
    b: { ai: 0.4, lab: "tools fetch, the agent judges", note: "two typed tools, and a smaller decision left over" },
    c: { ai: 0.14, lab: "the agent returns one small answer", note: "a date and a list. Python does the rest" },
    d: { ai: 0.0, lab: "no judgement left to make", note: "once I understood it, there was nothing to decide" }
  };

  function renderShrink(state, animate) {
    var el = document.getElementById("c-shrink");
    if (!el || !el.__svg) return;
    var s = SHRINK[state] || SHRINK.a;
    var svg = el.__svg,
      D = animate ? 700 : 0;
    var BX = 60,
      BW = 1000,
      BY = 70,
      BH = 120;
    var aiW = BW * s.ai;

    svg
      .select(".ai")
      .transition()
      .duration(D)
      .attr("width", Math.max(0, aiW))
      .attr("opacity", s.ai > 0.02 ? 1 : 0);
    svg
      .select(".det")
      .transition()
      .duration(D)
      .attr("x", BX + aiW)
      .attr("width", BW - aiW);
    svg
      .select(".ai-lab")
      .transition()
      .duration(D)
      .attr("x", BX + aiW / 2)
      .attr("opacity", s.ai > 0.26 ? 1 : 0);
    svg
      .select(".det-lab")
      .transition()
      .duration(D)
      .attr("x", BX + aiW + (BW - aiW) / 2)
      .attr("opacity", s.ai < 0.9 ? 1 : 0);

    // Once the region is too narrow for a label inside it, point at it instead.
    svg
      .select(".ai-out")
      .transition()
      .duration(D)
      .attr("opacity", s.ai > 0.02 && s.ai <= 0.26 ? 1 : 0)
      .attr("transform", "translate(" + (BX + aiW / 2) + ",0)");

    svg.select(".hl").text(s.lab);
    svg.select(".hs").text(s.note);
  }

  chart(
    "c-shrink",
    function () {
      var el = document.getElementById("c-shrink");
      if (!el) return;
      d3.select(el).selectAll("*").remove();
      var H = 300;
      var svg = d3
        .select(el)
        .append("svg")
        .attr("viewBox", "0 0 " + W + " " + H)
        .attr("preserveAspectRatio", "xMidYMid meet");
      var BX = 60,
        BW = 1000,
        BY = 70,
        BH = 120;

      txt(svg, BX, BY - 16, "one run of the capability, left to right", { size: 14 });

      svg
        .append("rect")
        .attr("class", "det")
        .attr("x", BX)
        .attr("y", BY)
        .attr("width", 0)
        .attr("height", BH)
        .attr("rx", 8)
        .attr("fill", "#122420")
        .attr("stroke", GOOD)
        .attr("stroke-width", 2);
      svg
        .append("rect")
        .attr("class", "ai")
        .attr("x", BX)
        .attr("y", BY)
        .attr("width", BW)
        .attr("height", BH)
        .attr("rx", 8)
        .attr("fill", "#0e2b2f")
        .attr("stroke", CY)
        .attr("stroke-width", 2);

      svg
        .append("text")
        .attr("class", "ai-lab")
        .attr("y", BY + BH / 2 + 7)
        .attr("text-anchor", "middle")
        .attr("fill", "#dff8fa")
        .attr("font-size", 20)
        .attr("font-weight", 700)
        .attr("font-family", FONT)
        .text("inference");
      svg
        .append("text")
        .attr("class", "det-lab")
        .attr("y", BY + BH / 2 + 7)
        .attr("text-anchor", "middle")
        .attr("fill", "#d6ffe8")
        .attr("font-size", 20)
        .attr("font-weight", 700)
        .attr("font-family", FONT)
        .attr("opacity", 0)
        .text("tested, deterministic code");

      var out = svg.append("g").attr("class", "ai-out").attr("opacity", 0);
      out.append("path").attr("d", "M0 " + (BY - 6) + " V " + (BY - 26)).attr("stroke", CY).attr("stroke-width", 1.6);
      out
        .append("text")
        .attr("x", 0)
        .attr("y", BY - 34)
        .attr("text-anchor", "middle")
        .attr("fill", CY)
        .attr("font-size", 16)
        .attr("font-weight", 700)
        .attr("font-family", FONT)
        .text("inference");

      svg
        .append("text")
        .attr("class", "hl")
        .attr("x", BX)
        .attr("y", BY + BH + 48)
        .attr("fill", "#fff")
        .attr("font-size", 22)
        .attr("font-weight", 600)
        .attr("font-family", FONT);
      svg
        .append("text")
        .attr("class", "hs")
        .attr("x", BX)
        .attr("y", BY + BH + 76)
        .attr("fill", MUT)
        .attr("font-size", 17)
        .attr("font-family", FONT);

      txt(svg, BX, H - 8, "The exam score never changed. Only how much of this was a guess.", {
        fill: CY,
        size: 18,
        weight: 600
      });

      el.__svg = svg;
      renderShrink(el.dataset.state || "a", false);
    },
    function (state) {
      renderShrink(state || "a", true);
    }
  );

  /* ======================================================== c-box
   * The box gets bigger: prompt -> agent -> task -> DAG -> the whole system.
   */
  var BOX_LEVELS = [
    { k: "p", lab: "a prompt", note: "does this wording still get the right answer?" },
    { k: "a", lab: "an agent", note: "prompt, tools and output shape together" },
    { k: "t", lab: "a task", note: "does it behave inside one Airflow task?" },
    { k: "d", lab: "a Dag", note: "branching, cross-run state, retries" },
    { k: "s", lab: "the whole system", note: "workers, triggerer, something external" }
  ];

  function renderBox(state, animate) {
    var el = document.getElementById("c-box2");
    if (!el || !el.__svg) return;
    var svg = el.__svg,
      D = animate ? 650 : 0;
    var idx = 0;
    BOX_LEVELS.forEach(function (l, i) {
      if (l.k === state) idx = i;
    });
    // data-selfrun: no fragments, no clicks. Draw the whole expansion and let the
    // boxes arrive in order on their own delays.
    var SELF = el.dataset.selfrun === "1";
    if (SELF) {
      idx = BOX_LEVELS.length - 1;
      D = 620;
    }

    var cx = 470,
      cy = 170;
    svg.selectAll("g.bx").each(function (d, i) {
      var g = d3.select(this);
      var on = i <= idx;
      var w = 150 + i * 150,
        h = 78 + i * 44;
      var dly = SELF ? i * 430 : 0;
      if (SELF) g.attr("opacity", 0);
      g.transition()
        .duration(D)
        .delay(dly)
        .attr("opacity", on ? 1 : 0.08)
        .attr("transform", "translate(" + (cx - w / 2) + "," + (cy - h / 2) + ")");
      g.select("rect").transition().duration(D).delay(dly)
        .attr("width", w).attr("height", h)
        .attr("stroke", i === idx ? CY : "#3c4c56")
        .attr("stroke-width", i === idx ? 2.6 : 1.6);
      g.select("text.bl")
        .transition()
        .duration(D)
        .delay(dly)
        .attr("x", i === 0 ? w / 2 : 14)
        .attr("y", i === 0 ? h / 2 + 6 : 24)
        .attr("text-anchor", i === 0 ? "middle" : "start")
        .attr("fill", i === idx ? "#fff" : MUT);
    });

    if (SELF) {
      var last = (BOX_LEVELS.length - 1) * 430;
      svg.select(".bnote").attr("opacity", 0).transition().duration(400).delay(last)
        .attr("opacity", 1);
      svg.select(".bnow").attr("opacity", 0).transition().duration(400).delay(last)
        .attr("opacity", 1);
    }
    svg.select(".bnote").text(BOX_LEVELS[idx].note);
    svg.select(".bnow").text(BOX_LEVELS[idx].lab);
  }

  chart(
    "c-box2",
    function () {
      var el = document.getElementById("c-box2");
      if (!el) return;
      d3.select(el).selectAll("*").remove();
      var H = 360;
      var svg = d3
        .select(el)
        .append("svg")
        .attr("viewBox", "0 0 " + W + " " + H)
        .attr("preserveAspectRatio", "xMidYMid meet");

      BOX_LEVELS.forEach(function (l, i) {
        var g = svg.append("g").attr("class", "bx").attr("opacity", 0);
        g.append("rect").attr("rx", 12).attr("fill", "none").attr("stroke", "#3c4c56").attr("stroke-width", 1.6);
        g.append("text")
          .attr("class", "bl")
          .attr("text-anchor", "middle")
          .attr("fill", MUT)
          .attr("font-size", 17)
          .attr("font-weight", 600)
          .attr("font-family", FONT)
          .text(l.lab);
      });

      svg
        .append("text")
        .attr("class", "bnow")
        .attr("x", 786)
        .attr("y", 96)
        .attr("fill", CY)
        .attr("font-size", 26)
        .attr("font-weight", 800)
        .attr("font-family", FONT);
      svg
        .append("text")
        .attr("class", "bnote")
        .attr("x", 786)
        .attr("y", 126)
        .attr("fill", MUT)
        .attr("font-size", 16)
        .attr("font-family", FONT);

      txt(svg, 30, H - 40, "Same loop, every time. Hold the outside still, change the inside, read the score.", {
        fill: INK,
        size: 19
      });
      txt(svg, 30, H - 12, "Only the size of the box changes.", { fill: CY, size: 21, weight: 700 });

      el.__svg = svg;
      renderBox(el.dataset.state || "p", false);
    },
    function (state) {
      renderBox(state || "p", true);
    }
  );

  /* ======================================================== c-worker
   * Kill the worker while external work continues. Five beats.
   */
  var WORKER_STATES = ["launch", "running", "kill", "retry", "resolved"];

  function renderWorker(state, animate) {
    var el = document.getElementById("c-worker");
    if (!el || !el.__svg) return;
    var svg = el.__svg;
    var i = Math.max(0, WORKER_STATES.indexOf(state));
    var D = animate ? 520 : 0;

    var vis = {
      w1: i <= 2 ? 1 : 0,
      boom: i === 2 ? 1 : 0,
      w2: i >= 3 ? 1 : 0,
      job: i >= 1 ? 1 : 0.25,
      link1: i <= 1 ? 1 : 0,
      link2: i >= 4 ? 1 : 0,
      dup: 0,
      tick: i >= 4 ? 1 : 0
    };
    Object.keys(vis).forEach(function (k) {
      svg.select("." + k).transition().duration(D).attr("opacity", vis[k]);
    });
    svg
      .select(".jobstate")
      .attr("fill", i >= 4 ? GOOD : CY)
      .text(i === 0 ? "SUBMITTED" : i >= 4 ? "still RUNNING" : "RUNNING");
  }

  chart(
    "c-worker",
    function () {
      var el = document.getElementById("c-worker");
      if (!el) return;
      d3.select(el).selectAll("*").remove();
      var H = 340;
      var svg = d3
        .select(el)
        .append("svg")
        .attr("viewBox", "0 0 " + W + " " + H)
        .attr("preserveAspectRatio", "xMidYMid meet");
      arrowDefs(svg, "wk-w", "#4a5a63");
      arrowDefs(svg, "wk-w-cy", CY);

      function box(cls, x, y, w, h, fill, stroke, lines, sub) {
        var g = svg.append("g").attr("class", cls).attr("opacity", 0);
        g.append("rect")
          .attr("x", x)
          .attr("y", y)
          .attr("width", w)
          .attr("height", h)
          .attr("rx", 10)
          .attr("fill", fill)
          .attr("stroke", stroke)
          .attr("stroke-width", 2);
        lines.forEach(function (ln, k) {
          txt(g, x + w / 2, y + 34 + k * 22, ln, { anchor: "middle", fill: INK, size: 17, weight: 500 });
        });
        if (sub) txt(g, x + w / 2, y + h - 14, sub, { anchor: "middle", size: 14 });
        return g;
      }

      txt(svg, 30, 26, "Airflow", { fill: MUT, size: 15 });
      txt(svg, 740, 26, "somebody else's compute", { fill: MUT, size: 15 });
      svg
        .append("path")
        .attr("d", "M 700 44 V 300")
        .attr("stroke", "#2f3d46")
        .attr("stroke-dasharray", "5 6")
        .attr("stroke-width", 1.5);

      box("w1", 40, 120, 210, 96, "#171b1f", "#38474f", ["worker", "runs the task"]);
      box("w2", 40, 120, 210, 96, "#171b1f", GOOD, ["the retry", "reads the stored id"]);
      var job = box("job", 760, 120, 300, 96, "#0e2b2f", CY, ["the external job"], null);
      job
        .append("text")
        .attr("class", "jobstate")
        .attr("x", 910)
        .attr("y", 196)
        .attr("text-anchor", "middle")
        .attr("fill", CY)
        .attr("font-size", 17)
        .attr("font-weight", 700)
        .attr("font-family", MONO)
        .text("SUBMITTED");
      txt(job, 910, 172, "its id is written to task state", { anchor: "middle", size: 14 });

      svg
        .append("path")
        .attr("class", "link1")
        .attr("d", "M 250 168 H 760")
        .attr("stroke", "#4a5a63")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#wk-w)")
        .attr("opacity", 0);
      svg
        .append("path")
        .attr("class", "link2")
        .attr("d", "M 250 168 H 760")
        .attr("stroke", CY)
        .attr("stroke-width", 2.6)
        .attr("marker-end", "url(#wk-w-cy)")
        .attr("opacity", 0);

      var boom = svg.append("g").attr("class", "boom").attr("opacity", 0);
      boom
        .append("path")
        .attr(
          "d",
          "M145 100 l 26 44 l 46 -18 l -22 46 l 44 22 l -48 12 l 12 46 l -42 -26 l -26 42 l -12 -48 l -48 8 l 28 -40 l -40 -28 l 48 -10 z"
        )
        .attr("fill", "#3a1714")
        .attr("stroke", BAD)
        .attr("stroke-width", 2.4);
      txt(boom, 145, 174, "killed", { anchor: "middle", fill: BAD, size: 20, weight: 800 });

      var tick = svg.append("g").attr("class", "tick").attr("opacity", 0);
      txt(tick, 30, H - 46, "One run. Reattached, not resubmitted.", { fill: GOOD, size: 21, weight: 700 });
      txt(tick, 30, H - 18, "That is a check on a system property, and no model was involved in it at all.", {
        fill: MUT,
        size: 17
      });

      el.__svg = svg;
      renderWorker(el.dataset.state || "launch", false);
    },
    function (state) {
      renderWorker(state || "launch", true);
    }
  );

  /* ======================================================== c-models
   * Model cards through one fixed check. Compact on purpose: the point is that
   * the question became empirical, not which model won.
   */
  chart("c-models", function () {
    var H = 350;
    var svg = host("c-models", H);
    if (!svg) return;
    arrowDefs(svg, "wk-m", "#4a5a63");

    var GX = 470,
      GW = 190,
      GY = 88,
      GH = 120;
    svg
      .append("rect")
      .attr("x", GX)
      .attr("y", GY)
      .attr("width", GW)
      .attr("height", GH)
      .attr("rx", 11)
      .attr("fill", "#14171b")
      .attr("stroke", CY)
      .attr("stroke-width", 2.6);
    txt(svg, GX + GW / 2, GY + 52, "the same", { anchor: "middle", fill: "#fff", size: 20, weight: 600 });
    txt(svg, GX + GW / 2, GY + 78, "check", { anchor: "middle", fill: CY, size: 24, weight: 800 });

    var cards = [
      { n: "a frontier model" },
      { n: "a mid-tier one" },
      { n: "open weights, large" },
      { n: "open weights, small" }
    ];

    cards.forEach(function (c, i) {
      var y = 26 + i * 62;
      var g = svg.append("g").attr("opacity", 0);
      g.append("rect")
        .attr("x", 30)
        .attr("y", y)
        .attr("width", 210)
        .attr("height", 52)
        .attr("rx", 8)
        .attr("fill", "#171b1f")
        .attr("stroke", "#38474f")
        .attr("stroke-width", 1.6);
      txt(g, 135, y + 33, c.n, { anchor: "middle", fill: INK, size: 16 });
      g.transition().delay(150 + i * 110).duration(300).attr("opacity", 1);
    });

    // results column
    // results read against the same check, one row per outcome
    var res = [
      { s: "", c: GOOD, n: "" },
      { s: "✓", c: GOOD, n: "passes (for less)" },
      { s: "✗", c: BAD, n: "doesn't pass" },
      { s: "", c: BAD, n: "" },
    // TODO: Had to add buffer when removing 4 out of 2.  Looks bad.  We should fix
    ];
    res.forEach(function (r, i) {
      var y = 52 + i * 60;
      var g = svg.append("g").attr("opacity", 0);
      txt(g, 720, y, r.s, { fill: r.c, size: 26, weight: 800 });
      txt(g, 756, y - 2, r.n, { fill: r.c === GOOD ? "#d6ffe8" : r.c === BAD ? "#ffc9c1" : "#ffe1ab", size: 17 });
      g.transition().delay(700 + i * 160).duration(320).attr("opacity", 1);
    });

    svg
      .append("path")
      .attr("d", "M 246 148 H " + (GX - 12))
      .attr("stroke", "#4a5a63")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#wk-m)");
    svg
      .append("path")
      .attr("d", "M " + (GX + GW + 12) + " 148 H 700")
      .attr("stroke", "#4a5a63")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#wk-m)");

    txt(svg, 30, H - 40, "There is always another model next month.", { fill: MUT, size: 18 });
    txt(svg, 30, H - 12, "The check has to survive the model", {
      fill: CY,
      size: 21,
      weight: 700
    });
  });

  /* ==========================================================================
   * ALTERNATIVE TREATMENT of the Kill The Worker pair, marked [A2] in the deck.
   *
   * The point of these four is not the crash. It is that a hard-to-verify branch
   * in somebody else's unreleased code became testable because the environment
   * was disposable and the mutator sat outside it, and because the person who
   * wrote the code supplied the hypotheses without having to run anything.
   * ======================================================================== */

  /* ======================================================== c-branch
   * The five-way decision the mixin makes, drawn as a fan. Beat 2 marks the
   * column that is the actual problem: those states live in someone else's cloud.
   */
  var BRANCHES = [
    { c: "no state store at all", d: "no_task_state_store", mine: 1 },
    { c: "no stored id yet", d: "fresh_submit", mine: 1 },
    { c: "stored id, still RUNNING", d: "reconnect", mine: 0 },
    { c: "stored id, already SUCCEEDED", d: "already_succeeded", mine: 0 },
    { c: "stored id, FAILED / STOPPED / gone", d: "terminal_resubmit", mine: 0 }
  ];

  function renderBranch(state, animate) {
    var el = document.getElementById("c-branch");
    if (!el || !el.__svg) return;
    var svg = el.__svg,
      D = animate ? 520 : 0;
    var hard = state === "hard" || state === "theirs";
    svg
      .selectAll("g.br")
      .transition()
      .duration(D)
      .attr("opacity", 1);
    svg
      .selectAll("g.br")
      .select("rect.cond")
      .transition()
      .duration(D)
      .attr("stroke", function (d) {
        return hard && !d.mine ? WARN : "#38474f";
      })
      .attr("stroke-width", function (d) {
        return hard && !d.mine ? 2.4 : 1.6;
      });
    svg.select(".hardnote").transition().duration(D).attr("opacity", hard ? 1 : 0);
    svg.select(".theirsnote").transition().duration(D).attr("opacity", state === "theirs" ? 1 : 0);
  }

  chart(
    "c-branch",
    function () {
      var el = document.getElementById("c-branch");
      if (!el) return;
      d3.select(el).selectAll("*").remove();
      var H = 440;
      var svg = d3
        .select(el)
        .append("svg")
        .attr("viewBox", "0 0 " + W + " " + H)
        .attr("preserveAspectRatio", "xMidYMid meet");
      arrowDefs(svg, "wk-br", "#4a5a63");

      var x0 = 20,
        w0 = 190,
        cx = 250,
        cw = 330,
        dx = 630,
        dw = 300,
        y0 = 46,
        rh = 52,
        gap = 14;

      svg
        .append("rect")
        .attr("x", x0)
        .attr("y", y0 + 2 * (rh + gap))
        .attr("width", w0)
        .attr("height", rh)
        .attr("rx", 9)
        .attr("fill", "#171b1f")
        .attr("stroke", "#5b6b74")
        .attr("stroke-width", 2);
      txt(svg, x0 + w0 / 2, y0 + 2 * (rh + gap) + 32, "a retry begins", {
        anchor: "middle",
        fill: INK,
        size: 17,
        weight: 500
      });

      txt(svg, cx, y0 - 12, "what is true at that moment", { size: 14 });
      txt(svg, dx, y0 - 12, "what the operator then does", { size: 14 });

      var rows = svg
        .selectAll("g.br")
        .data(BRANCHES)
        .enter()
        .append("g")
        .attr("class", "br");

      rows.each(function (d, i) {
        var g = d3.select(this),
          y = y0 + i * (rh + gap);
        g.append("path")
          .attr("d", "M" + (x0 + w0) + " " + (y0 + 2 * (rh + gap) + rh / 2) + " C " + (cx - 40) + " " + (y0 + 2 * (rh + gap) + rh / 2) + ", " + (cx - 40) + " " + (y + rh / 2) + ", " + cx + " " + (y + rh / 2))
          .attr("fill", "none")
          .attr("stroke", "#3c4c56")
          .attr("stroke-width", 1.8)
          .attr("marker-end", "url(#wk-br)");
        g.append("rect")
          .attr("class", "cond")
          .attr("x", cx)
          .attr("y", y)
          .attr("width", cw)
          .attr("height", rh)
          .attr("rx", 8)
          .attr("fill", "#171b1f")
          .attr("stroke", "#38474f")
          .attr("stroke-width", 1.6);
        txt(g, cx + 16, y + 32, d.c, { fill: INK, size: 16 });
        g.append("path")
          .attr("d", "M" + (cx + cw) + " " + (y + rh / 2) + " H " + dx)
          .attr("stroke", "#3c4c56")
          .attr("stroke-width", 1.8)
          .attr("marker-end", "url(#wk-br)");
        g.append("rect")
          .attr("x", dx)
          .attr("y", y)
          .attr("width", dw)
          .attr("height", rh)
          .attr("rx", 8)
          .attr("fill", "#14171b")
          .attr("stroke", CY_DK)
          .attr("stroke-width", 1.8);
        txt(g, dx + 16, y + 32, d.d, { fill: CY, size: 16, mono: 1, weight: 600 });
      });

      var hn = svg.append("g").attr("class", "hardnote").attr("opacity", 0);
      txt(hn, cx, H - 46, "Three of these live in somebody else's cloud, and only at the instant a retry fires.", {
        fill: WARN,
        size: 18,
        weight: 600
      });
      var tn = svg.append("g").attr("class", "theirsnote").attr("opacity", 0);
      txt(tn, cx, H - 14, "None of it is my code. It was merged four days earlier and is still unreleased.", {
        fill: "#fff",
        size: 18,
        weight: 600
      });

      el.__svg = svg;
      renderBranch(el.dataset.state || "base", false);
    },
    function (state) {
      renderBranch(state || "base", true);
    }
  );

  /* ======================================================== c-levers
   * The centrepiece. One disposable Airflow inside a container, the agent
   * outside it, and five levers that reach in. Each lever forces one branch,
   * and not one of them is something a test living inside the Dag could do.
   */
  var LEVERS = [
    { k: "l1", cmd: "docker kill mutant-worker", to: "worker", forces: "reconnect", note: "at 22s of a 75s job, so the retry lands while Glue is still RUNNING" },
    { k: "l2", cmd: "script_args = INVALID-DATE", to: "dag", forces: "terminal_resubmit", note: "poison the input so the Glue script raises" },
    { k: "l3", cmd: "glue.batch_stop_job_run(...)", to: "glue", forces: "terminal_resubmit", note: "reach past Airflow entirely and cancel it at the source" },
    { k: "l4", cmd: "UPDATE task_state_store …", to: "store", forces: "NOT_FOUND", note: "make Airflow remember an id that never existed" },
    { k: "l5", cmd: "LOGGING_LEVEL = DEBUG", to: "conf", forces: "fresh_submit", note: "one branch only ever logs at DEBUG, so it is invisible by default" }
  ];

  var LEV_TARGET = {
    worker: [430, 132],
    dag: [430, 214],
    glue: [970, 176],
    store: [640, 214],
    conf: [640, 132]
  };

  function renderLevers(state, animate) {
    var el = document.getElementById("c-levers");
    if (!el || !el.__svg) return;
    var svg = el.__svg,
      D = animate ? 460 : 0;
    var idx = -1;
    LEVERS.forEach(function (l, i) {
      if (l.k === state) idx = i;
    });

    var showAll = state === "all";
    svg
      .selectAll("g.lev")
      .transition()
      .duration(D)
      .attr("opacity", function (d, i) {
        if (showAll) return 0.85;
        return idx < 0 ? 0 : i === idx ? 1 : 0.16;
      });
    svg
      .selectAll("g.box")
      .transition()
      .duration(D)
      .attr("opacity", function (d) {
        if (showAll || idx < 0) return 1;
        return LEVERS[idx].to === d ? 1 : 0.4;
      });

    var cur = idx >= 0 ? LEVERS[idx] : null;
    svg.select(".levcmd").text(cur ? cur.cmd : "");
    svg.select(".levnote").text(cur ? cur.note : "");
    svg.select(".levforce").text(cur ? "→ " + cur.forces : "");
    svg
      .select(".levall")
      .transition()
      .duration(D)
      .attr("opacity", state === "all" ? 1 : 0);
  }

  chart(
    "c-levers",
    function () {
      var el = document.getElementById("c-levers");
      if (!el) return;
      d3.select(el).selectAll("*").remove();
      var H = 420;
      var svg = d3
        .select(el)
        .append("svg")
        .attr("viewBox", "0 0 " + W + " " + H)
        .attr("preserveAspectRatio", "xMidYMid meet");
      arrowDefs(svg, "wk-lev", WARN);

      // the disposable container
      svg
        .append("rect")
        .attr("x", 250)
        .attr("y", 76)
        .attr("width", 600)
        .attr("height", 200)
        .attr("rx", 14)
        .attr("fill", "#101519")
        .attr("stroke", CY_DK)
        .attr("stroke-width", 2.4)
        .attr("stroke-dasharray", "9 6");
      txt(svg, 268, 66, "one docker compose. Airflow, and everything in it, disposable.", {
        fill: CY,
        size: 16,
        weight: 600
      });

      var boxes = [
        { k: "worker", x: 272, y: 106, w: 150, h: 52, t: "worker" },
        { k: "conf", x: 440, y: 106, w: 180, h: 52, t: "scheduler + config" },
        { k: "dag", x: 272, y: 188, w: 150, h: 52, t: "the Dag" },
        { k: "store", x: 440, y: 188, w: 180, h: 52, t: "task_state_store" },
        { k: "trig", x: 640, y: 106, w: 190, h: 52, t: "triggerer" },
        { k: "prov", x: 640, y: 188, w: 190, h: 52, t: "the fork, mounted" }
      ];
      svg
        .selectAll("g.box")
        .data(boxes.map(function (b) {
          return b.k;
        }))
        .enter()
        .append("g")
        .attr("class", "box")
        .each(function (k, i) {
          var b = boxes[i],
            g = d3.select(this);
          g.append("rect")
            .attr("x", b.x)
            .attr("y", b.y)
            .attr("width", b.w)
            .attr("height", b.h)
            .attr("rx", 8)
            .attr("fill", "#171b1f")
            .attr("stroke", "#38474f")
            .attr("stroke-width", 1.8);
          txt(g, b.x + b.w / 2, b.y + 32, b.t, { anchor: "middle", fill: INK, size: 16 });
        });

      // somebody else's cloud, outside the container on purpose
      svg
        .append("rect")
        .attr("x", 900)
        .attr("y", 148)
        .attr("width", 200)
        .attr("height", 56)
        .attr("rx", 9)
        .attr("fill", "#0e2b2f")
        .attr("stroke", CY)
        .attr("stroke-width", 2.2);
      txt(svg, 1000, 182, "AWS Glue", { anchor: "middle", fill: "#dff8fa", size: 17, weight: 600 });
      txt(svg, 1000, 138, "not mine, not disposable", { anchor: "middle", size: 13 });

      // the agent, outside everything
      var ag = svg.append("g");
      ag.append("circle").attr("cx", 110).attr("cy", 150).attr("r", 11)
        .attr("fill", "none").attr("stroke", WARN).attr("stroke-width", 2.4);
      ag.append("path")
        .attr("d", "M110 161 V 190 M96 172 H 124 M110 190 L 98 214 M110 190 L 122 214")
        .attr("fill", "none").attr("stroke", WARN).attr("stroke-width", 2.4);
      txt(svg, 110, 244, "the agent", { anchor: "middle", fill: WARN, size: 17, weight: 700 });
      txt(svg, 110, 266, "outside the box", { anchor: "middle", fill: WARN, size: 15 });

      // the levers
      svg
        .selectAll("g.lev")
        .data(LEVERS)
        .enter()
        .append("g")
        .attr("class", "lev")
        .attr("opacity", 0)
        .each(function (d) {
          var t = LEV_TARGET[d.to],
            g = d3.select(this);
          var sx = 138,
            sy = 176;
          g.append("path")
            .attr("d", "M" + sx + " " + sy + " C " + (sx + 90) + " " + sy + ", " + (t[0] - 90) + " " + t[1] + ", " + t[0] + " " + t[1])
            .attr("fill", "none")
            .attr("stroke", WARN)
            .attr("stroke-width", 2.6)
            .attr("marker-end", "url(#wk-lev)");
        });

      svg
        .append("text")
        .attr("class", "levcmd")
        .attr("x", 20)
        .attr("y", 322)
        .attr("fill", "#fff")
        .attr("font-size", 21)
        .attr("font-weight", 600)
        .attr("font-family", MONO);
      svg
        .append("text")
        .attr("class", "levforce")
        .attr("x", 20)
        .attr("y", 350)
        .attr("fill", CY)
        .attr("font-size", 18)
        .attr("font-weight", 700)
        .attr("font-family", MONO);
      svg
        .append("text")
        .attr("class", "levnote")
        .attr("x", 20)
        .attr("y", 378)
        .attr("fill", MUT)
        .attr("font-size", 17)
        .attr("font-family", FONT);

      var la = svg.append("g").attr("class", "levall").attr("opacity", 0);
      txt(la, 20, 410, el.dataset.line || "Not one of those five is something a test living inside the Dag could do.", {
        fill: CY,
        size: 21,
        weight: 700
      });

      el.__svg = svg;
      renderLevers(el.dataset.state || "base", false);
    },
    function (state) {
      renderLevers(state || "base", true);
    }
  );

  /* ======================================================== c-hypo
   * The expert names the hypotheses; each becomes a physical intervention. He
   * never ran any of them. Rows are revealed two at a time to keep it moving.
   */
  var HYPO = [
    { q: "“still running at retry”", a: "kill the worker at 22s of a 75s job" },
    { q: "“WAITING”", a: "queue it behind the concurrent-run limit" },
    { q: "“FAILED or TIMEOUT”", a: "poison the args so the script raises" },
    { q: "“STOPPED”", a: "cancel it from the console, mid-flight" },
    { q: "“run id no longer in Glue history”", a: "write a fake id into task_state_store" },
    { q: "“durable=False as a control”", a: "run the same kill with the feature off" }
  ];

  function renderHypo(state, animate) {
    var el = document.getElementById("c-hypo");
    if (!el || !el.__svg) return;
    var svg = el.__svg,
      D = animate ? 480 : 0;
    var shown = { base: 0, two: 2, four: 4, six: 6, closed: 6 }[state];
    if (shown == null) shown = 0;
    var SELF = el.dataset.selfrun === "1";
    if (SELF) {
      shown = 6;
      D = 420;
    }
    var stag = function (d, i) {
      return SELF ? 260 + i * 340 : 0;
    };
    svg
      .selectAll("g.hyr")
      .select(".ans")
      .transition()
      .duration(D)
      .delay(stag)
      .attr("opacity", function (d, i) {
        return i < shown ? 1 : 0;
      });
    svg
      .selectAll("g.hyr")
      .select(".hyarrow")
      .transition()
      .duration(D)
      .delay(stag)
      .attr("opacity", function (d, i) {
        return i < shown ? 0.9 : 0;
      });
    svg.select(".hyclose").transition().duration(D)
      .delay(SELF ? 260 + 6 * 340 : 0)
      .attr("opacity", SELF || state === "closed" ? 1 : 0);
  }

  chart(
    "c-hypo",
    function () {
      var el = document.getElementById("c-hypo");
      if (!el) return;
      d3.select(el).selectAll("*").remove();
      var H = 420;
      var svg = d3
        .select(el)
        .append("svg")
        .attr("viewBox", "0 0 " + W + " " + H)
        .attr("preserveAspectRatio", "xMidYMid meet");
      arrowDefs(svg, "wk-hy", GOOD);

      txt(svg, 20, 26, "what the person who wrote it told me to try", { fill: INK, size: 17, weight: 600 });
      txt(svg, 560, 26, "what the loop did about it", { fill: GOOD, size: 17, weight: 600 });

      var y0 = 44,
        rh = 46,
        gap = 10;
      svg
        .selectAll("g.hyr")
        .data(HYPO)
        .enter()
        .append("g")
        .attr("class", "hyr")
        .each(function (d, i) {
          var g = d3.select(this),
            y = y0 + i * (rh + gap);
          g.append("rect")
            .attr("x", 20)
            .attr("y", y)
            .attr("width", 470)
            .attr("height", rh)
            .attr("rx", 8)
            .attr("fill", "#171b1f")
            .attr("stroke", "#38474f")
            .attr("stroke-width", 1.6);
          txt(g, 36, y + 29, d.q, { fill: INK, size: 16 });
          g.append("path")
            .attr("class", "hyarrow")
            .attr("d", "M494 " + (y + rh / 2) + " H 552")
            .attr("stroke", GOOD)
            .attr("stroke-width", 2.2)
            .attr("marker-end", "url(#wk-hy)")
            .attr("opacity", 0);
          var ans = g.append("g").attr("class", "ans").attr("opacity", 0);
          ans
            .append("rect")
            .attr("x", 560)
            .attr("y", y)
            .attr("width", 540)
            .attr("height", rh)
            .attr("rx", 8)
            .attr("fill", "#122420")
            .attr("stroke", GOOD)
            .attr("stroke-width", 1.8);
          txt(ans, 578, y + 29, d.a, { fill: "#d6ffe8", size: 16 });
        });

      var cl = svg.append("g").attr("class", "hyclose").attr("opacity", 0);
      txt(cl, 20, H - 12, "He never ran any of them. He read the results and said every bit checked out.", {
        fill: CY,
        size: 21,
        weight: 700
      });

      el.__svg = svg;
      renderHypo(el.dataset.state || "base", false);
    },
    function (state) {
      renderHypo(state || "base", true);
    }
  );

  /* ======================================================== c-config
   * Which branch you observe is a function of your scheduler config. Same
   * failure, two thresholds, two different branches.
   */
  function renderConfig(state, animate) {
    var el = document.getElementById("c-config");
    if (!el || !el.__svg) return;
    var svg = el.__svg,
      D = animate ? 700 : 0;
    var deflt = state === "defaults";
    var X0 = 90,
      SCALE = 3.1; // px per second
    var rx = X0 + (deflt ? 300 : 40) * SCALE;

    svg.select(".retry").transition().duration(D).attr("transform", "translate(" + rx + ",0)");
    // Flip the label inboard once the marker is near the right-hand edge.
    svg
      .select(".retrylab")
      .attr("text-anchor", deflt ? "end" : "start")
      .attr("x", deflt ? -10 : 8)
      .text(deflt ? "retry fires at ~5 min" : "retry fires at ~40s");
    svg
      .select(".branchlab")
      .transition()
      .duration(D)
      .attr("opacity", 1)
      .attr("fill", deflt ? WARN : CY)
      .text(deflt ? "already_succeeded, every time" : "reconnect");
    svg
      .select(".cfg")
      .text(
        deflt
          ? "heartbeat timeout 300s · orphan check 300s   (the defaults)"
          : "heartbeat timeout 30s · orphan check 10s   (what I set)"
      );
    svg.select(".jobend").transition().duration(D).attr("opacity", deflt ? 1 : 0.25);
  }

  chart(
    "c-config",
    function () {
      var el = document.getElementById("c-config");
      if (!el) return;
      d3.select(el).selectAll("*").remove();
      var H = 300;
      var svg = d3
        .select(el)
        .append("svg")
        .attr("viewBox", "0 0 " + W + " " + H)
        .attr("preserveAspectRatio", "xMidYMid meet");
      var X0 = 90,
        SCALE = 3.1,
        BY = 96,
        BH = 54;

      // the Glue job, 75 seconds of it
      svg
        .append("rect")
        .attr("x", X0)
        .attr("y", BY)
        .attr("width", 75 * SCALE)
        .attr("height", BH)
        .attr("rx", 7)
        .attr("fill", "#0e2b2f")
        .attr("stroke", CY)
        .attr("stroke-width", 2);
      txt(svg, X0 + 14, BY + 34, "the Glue job runs for 75s", { fill: "#dff8fa", size: 17 });
      svg
        .append("g")
        .attr("class", "jobend")
        .attr("opacity", 0.25)
        .append("path")
        .attr("d", "M" + (X0 + 75 * SCALE) + " " + (BY - 10) + " V " + (BY + BH + 10))
        .attr("stroke", MUT)
        .attr("stroke-width", 1.6)
        .attr("stroke-dasharray", "4 4");

      // the kill
      var kx = X0 + 22 * SCALE;
      svg.append("path").attr("d", "M" + kx + " " + (BY - 26) + " V " + (BY + BH + 14))
        .attr("stroke", BAD).attr("stroke-width", 2.4);
      txt(svg, kx, BY - 34, "worker killed at 22s", { anchor: "middle", fill: BAD, size: 15, weight: 600 });

      // the retry marker, which is the thing that moves
      var r = svg.append("g").attr("class", "retry");
      r.append("path").attr("d", "M0 " + (BY - 8) + " V " + (BY + BH + 40))
        .attr("stroke", "#fff").attr("stroke-width", 2.6);
      r.append("text")
        .attr("class", "retrylab")
        .attr("x", 8)
        .attr("y", BY + BH + 58)
        .attr("fill", "#fff")
        .attr("font-size", 17)
        .attr("font-weight", 600)
        .attr("font-family", FONT)
        .text("retry fires at ~40s");

      txt(svg, X0, 250, "", { size: 17 }).attr("class", "cfg").attr("fill", MUT);
      svg
        .append("text")
        .attr("class", "branchlab")
        .attr("x", X0)
        .attr("y", 284)
        .attr("fill", CY)
        .attr("font-size", 23)
        .attr("font-weight", 800)
        .attr("font-family", MONO)
        .attr("opacity", 0);
      txt(svg, X0, 224, "what you observe:", { size: 15 });

      el.__svg = svg;
      renderConfig(el.dataset.state || "tuned", false);
    },
    function (state) {
      renderConfig(state || "tuned", true);
    }
  );
})();
