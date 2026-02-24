import resolveTarget from "../../src/helpers/resolveTarget";

describe("resolveTarget", () => {
  let rootElement = null;

  beforeEach(() => {
    rootElement = document.createElement("div");
    document.body.appendChild(rootElement);
  });

  afterEach(() => {
    document.body.className = "";
    document.body.removeChild(rootElement);
    rootElement = null;
  });

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

  it("resolves to a .beyondwords-target element and enables the UI when initialized on a Ghost post and target is null", () => {
    const element = document.createElement("div");
    element.className = "beyondwords-target";
    rootElement.appendChild(element);

    const { newTarget, showUserInterface } = resolveTarget(null, { ghost: true });

    expect(newTarget).toEqual(element);
    expect(showUserInterface).toEqual(true);
  });

  it("throws an error when initialized on a non-Ghost post or page and target is null", () => {
    expect(() => resolveTarget(null, { ghost: true })).toThrowError(/Player is only available on Ghost Posts and Pages./);
  });

  it("resolves to a .post-full-content element and enables the UI when initialized on a Ghost post and target is null", () => {
    document.body.className = "post-template";
    const element = document.createElement("div");
    element.className = "post-full-content";
    rootElement.appendChild(element);

    const { newTarget, showUserInterface } = resolveTarget(null, { ghost: true });

    expect(newTarget).toEqual(element);
    expect(showUserInterface).toEqual(true);
  });

  it("resolves to a header element and enables the UI when initialized on a Ghost post and target is null", () => {    
    document.body.className = "post-template";
    const article = document.createElement("article");
    const header = document.createElement("header");
    article.appendChild(header);
    rootElement.appendChild(article);

    const { newTarget, showUserInterface } = resolveTarget(null, { ghost: true });

    expect(newTarget).toEqual(header);
    expect(showUserInterface).toEqual(true);
  });

  it("resolves to an article element and enables the UI when initialized on a Ghost post and target is null", () => {
    document.body.className = "post-template";
    const article = document.createElement("article");
    rootElement.appendChild(article);

    const { newTarget, showUserInterface } = resolveTarget(null, { ghost: true });

    expect(newTarget).toEqual(article);
    expect(showUserInterface).toEqual(true);
  });

  it("resolves to a .content element and enables the UI when initialized on a Ghost post and target is null", () => {
    document.body.className = "post-template";
    const content = document.createElement("div");
    content.className = "content";
    rootElement.appendChild(content);

    const { newTarget, showUserInterface } = resolveTarget(null, { ghost: true });

    expect(newTarget).toEqual(content);
    expect(showUserInterface).toEqual(true);
  });
});
