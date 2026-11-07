// Behaviour registry. An element opts in with data-ui="name [name...]".
// Instances live in a WeakMap, so init is idempotent and nothing leaks.
const registry = new Map();
const instances = new WeakMap();
let started = false;

const namesOf = (el) => (el.getAttribute('data-ui') ?? '').split(/\s+/).filter(Boolean);

function elementsIn(root) {
  const found = root.querySelectorAll ? [...root.querySelectorAll('[data-ui]')] : [];
  if (root.nodeType === 1 && root.hasAttribute('data-ui')) found.unshift(root);
  return found;
}

export function register(name, factory) {
  registry.set(name, factory);
  if (started) init(document);
}

export function init(root = document) {
  for (const el of elementsIn(root)) {
    for (const name of namesOf(el)) {
      const factory = registry.get(name);
      if (!factory || instances.get(el)?.has(name)) continue;
      let instance;
      try {
        instance = factory(el) ?? {};
      } catch (error) {
        // Isolate the failure: report it, keep going. No instance is recorded, so a later init may retry.
        emit(el, 'runtime', 'error', { name, error });
        queueMicrotask(() => { throw error; });
        continue;
      }
      if (!instances.has(el)) instances.set(el, new Map());
      instances.get(el).set(name, instance);
    }
  }
}

export function destroy(root = document) {
  for (const el of elementsIn(root)) {
    const map = instances.get(el);
    if (!map) continue;
    for (const instance of map.values()) instance.destroy?.();
    instances.delete(el);
  }
}

export function get(el, name) {
  const map = instances.get(el);
  if (!map) return undefined;
  return name ? map.get(name) : map.values().next().value;
}

export function emit(el, component, event, detail) {
  return el.dispatchEvent(new CustomEvent(`ui:${component}:${event}`, { bubbles: true, cancelable: true, detail }));
}

export function start(doc) {
  if (started) return;
  started = true;
  const run = () => {
    // Install the observer first so a failing first pass can never leave later markup uninitialised.
    new MutationObserver((records) => {
      for (const record of records) {
        // A moved node is removed and re-added; it is still connected, so skip it.
        for (const node of record.removedNodes) if (node.nodeType === 1 && !node.isConnected) destroy(node);
        for (const node of record.addedNodes) if (node.nodeType === 1 && node.isConnected) init(node);
      }
    }).observe(doc.documentElement, { childList: true, subtree: true });
    init(doc);
  };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
}
