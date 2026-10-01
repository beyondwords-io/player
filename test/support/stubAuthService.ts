import type { Page } from "@playwright/test";

// Keep browser tests offline while exercising the real signed-URL/token flow.
// Return the request bodies so tests can also verify how sessions are created.
const stubAuthService = async (page: Page) => {
  const requests = [];

  await page.route("**/agent/session", async (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);

    const json = body.mode === "voice"
      ? { connection_type: "webrtc", conversation_token: "stub-token-voice", expires_at: 1790597571 }
      : { connection_type: "websocket", signed_url: "wss://stub.example/convai?mode=text", expires_at: 1790597571 };

    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(json) });
  });

  return requests;
};

export default stubAuthService;
