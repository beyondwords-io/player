import fetchJson from "../helpers/fetchJson";

class PlayerApiClient {
  constructor(playerApiUrl, projectId, summary, clientSideEnabled, previewToken) {
    this.baseUrl = playerApiUrl?.replace("{id}", projectId);
    this.summary = summary;
    this.params = new URLSearchParams() ;

    // TODO: Find a way to pass this information to the backend while complying
    // with CORS "simply request" requirements so that OPTIONS aren't sent.
    if (clientSideEnabled) {
      this.headers = {
        "X-Referer": window.location.href,
        "X-Import": !!clientSideEnabled,
      };
    }

    if (previewToken) {
      this.params.set("preview_token", previewToken);
    }
  }

  byContentId(id) {
    return this.#fetchJson(`by_content_id/${id}`);
  }

  byPlaylistId(id) {
    return this.#fetchJson(`by_playlist_id/${id}`, this.#paramsWithSummary());
  }

  bySourceId(id) {
    return this.#fetchJson(`by_source_id/${id}`);
  }

  bySourceUrl(url) {
    return this.#fetchJson(`by_source_url/${encodeURIComponent(url)}`);
  }

  byIdentifiers(array) {
    return this.#fetchJson(`by_identifiers/${encodeURIComponent(JSON.stringify(array))}`, this.#paramsWithSummary());
  }

  #fetchJson(path, params = this.params) {
    return fetchJson(`${this.baseUrl}/${path}${this.#queryString(params)}`, { headers: this.headers });
  }

  #queryString(params) {
    return params.size ? `?${params}` : "";
  }

  #paramsWithSummary() {
    if (this.summary) {
      return new URLSearchParams({ ...this.params, summary: true });
    } else {
      return this.params;
    }
  }
}

export default PlayerApiClient;
