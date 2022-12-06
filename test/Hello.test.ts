// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import Hello from "../src/Hello.svelte";

describe("Hello", () => {
  it("works", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    new Hello({ target: div });
    expect(div.innerHTML).toContain("Hello, World!");
  });
});
