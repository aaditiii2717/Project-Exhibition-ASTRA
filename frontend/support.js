(() => {
  "use strict";

  const EXACT_BINDING = /^\s*{{\s*([\s\S]+?)\s*}}\s*$/;
  const INLINE_BINDING = /{{\s*([\s\S]+?)\s*}}/g;

  class DCLogic {
    setState(update) {
      const patch = typeof update === "function" ? update(this.state) : update;
      if (!patch || typeof patch !== "object") return;
      this.state = { ...this.state, ...patch };
      this.__render?.();
      this.componentDidUpdate?.();
    }
  }

  function evaluate(expression, scope) {
    const keys = Object.keys(scope);
    const values = Object.values(scope);
    try {
      return Function(...keys, `"use strict"; return (${expression});`)(...values);
    } catch (error) {
      console.error(`[ASTRA UI] Could not evaluate: ${expression}`, error);
      return undefined;
    }
  }

  function resolve(raw, scope) {
    const exact = String(raw).match(EXACT_BINDING);
    if (exact) return evaluate(exact[1], scope);
    return String(raw).replace(INLINE_BINDING, (_, expression) => {
      const value = evaluate(expression, scope);
      return value == null ? "" : String(value);
    });
  }

  function renderNode(source, scope, stableNodes) {
    if (source.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(resolve(source.nodeValue || "", scope));
    }

    if (source.nodeType !== Node.ELEMENT_NODE) return source.cloneNode(false);

    const tag = source.tagName.toLowerCase();
    if (tag === "sc-if") {
      const fragment = document.createDocumentFragment();
      if (resolve(source.getAttribute("value") || "", scope)) {
        source.childNodes.forEach((child) => fragment.appendChild(renderNode(child, scope, stableNodes)));
      }
      return fragment;
    }

    if (tag === "sc-for") {
      const fragment = document.createDocumentFragment();
      const list = resolve(source.getAttribute("list") || "", scope);
      const alias = source.getAttribute("as") || "item";
      if (Array.isArray(list)) {
        list.forEach((item, index) => {
          const childScope = { ...scope, [alias]: item, [`${alias}Index`]: index };
          source.childNodes.forEach((child) => fragment.appendChild(renderNode(child, childScope, stableNodes)));
        });
      }
      return fragment;
    }

    const stableKey = source.getAttribute("data-dc-stable");
    if (stableKey && stableNodes && stableNodes.has(stableKey)) {
      return stableNodes.get(stableKey);
    }

    const element = source.namespaceURI === "http://www.w3.org/2000/svg"
      ? document.createElementNS("http://www.w3.org/2000/svg", source.tagName)
      : document.createElement(source.tagName);
    let deferredValue;

    [...source.attributes].forEach((attribute) => {
      const name = attribute.name;
      if (name.startsWith("hint-") || name === "data-dc-stable") return;

      const value = resolve(attribute.value, scope);
      if (name.toLowerCase().startsWith("on") && typeof value === "function") {
        element.addEventListener(name.slice(2).toLowerCase(), value);
        return;
      }

      if (name === "value" && ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName)) {
        deferredValue = value == null ? "" : value;
      }

      if (value === false || value == null) return;
      element.setAttribute(name, value === true ? "" : String(value));
    });

    source.childNodes.forEach((child) => element.appendChild(renderNode(child, scope, stableNodes)));
    if (deferredValue !== undefined) element.value = deferredValue;
    if (stableKey && stableNodes) stableNodes.set(stableKey, element);
    return element;
  }

  function start() {
    const root = document.querySelector("x-dc");
    const logicScript = document.querySelector("script[data-dc-script]");
    if (!root || !logicScript) return;

    const template = document.createElement("template");
    template.innerHTML = root.innerHTML;

    let Component;
    try {
      Component = Function("DCLogic", `${logicScript.textContent}\nreturn Component;`)(DCLogic);
    } catch (error) {
      console.error("[ASTRA UI] Component initialization failed", error);
      return;
    }

    const instance = new Component();
    const stableNodes = new Map();
    let rendering = false;
    instance.__render = () => {
      if (rendering) return;
      rendering = true;
      const active = document.activeElement;
      const isFocusedFormEl = active && root.contains(active) &&
        (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
      const selStart = isFocusedFormEl && "selectionStart" in active ? active.selectionStart : null;
      const selEnd = isFocusedFormEl && "selectionStart" in active ? active.selectionEnd : null;

      // replaceChildren below swaps in freshly-created DOM nodes, which resets
      // scrollTop on any scrollable container (e.g. main, the incident feed,
      // the ledger). Snapshot scroll offsets by position among matches so an
      // ambient re-render (playback tick, clock, etc.) doesn't yank the view.
      const scrollTargets = [...root.querySelectorAll("[data-dc-preserve-scroll]")];
      const scrollOffsets = scrollTargets.map((el) => el.scrollTop);

      const scope = instance.renderVals();
      const fragment = document.createDocumentFragment();
      template.content.childNodes.forEach((node) => fragment.appendChild(renderNode(node, scope, stableNodes)));
      root.replaceChildren(fragment);

      // Stable nodes (data-dc-stable) are the same DOM object across renders, but
      // moving them through a detached DocumentFragment blurs them - restore focus
      // (and cursor position) so typing isn't interrupted by ambient re-renders
      // like the 1s clock tick.
      if (isFocusedFormEl && document.body.contains(active)) {
        active.focus();
        if (selStart != null && typeof active.setSelectionRange === "function") {
          try { active.setSelectionRange(selStart, selEnd); } catch (_) { /* not applicable to this input type */ }
        }
      }

      root.querySelectorAll("[data-dc-preserve-scroll]").forEach((el, index) => {
        if (scrollOffsets[index]) el.scrollTop = scrollOffsets[index];
      });

      rendering = false;
    };

    instance.__render();
    instance.componentDidMount?.();
    window.addEventListener("beforeunload", () => instance.componentWillUnmount?.(), { once: true });
    window.__astraMissionControl = instance;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
