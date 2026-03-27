import fetchJson from "../helpers/fetchJson";

class PlayerApiClient {
  constructor({
    playerApiUrl,
    projectId,
    summary,
    mediaFormat,
    videoSize,
    initialContentId,
    initialSourceId,
    initialSourceUrl,
    clientSideEnabled,
    previewToken,
    continuousPlaybackMode,
    wordHighlightsEnabled,
  }: {
    playerApiUrl: string;
    projectId: string;
    summary?: boolean;
    mediaFormat?: string;
    videoSize?: string;
    initialContentId?: string,
    initialSourceId?: string,
    initialSourceUrl?: string,
    clientSideEnabled?: boolean;
    previewToken?: string;
    continuousPlaybackMode?: string;
    wordHighlightsEnabled?: boolean;
  }) {
    this.baseUrl = playerApiUrl?.replace("{id}", projectId);
    this.summary = summary;
    this.mediaFormat = mediaFormat;
    this.videoSize = videoSize;
    this.initialContentId = initialContentId;
    this.initialSourceId = initialSourceId;
    this.initialSourceUrl = initialSourceUrl;
    this.continuousPlaybackMode = continuousPlaybackMode;
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
    return this.#fetchJson(`by_content_id/${id}`, this.#paramsWithContinuousPlayback());
  }

  byPlaylistId(id) {
    return this.#fetchJson(`by_playlist_id/${id}`, this.#paramsWithSummary());
  }

  bySourceId(id) {
    return this.#fetchJson(`by_source_id/${id}`, this.#paramsWithContinuousPlayback());
  }

  bySourceUrl(url) {
    return this.#fetchJson(`by_source_url/${encodeURIComponent(url)}`, this.#paramsWithContinuousPlayback());
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

  #paramsWithContinuousPlayback(params = this.params) {
    if (this.continuousPlaybackMode === "none") return params;
    return new URLSearchParams([
      ...Array.from(params.entries()),
      ...(this.mediaFormat ? [["media_format", this.mediaFormat]] : []),
      ...(this.videoSize ? [["video_size", this.videoSize]] : []),
      ...(this.summary ? [["summary", true]] : []),
      ...(this.initialContentId ? [["initial_content_id", this.initialContentId]] : []),
      ...(this.initialSourceId ? [["initial_source_id", this.initialSourceId]] : []),
      ...(this.initialSourceUrl ? [["initial_source_url", this.initialSourceUrl]] : []),
    ]);
  }
}

export default PlayerApiClient;
