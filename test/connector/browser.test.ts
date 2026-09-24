import { Connector } from "../../src/connector";

describe("connector public entry points", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("exposes the widget lifecycle through the constructor", () => {
    const target = document.createElement("div");
    const connector = new Connector({ target, connectUrl: "https://example.com/setup", theme: "light" });
    const link = connector.element.shadowRoot!.querySelector("a")!;
    expect(target.contains(connector.element)).toBe(true);
    expect(link.textContent).toBe("Add to AI assistant");
    connector.update({ label: "Add our reporting", theme: "dark" });
    expect(link.textContent).toBe("Add our reporting");
    expect(link.dataset.theme).toBe("dark");
    connector.destroy();
    expect(target.children.length).toBe(0);
  });

  it("does not register globals when importing the module entry", async () => {
    vi.stubGlobal("BeyondWords", undefined);
    vi.resetModules();
    const api = await import("../../src/connector");
    expect(typeof api.Connector).toBe("function");
    expect(typeof api.createConnectorWidget).toBe("function");
    expect(Reflect.get(window, "BeyondWords")).toBeUndefined();
  });

  it("registers the script API without replacing the player or other namespace values", async () => {
    const player = vi.fn();
    const namespace = { Player: player, publisherSetting: true };
    vi.stubGlobal("BeyondWords", namespace);
    vi.resetModules();
    await import("../../src/connector/browser");
    expect(Reflect.get(window, "BeyondWords")).toBe(namespace);
    expect(namespace.Player).toBe(player);
    expect(namespace.publisherSetting).toBe(true);
    expect(typeof Reflect.get(namespace, "Connector")).toBe("function");
  });

  it("does not replace a constructor already registered by an earlier script", async () => {
    const original = vi.fn();
    vi.stubGlobal("BeyondWords", { Connector: original });
    vi.resetModules();
    await import("../../src/connector/browser");
    expect(Reflect.get(window, "BeyondWords").Connector).toBe(original);
  });
});
