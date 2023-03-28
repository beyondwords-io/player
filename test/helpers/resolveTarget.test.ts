import resolveTarget from "../../src/helpers/resolveTarget";

describe("resolveTarget", () => {
  it("resolves to a new div and disables the UI when target is null", () => {
    const { newTarget, showUserInterface } = resolveTarget(null);

    expect(newTarget.nodeName.toLowerCase()).toEqual("div");
    expect(newTarget.parentNode).toEqual(document.body);

    expect(showUserInterface).toEqual(false);
  });

  it("resolves to a new div and disables the UI when target is false", () => {
    const { newTarget, showUserInterface } = resolveTarget(false);

    expect(newTarget.nodeName.toLowerCase()).toEqual("div");
    expect(newTarget.parentNode).toEqual(document.body);

    expect(showUserInterface).toEqual(false);
  });

  it("resolves to a new div and enables the UI when target is a script tag", () => {
    const scriptTag = document.createElement("script");
    document.body.appendChild(scriptTag);

    const { newTarget, showUserInterface } = resolveTarget(scriptTag);

    expect(newTarget.nodeName.toLowerCase()).toEqual("div");
    expect(newTarget).toEqual(scriptTag.nextSibling);

    expect(showUserInterface).toEqual(true);
  });

  it("resolves to an element and enables the UI when target is a query string", () => {
    const element = document.createElement("div");
    element.id = "something";
    document.body.appendChild(element);

    const { newTarget, showUserInterface } = resolveTarget("#something");

    expect(newTarget).toEqual(element);
    expect(showUserInterface).toEqual(true);
  });

  it("throws an error if the query string is for a node that doesn't exist", () => {
    expect(() => resolveTarget(".missing")).toThrowError(/target could not be found/);
  });

  it("throws an error if the query string is ambiguous", () => {
    const element1 = document.createElement("div");
    element1.id = "identical";
    document.body.appendChild(element1);

    const element2 = document.createElement("div");
    element2.id = "identical";
    document.body.appendChild(element2);

    expect(() => resolveTarget("#identical")).toThrowError(/2 elements match/);
  });

  it("resolves to the given element and enables the UI when target is a DOM node", () => {
    const element = document.createElement("div");
    document.body.appendChild(element);

    const { newTarget, showUserInterface } = resolveTarget(element);

    expect(newTarget).toEqual(element);
    expect(showUserInterface).toEqual(true);
  });
});
