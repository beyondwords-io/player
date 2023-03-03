import fetchJson, { postJson } from "../helpers/fetchJson";

class PlayerApiClient {
  constructor(playerApiUrl, projectId) {
    this.baseUrl = `${playerApiUrl}/projects/${projectId}/player`;
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

  byRequestBody(identifiers) {
    return postJson(`${this.baseUrl}/by_request_body`, identifiers);
  }
}

export default PlayerApiClient;
