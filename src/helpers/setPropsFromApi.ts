import PlayerApiClient from "../api_clients/playerApiClient";
import snakeCaseKeys from "./snakeCaseKeys";

const setPropsFromApi = async (player) => {
  const client = new PlayerApiClient(player.playerApiUrl, player.projectId);
  if (!player.playerApiUrl || !player.projectId) { return; }

  const identifiers = identifiersArray(player);
  if (identifiers.length === 0) { return; }

  const data = await fetchData(client, identifiers);
  if (!data) { return; }

  console.log(data);
};

const identifiersArray = (player) => {
  const identifiers = [];

  if (player.contentId)  { identifiers.push({ content_id: player.contentId }); }
  if (player.playlistId) { identifiers.push({ playlist_id: player.playlistId }); }
  if (player.sourceId)   { identifiers.push({ source_id: player.sourceId }); }
  if (player.sourceUrl)  { identifiers.push({ source_url: player.sourceUrl }); }
  if (player.playlist)   { identifiers.push(...snakeCaseKeys(player.playlist)); }

  return [...new Set(identifiers.map(JSON.stringify))].map(JSON.parse);
};

const fetchData = (client, identifiers) => {
  const identifier = identifiers[0];

  if (identifiers.length > 1) { return client.byRequestBody(identifiers); }
  if (identifier.content_id)  { return client.byContentId(identifier.content_id); }
  if (identifier.playlist_id) { return client.byPlaylistId(identifier.playlist_id); }
  if (identifier.source_id)   { return client.bySourceId(identifier.source_id); }
  if (identifier.source_url)  { return client.bySourceUrl(identifier.source_url); }
};

export default setPropsFromApi;
export { identifiersArray, fetchData };
