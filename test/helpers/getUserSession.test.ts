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

  describe("piano", () => {
    const initPiano = (tp) => {
      (window as { tp?: unknown }).tp = { ...tp, push: ([command, callback]) => command === "init" && callback() };
    };
    const user = (loggedIn, token) => ({ isUserValid: () => loggedIn, getToken: () => token });
    const piano = (sessionToken) => ({ authProvider: "piano", sessionToken });

    afterEach(() => delete (window as { tp?: unknown }).tp);

    it("sends the refreshed __tac cookie as is", async () => {
      let tac = "stale";
      initPiano({
        pianoId: user(true, "id-token"),
        user: { refreshAccessToken: (_, callback) => { tac = "fresh"; callback(); } },
        util: { getTacCookie: () => tac },
      });

      expect(await getUserSession("piano")).toEqual(piano("fresh"));
    });

    it("falls back to the logged-in SDK's token, prefixed with its user provider", async () => {
      const refresh = { refreshAccessToken: (_, callback) => callback() };
      const noTac = { getTacCookie: () => undefined };

      initPiano({ pianoId: user(true, "id-token"), user: refresh, util: noTac });
      expect(await getUserSession("piano")).toEqual(piano("piano_id:id-token"));

      initPiano({ pianoId: user(false, null), pianoIdLite: user(true, "lite-token"), user: refresh, util: noTac });
      expect(await getUserSession("piano")).toEqual(piano("piano_id_lite:lite-token"));
    });

    it("returns null when no Piano user is logged in", async () => {
      initPiano({ pianoId: user(false, null) });

      expect(await getUserSession("piano")).toBeNull();
    });

    it("returns null when Piano never initialises", async () => {
      vi.useFakeTimers();
      const session = getUserSession("piano");
      vi.advanceTimersByTime(3000);

      expect(await session).toBeNull();
      vi.useRealTimers();
    });
  });
});
