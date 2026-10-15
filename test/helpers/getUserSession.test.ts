import getUserSession from "../../src/helpers/getUserSession";

describe("getUserSession", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("pairs the ghost session token with its provider", async () => {
    const fetchMock = vi.fn(async () => ({ status: 200, text: async () => "ghost_session_token" }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await getUserSession("ghost")).toEqual({ authProvider: "ghost", sessionToken: "ghost_session_token" });
    expect(fetchMock).toHaveBeenCalledWith("/members/api/session");
  });

  it("returns null when the ghost session cannot be read", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ status: 401, text: async () => "" })));
    expect(await getUserSession("ghost")).toBeNull();

    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    expect(await getUserSession("ghost")).toBeNull();
  });

  it("warns and returns null for an unknown provider", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(await getUserSession("substack")).toBeNull();
    expect(warn).toHaveBeenCalledWith("BeyondWords.Player: unknown auth provider: substack");
  });
});
