import { formatErrorMessage } from "./throwError";

// A typed error for failed requests, so catch sites can classify by HTTP
// status instead of parsing the message. The message keeps the exact shape
// throwError produced, and the legacy responseStatus/responseJson fields stay
// for callers (and tests) that still read them.
class HttpError extends Error {
  status: number | undefined; // undefined = the request itself failed (network)
  json: unknown;
  responseStatus: number | undefined; // legacy aliases - existing message/test shape kept
  responseJson: unknown;

  constructor(url: string, fetchOptions: Record<string, unknown>, status: number | undefined, json: unknown) {
    super(formatErrorMessage(`Failed to fetch ${url}`, {
      ...fetchOptions,
      responseStatus: status,
      responseJson: json,
    }));
    this.name = "HttpError";
    this.status = status;
    this.json = json;
    this.responseStatus = status;
    this.responseJson = json;
  }
}

const fetchJson = async (url, fetchOptions = {}) => {
  const response = await fetch(url, fetchOptions).catch(() => undefined);
  const json = await response?.json().catch(() => {});

  if (response?.status !== 200) {
    throw new HttpError(url, fetchOptions, response?.status, json);
  }

  return json;
};

const postJson = (url, data) => (
  fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data, (_, v) => v === undefined ? null : v),
  })
);

export default fetchJson;
export { postJson, HttpError };
