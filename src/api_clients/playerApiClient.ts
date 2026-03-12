import fetchJson from "../helpers/fetchJson";

class PlayerApiClient {
  constructor({
    playerApiUrl,
    projectId,
    summary,
    video,
    clientSideEnabled,
    previewToken,
    wordHighlightsEnabled,
  }: {
    playerApiUrl: string;
    projectId: string;
    summary?: boolean;
    video?: boolean;
    clientSideEnabled?: boolean;
    previewToken?: string;
    wordHighlightsEnabled?: boolean;
  }) {
    this.baseUrl = playerApiUrl?.replace("{id}", projectId);
    this.summary = summary;
    this.video = video;
    this.params = new URLSearchParams() ;

    // TODO: Find a way to pass this information to the backend while complying
    // with CORS "simple request" requirements so that OPTIONS aren't sent.
    if (clientSideEnabled) {
      this.headers = {
        "X-Referer": window.location.href,
        "X-Import": !!clientSideEnabled,
      };
    }

    if (previewToken) {
      this.params.set("preview_token", previewToken);
    }

    if (wordHighlightsEnabled) {
      this.params.set("words", "true");
    }
  }

  byContentId(id) {
    return this.#fetchJson(`by_content_id/${id}`, this.#paramsWithVideo(this.#paramsWithSummary()));
  }

  byPlaylistId(id) {
    return this.#fetchJson(`by_playlist_id/${id}`, this.#paramsWithSummary());
  }

  bySourceId(id) {
    return this.#fetchJson(`by_source_id/${id}`, this.#paramsWithVideo(this.#paramsWithSummary()));
  }

  bySourceUrl(url) {
    return this.#fetchJson(`by_source_url/${encodeURIComponent(url)}`, this.#paramsWithVideo(this.#paramsWithSummary()));
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

  #paramsWithSummary(params = this.params) {
    if (this.summary) {
      return new URLSearchParams([
        ...Array.from(params.entries()),
        ["summary", true],
      ]);
    } else {
      return params;
    }
  }

  #paramsWithVideo(params = this.params) {
    if (this.video) {
      return new URLSearchParams([
        ...Array.from(params.entries()),
        ["media_format", "video"],
      ]);
    } else {
      return params;
    }
  }
}

export default PlayerApiClient;
