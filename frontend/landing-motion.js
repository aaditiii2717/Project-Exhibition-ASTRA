/* Scroll motion for the sections below the orbit sequence.
   Deliberately separate from script.js so the 660-frame renderer is untouched. */
(() => {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Split a heading into its rendered lines so each can clip up in turn.
     Existing <br> marks an intentional break; anything else wraps naturally. */
  function splitLines(el) {
    if (el.dataset.split === "done") return;
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts
      .map((part, i) => `<span class="line-reveal"><span style="--i:${i}">${part.trim()}</span></span>`)
      .join("");
    el.dataset.split = "done";
  }

  /* Number each child so CSS can stagger it. */
  function indexChildren(container) {
    [...container.children].forEach((child, i) => child.style.setProperty("--i", i));
  }

  function init() {
    const headings = document.querySelectorAll(
      ".statement h2, .architecture__intro h2, .deployment__intro h2, .scenarios__heading h2, .closing__copy h2"
    );
    if (!reduced) headings.forEach(splitLines);

    // Stagger containers: registers, tables, card grids, spec rows.
    const staggerMap = [
      [".anomaly-strip", "cards"],
      [".scenario-list", "rows"],
      [".spec-list", "rows"],
      [".trust-streams", "cards"],
      [".deployment-flow", "cards"],
      [".closing__strip", "rows"]
    ];
    const staggered = [];
    staggerMap.forEach(([sel, kind]) => {
      document.querySelectorAll(sel).forEach((el) => {
        el.setAttribute("data-stagger", kind);
        indexChildren(el);
        staggered.push(el);
      });
    });

    // Panels that should settle rather than slide.
    document.querySelectorAll(".trust-flow, .earth-console").forEach((el) => {
      el.classList.add("panel-rise");
      staggered.push(el);
    });

    if (reduced) {
      staggered.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    /* A nested stagger group inside a panel that starts at opacity 0 never
       intersects, so revealing a parent must cascade to its descendants. */
    const reveal = (el) => {
      if (el.classList.contains("is-revealed")) return;
      el.classList.add("is-revealed");
      el.querySelectorAll("[data-stagger], .panel-rise").forEach((child) => {
        window.setTimeout(() => child.classList.add("is-revealed"), 120);
      });
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    staggered.forEach((el) => io.observe(el));

    /* Safety net: nothing may stay invisible because an observer never fired. */
    const sweep = () => {
      staggered.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 1.1) reveal(el);
      });
    };
    addEventListener("scroll", sweep, { passive: true });
    window.setTimeout(sweep, 1200);

    /* Parallax on the Earth console figure. Transform only, rAF-throttled. */
    const stage = document.querySelector(".earth-stage");
    if (stage) {
      stage.setAttribute("data-parallax", "");
      let ticking = false;
      const update = () => {
        ticking = false;
        const r = stage.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const mid = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        stage.style.setProperty("--py", `${(-mid * 26).toFixed(1)}px`);
      };
      addEventListener("scroll", () => {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
      }, { passive: true });
      update();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
