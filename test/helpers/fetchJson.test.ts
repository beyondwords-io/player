import fetchJson, { postJson } from "../../src/helpers/fetchJson";

describe("fetchJson", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("returns the parsed response", async () => {
    fetchMock.mockResolvedValue({ status: 200, json: async () => ({ ready: true }) });
    await expect(fetchJson("https://example.com/data")).resolves.toEqual({ ready: true });
  });

  it("reports network failures without dereferencing a missing response", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network unavailable"));
    await expect(fetchJson("https://example.com/data")).rejects.toThrow("Failed to fetch https://example.com/data");
  });

  it("preserves the auth request body and HTTP error context", async () => {
    fetchMock.mockResolvedValue({ status: 403, json: async () => ({ error: "Forbidden" }) });
    await expect(postJson("https://example.com/agent/session", { project_id: undefined, mode: "text" }))
      .rejects.toThrow("responseStatus: 403");
    expect(fetchMock).toHaveBeenCalledWith("https://example.com/agent/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: null, mode: "text" }),
    });
  });
});
