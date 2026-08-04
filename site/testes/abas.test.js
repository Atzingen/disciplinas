import assert from "node:assert/strict";
import test from "node:test";

let tabs = {};

try {
  tabs = await import("../componentes/abas.js");
} catch {
  tabs = {};
}

const apiAvailable =
  typeof tabs.nextTabIndex === "function" &&
  typeof tabs.setupTabs === "function";

test("abas expõem navegação e montagem acessível", () => {
  assert.equal(typeof tabs.nextTabIndex, "function");
  assert.equal(typeof tabs.setupTabs, "function");
});

test("setas percorrem abas circularmente", { skip: !apiAvailable }, () => {
  assert.equal(tabs.nextTabIndex(0, "ArrowLeft", 4), 3);
  assert.equal(tabs.nextTabIndex(3, "ArrowRight", 4), 0);
  assert.equal(tabs.nextTabIndex(1, "ArrowRight", 4), 2);
});

test("Home e End alcançam os extremos", { skip: !apiAvailable }, () => {
  assert.equal(tabs.nextTabIndex(2, "Home", 4), 0);
  assert.equal(tabs.nextTabIndex(1, "End", 4), 3);
  assert.equal(tabs.nextTabIndex(1, "Enter", 4), null);
});
