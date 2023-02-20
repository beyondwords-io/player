import throwError from "../helpers/throwError";

class PlayerApiClient {
  constructor(playerApiUrl, projectId) {
    this.baseUrl = `${playerApiUrl}/projects/${projectId}/player`;
  }

  byContentId(id) {
    return this.#fetchJson(`by_content_id/${id}`);
  }

  byPlaylistId(id) {
    return this.#fetchJson(`by_playlist_id/${id}`);
  }

  bySourceId(id) {
    return this.#fetchJson(`by_source_id/${id}`);
  }

  bySourceUrl(url) {
    return this.#fetchJson(`by_source_url/${url}`);
  }

  byRequestBody(identifiers) {
    return this.#postJson("by_request_body", identifiers);
  }

  async #fetchJson(path, fetchOptions = {}) {
    const url = `${this.baseUrl}/${path}`;
    const response = await fetch(url, fetchOptions).catch(() => {});
    const json = await response?.json().catch(() => {});

    if (response?.status !== 200) {
      throwError(`Failed to fetch ${url}`, { ...fetchOptions, responseStatus: response?.status, responseJson: json });
    }

    return json;
  }

  async #postJson(path, data) {
    this.#fetchJson(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  }
}

export default PlayerApiClient;
