(() => {
  "use strict";

  const FRAME_COUNT = 660;
  const FRAME_EASE = 0.16;
  const CACHE_LIMIT = 8;

  const story = document.getElementById("orbitStory");
  const canvas = document.getElementById("orbitCanvas");
  const context = canvas.getContext("2d", { alpha: false, desynchronized: true });
  const boot = document.getElementById("boot");
  const bootValue = document.getElementById("bootValue");
  const bootLine = document.getElementById("bootLine");
  const topbar = document.getElementById("topbar");
  const scrollCue = document.getElementById("scrollCue");
  const storyProgress = document.getElementById("storyProgress");
  const storyCopies = [...document.querySelectorAll(".story-copy")];
  const storyResult = document.getElementById("storyResult");

  const cache = new Map();
  const loading = new Map();

  let viewportWidth = 0;
  let viewportHeight = 0;
  let currentFrame = 0;
  let targetFrame = 0;
  let lastDrawn = -1;
  let progress = 0;
  let direction = 1;
  let ready = false;
  let frameRoot = "frames";
  let scrollFrame = 0;
  let sequenceFrame = 0;
  let storyInRenderRange = true;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smoothstep = (value) => value * value * (3 - 2 * value);
  const frameURL = (index, root = frameRoot) => `${root}/frame_${String(index + 1).padStart(4, "0")}.jpg`;

  function preferredFrameRoot() {
    const physicalWidth = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
    return physicalWidth > 2000 ? "frames-4k" : "frames";
  }

  function clearFrameMemory() {
    loading.forEach((task) => {
      task.image.onload = null;
      task.image.onerror = null;
      task.image.src = "";
      task.resolve(null);
    });
    loading.clear();
    cache.forEach((image) => { image.src = ""; });
    cache.clear();
  }

  function resizeCanvas() {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    const nextRoot = preferredFrameRoot();
    if (ready && nextRoot !== frameRoot) {
      clearFrameMemory();
      frameRoot = nextRoot;
      requestFrame(Math.round(currentFrame), true);
    } else {
      frameRoot = nextRoot;
    }
    const dprLimit = viewportWidth <= 640 ? 1.25 : 1.6;
    const dpr = Math.min(window.devicePixelRatio || 1, dprLimit);
    canvas.width = Math.round(viewportWidth * dpr);
    canvas.height = Math.round(viewportHeight * dpr);
    canvas.style.width = `${viewportWidth}px`;
    canvas.style.height = `${viewportHeight}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    lastDrawn = -1;
  }

  function touch(index, image) {
    cache.delete(index);
    cache.set(index, image);
    return image;
  }

  function trimCache() {
    const focus = Math.round(currentFrame);
    while (cache.size > CACHE_LIMIT) {
      let candidate = null;
      let distance = -1;
      cache.forEach((image, index) => {
        const nextDistance = Math.abs(index - focus);
        if (nextDistance > distance) {
          candidate = index;
          distance = nextDistance;
        }
      });
      const oldImage = cache.get(candidate);
      cache.delete(candidate);
      if (oldImage) oldImage.src = "";
    }
  }

  function cancelDistantLoads(focus) {
    loading.forEach((task, index) => {
      if (index !== 0 && Math.abs(index - focus) > 20) {
        task.image.onload = null;
        task.image.onerror = null;
        task.image.src = "";
        task.resolve(null);
        loading.delete(index);
      }
    });
  }

  function requestFrame(rawIndex, highPriority = false) {
    const index = Math.round(clamp(rawIndex, 0, FRAME_COUNT - 1));
    if (cache.has(index)) return Promise.resolve(touch(index, cache.get(index)));
    if (loading.has(index)) return loading.get(index).promise;

    const image = new Image();
    const requestedRoot = frameRoot;
    let triedFallback = requestedRoot === "frames";
    let resolveTask;
    const promise = new Promise((resolve) => { resolveTask = resolve; });
    loading.set(index, { image, promise, resolve: resolveTask });

    image.decoding = "async";
    image.fetchPriority = highPriority ? "high" : "auto";
    image.onload = () => {
      loading.delete(index);
      touch(index, image);
      trimCache();
      lastDrawn = -1;
      if (!ready) {
        ready = true;
        bootValue.textContent = "100";
        bootLine.style.transform = "scaleX(1)";
        updateStory();
        drawFrame(0);
        requestAnimationFrame(() => boot.classList.add("is-ready"));
      }
      resolveTask(image);
    };
    image.onerror = () => {
      if (!triedFallback) {
        triedFallback = true;
        image.src = frameURL(index, "frames");
        return;
      }
      loading.delete(index);
      resolveTask(null);
    };
    image.src = frameURL(index, requestedRoot);
    return promise;
  }

  function nearestFrame(index) {
    if (cache.has(index)) return touch(index, cache.get(index));
    let image = null;
    let distance = Infinity;
    cache.forEach((candidate, candidateIndex) => {
      const candidateDistance = Math.abs(candidateIndex - index);
      if (candidateDistance < distance) {
        image = candidate;
        distance = candidateDistance;
      }
    });
    return image;
  }

  function drawFrame(index) {
    const image = nearestFrame(index);
    if (!image?.naturalWidth) return;

    const overscan = viewportWidth <= 640 ? 1.07 : 1.025;
    const scale = Math.max(
      viewportWidth / image.naturalWidth,
      viewportHeight / image.naturalHeight
    ) * overscan;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const x = Math.round((viewportWidth - width) / 2);
    const y = Math.round((viewportHeight - height) / 2);

    context.fillStyle = "#000000";
    context.fillRect(0, 0, viewportWidth, viewportHeight);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, x, y, width, height);
  }

  function chapterOpacity(value, start, end, first) {
    if (first) {
      if (value < start || value > end) return 0;
      const fadeStart = end - 0.045;
      return value < fadeStart ? 1 : smoothstep(clamp((end - value) / (end - fadeStart)));
    }
    if (value < start || value > end) return 0;
    const fade = Math.min(0.035, (end - start) * 0.28);
    if (value < start + fade) return smoothstep((value - start) / fade);
    if (value > end - fade) return smoothstep((end - value) / fade);
    return 1;
  }

  function updateStory() {
    const rect = story.getBoundingClientRect();
    const travel = Math.max(1, story.offsetHeight - viewportHeight);
    progress = clamp(-rect.top / travel);
    storyInRenderRange = rect.bottom > 1 && rect.top < viewportHeight * 1.35;

    const previousTarget = targetFrame;
    targetFrame = progress * (FRAME_COUNT - 1);
    if (Math.abs(targetFrame - previousTarget) > 0.2) direction = targetFrame >= previousTarget ? 1 : -1;

    topbar.classList.toggle("is-scrolled", window.scrollY > 18);
    if (!storyInRenderRange) {
      if (Math.abs(targetFrame - currentFrame) > 0.01) ensureSequenceAnimation();
      return;
    }

    if (ready) {
      const target = Math.round(targetFrame);
      cancelDistantLoads(target);
      [0, direction, direction * 2, -direction].forEach((offset, index) => {
        requestFrame(target + offset, index === 0);
      });
    }

    storyProgress.style.transform = `scaleX(${progress})`;
    scrollCue.style.opacity = clamp(1 - progress * 13);

    storyCopies.forEach((copy, index) => {
      const start = Number(copy.dataset.start);
      const end = Number(copy.dataset.end);
      const opacity = chapterOpacity(progress, start, end, index === 0);
      const mobile = viewportWidth <= 640;
      copy.style.opacity = opacity;
      copy.style.transform = mobile
        ? `translateY(${(1 - opacity) * 24}px)`
        : `translateY(calc(-42% + ${(1 - opacity) * 28}px))`;
      copy.classList.toggle("is-visible", opacity > 0.65);
    });

    const resultProgress = smoothstep(clamp((progress - 0.815) / 0.075));
    storyResult.style.opacity = resultProgress;
    storyResult.style.transform = `translateY(${(1 - resultProgress) * 24}px)`;
    storyResult.classList.toggle("is-visible", resultProgress > 0.6);
    ensureSequenceAnimation();
  }

  function queueStoryUpdate() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      updateStory();
    });
  }

  function animate() {
    sequenceFrame = 0;
    currentFrame += (targetFrame - currentFrame) * FRAME_EASE;
    if (Math.abs(targetFrame - currentFrame) < 0.01) currentFrame = targetFrame;
    const frame = Math.round(currentFrame);

    if (frame !== lastDrawn || !ready) {
      if (ready) {
        requestFrame(frame, true);
        requestFrame(frame + direction, true);
        requestFrame(frame + direction * 2);
      }
      drawFrame(frame);
      lastDrawn = frame;
    }
    const unsettled = Math.abs(targetFrame - currentFrame) >= 0.01;
    if (!ready || storyInRenderRange || unsettled) ensureSequenceAnimation();
  }

  function ensureSequenceAnimation() {
    if (!sequenceFrame) sequenceFrame = requestAnimationFrame(animate);
  }

  function startSequence() {
    bootValue.textContent = "12";
    bootLine.style.transform = "scaleX(.12)";
    const initialFrame = Math.round(currentFrame);
    requestFrame(initialFrame, true).then(() => {
      if (initialFrame === 0) [1, 2, 3, 4].forEach((index) => requestFrame(index));
    });
  }

  function setInitialSequencePosition() {
    const anchorSkipsSequence = window.location.hash && window.location.hash !== "#top";
    if (!anchorSkipsSequence) return;
    currentFrame = FRAME_COUNT - 1;
    targetFrame = FRAME_COUNT - 1;
    lastDrawn = FRAME_COUNT - 1;
    storyInRenderRange = false;
  }

  function initLandingInterface() {
    const discoverLink = document.querySelector('.hero-action[href="#trust"]');
    const trustSection = document.getElementById("trust");
    discoverLink?.addEventListener("click", (event) => {
      if (!trustSection) return;
      event.preventDefault();

      // This CTA is an intentional chapter skip. Avoid traversing the 660-frame
      // scroll track and cancel any image requests that are no longer relevant.
      const root = document.documentElement;
      const previousBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      currentFrame = FRAME_COUNT - 1;
      targetFrame = FRAME_COUNT - 1;
      direction = 1;
      storyInRenderRange = false;
      clearFrameMemory();
      window.scrollTo({ top: trustSection.offsetTop, left: 0, behavior: "auto" });
      window.history.pushState(null, "", "#trust");
      updateStory();

      requestAnimationFrame(() => requestAnimationFrame(() => {
        root.style.scrollBehavior = previousBehavior;
      }));
    });

    const revealItems = [...document.querySelectorAll(".reveal")];
    const trustFlow = document.getElementById("trustFlow");
    const architectureScore = document.getElementById("architectureScore");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scorePlayed = false;

    const revealTrustScore = () => {
      if (scorePlayed || !architectureScore) return;
      scorePlayed = true;
      if (reducedMotion) {
        architectureScore.textContent = "98.4";
        return;
      }

      architectureScore.textContent = "0.0";
      window.setTimeout(() => {
        const duration = 1250;
        const startedAt = performance.now();
        const tick = (time) => {
          const elapsed = Math.min(1, (time - startedAt) / duration);
          const eased = 1 - Math.pow(1 - elapsed, 3);
          architectureScore.textContent = (98.4 * eased).toFixed(1);
          if (elapsed < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, 950);
    };

    if ("IntersectionObserver" in window && !reducedMotion) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          if (entry.target === trustFlow) revealTrustScore();
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.14, rootMargin: "0px 0px -8%" });
      revealItems.forEach((item) => revealObserver.observe(item));
    } else {
      revealItems.forEach((item) => item.classList.add("is-revealed"));
      revealTrustScore();
    }

    const trustMotionSvg = trustFlow?.querySelector(".trust-flow__paths");
    if (trustFlow && !reducedMotion) {
      const setTrustMotion = (isActive) => {
        trustFlow.classList.toggle("is-motion-active", isActive);
        if (!trustMotionSvg || typeof trustMotionSvg.pauseAnimations !== "function") return;
        if (isActive) trustMotionSvg.unpauseAnimations();
        else trustMotionSvg.pauseAnimations();
      };

      if ("IntersectionObserver" in window) {
        const trustMotionObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => setTrustMotion(entry.isIntersecting));
        }, { threshold: 0.06, rootMargin: "80px 0px" });
        trustMotionObserver.observe(trustFlow);
      } else {
        setTrustMotion(true);
      }
    }

    const utcClocks = document.querySelectorAll("[data-utc-clock]");
    const currentYears = document.querySelectorAll("[data-current-year]");
    const updateUtc = () => {
      const now = new Date();
      utcClocks.forEach((clock) => {
        clock.textContent = `UTC / ${now.toISOString().slice(11, 19)}`;
      });
      currentYears.forEach((year) => {
        year.textContent = String(now.getUTCFullYear());
      });
    };
    updateUtc();
    window.setInterval(updateUtc, 1000);
  }

  resizeCanvas();
  setInitialSequencePosition();
  updateStory();
  ensureSequenceAnimation();
  startSequence();
  initLandingInterface();
  window.addEventListener("resize", () => { resizeCanvas();queueStoryUpdate(); }, { passive:true });
  window.addEventListener("scroll", queueStoryUpdate, { passive:true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelDistantLoads(Math.round(currentFrame));
      while (cache.size > 2) {
        const oldest = cache.keys().next().value;
        const image = cache.get(oldest);
        cache.delete(oldest);
        if (image) image.src = "";
      }
    } else {
      requestFrame(Math.round(currentFrame), true);
      requestFrame(Math.round(currentFrame) + direction);
    }
  });
})();
