import throwError from "../helpers/throwError";

const fetchJson = async (url, fetchOptions = {}) => {
  const response = await fetch(url, fetchOptions).catch(() => {});
  const json = await response?.json().catch(() => {});

  if (response?.status !== 200) {
    throwError(`Failed to fetch ${url}`, {
      ...fetchOptions,
      responseStatus: response?.status,
      responseJson: json,
    });
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
export { postJson };
