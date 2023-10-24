import fetchJson from "../helpers/fetchJson";

class PlayerApiClient {
  constructor(playerApiUrl, projectId, clientSideIntegration) {
    this.baseUrl = playerApiUrl?.replace("{id}", projectId);

    this.headers = {
      "X-Referer": window.location.href,
      "X-Import": clientSideIntegration?.enabled,
      "X-Author": clientSideIntegration?.contentAuthor,
      "X-Title": clientSideIntegration?.contentTitle,
      "X-Publish-Date": clientSideIntegration?.publishDate,
      "X-Published": clientSideIntegration?.published,
      "X-Ads-Enabled": clientSideIntegration?.adsEnabled,
    };
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

  byIdentifiers(array) {
    return this.#fetchJson(`by_identifiers/${encodeURIComponent(JSON.stringify(array))}`);
  }

  #fetchJson(path) {
    return fetchJson(`${this.baseUrl}/${path}`, { headers: this.headers });
  }
}

export default PlayerApiClient;
