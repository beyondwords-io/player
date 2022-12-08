import resolveTarget from "../../src/helpers/resolveTarget";

describe("resolveTarget", () => {
  it("resolves to document.body and disables the UI when target is null", () => {
    const { newTarget, showUserInterface } = resolveTarget(null);

    expect(newTarget).toEqual(document.body);
    expect(showUserInterface).toEqual(false);
  });

  it("resolves to document.body and disables the UI when target is false", () => {
    const { newTarget, showUserInterface } = resolveTarget(false);

    expect(newTarget).toEqual(document.body);
    expect(showUserInterface).toEqual(false);
  });

  it("resolves to a new div and enables the UI when target is a script tag", () => {
    const scriptTag = document.createElement("script");
    document.body.append(scriptTag);

    const { newTarget, showUserInterface } = resolveTarget(scriptTag);

    expect(newTarget.nodeName.toLowerCase()).toEqual("div");
    expect(newTarget).toEqual(scriptTag.nextSibling);

    expect(showUserInterface).toEqual(true);
  });

  it("resolves to an element and enables the UI when target is an id selector", () => {
    const element = document.createElement("div");
    element.id = "something";
    document.body.append(element);

    const { newTarget, showUserInterface } = resolveTarget("#something");

    expect(newTarget).toEqual(element);
    expect(showUserInterface).toEqual(true);
  });

  it("resolves to an element and enables the UI when target is a class selector", () => {
    const element = document.createElement("div");
    element.classList.add("something");
    document.body.append(element);

    const { newTarget, showUserInterface } = resolveTarget(".something");

    expect(newTarget).toEqual(element);
    expect(showUserInterface).toEqual(true);
  });

  it("resolves to the given element and enables the UI when target is a DOM node", () => {
    const element = document.createElement("div");
    document.body.append(element);

    const { newTarget, showUserInterface } = resolveTarget(element);

    expect(newTarget).toEqual(element);
    expect(showUserInterface).toEqual(true);
  });
});
