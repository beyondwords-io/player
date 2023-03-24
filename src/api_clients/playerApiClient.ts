import fetchJson from "../helpers/fetchJson";

class PlayerApiClient {
  constructor(playerApiUrl, projectId) {
    this.baseUrl = playerApiUrl?.replace("{id}", projectId);
  }

  byContentId(id) {
    return fetchJson(`${this.baseUrl}/by_content_id/${id}`);
  }

  byPlaylistId(id) {
    return fetchJson(`${this.baseUrl}/by_playlist_id/${id}`);
  }

  bySourceId(id) {
    return fetchJson(`${this.baseUrl}/by_source_id/${id}`);
  }

  bySourceUrl(url) {
    return fetchJson(`${this.baseUrl}/by_source_url/${url}`);
  }

  byIdentifiers(array) {
    return fetchJson(`${this.baseUrl}/by_identifiers/${encodeURIComponent(JSON.stringify(array))}`);
  }
}

export default PlayerApiClient;
