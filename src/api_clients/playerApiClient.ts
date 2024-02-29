import fetchJson from "../helpers/fetchJson";

class PlayerApiClient {
  constructor(playerApiUrl, projectId, clientSideEnabled, previewToken) {
    this.baseUrl = playerApiUrl?.replace("{id}", projectId);
    this.search = new URLSearchParams();

    // TODO: Find a way to pass this information to the backend while complying
    // with CORS "simply request" requirements so that OPTIONS aren't sent.
    if (clientSideEnabled) {
      this.headers = {
        "X-Referer": window.location.href,
        "X-Import": !!clientSideEnabled,
      };
    }

    if (previewToken) {
      this.search.set("preview_token", previewToken);
    }
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
    return this.#fetchJson(`by_source_url/${encodeURIComponent(url)}`);
  }

  byIdentifiers(array) {
    return this.#fetchJson(`by_identifiers/${encodeURIComponent(JSON.stringify(array))}`);
  }

  #fetchJson(path) {
    return fetchJson(`${this.baseUrl}/${path}${this.#searchQuery()}`, { headers: this.headers });
  }

  #searchQuery() {
    return this.search.size ? `?${this.search}` : "";
  }
}

export default PlayerApiClient;
