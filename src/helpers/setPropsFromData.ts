import camelCaseKeys from "../../src/helpers/camelCaseKeys";

const setPropsFromData = (player, data) => {
  data = camelCaseKeys(data);

  setPropsFromContent(player, data.content);
  setPropsFromPlaylist(player, data.playlist);
  setPropsFromSettings(player, data.settings);
  setPropsFromAds(player, data.ads);
};

const setPropsFromContent = (player, content) => {
  player.content = content.map((item) => ({
    title: item.title,
    image: item.imageUrl,
    externalUrl: item.sourceUrl,
    duration: item.audio[0] ? item.audio[0].duration / 1000 : 0,
    media: [...item.video, ...item.audio].map((media) => ({
      url: media.url,
      contentType: media.contentType,
    })),
  }));

  // TODO: segments + skip behaviour
};

const setPropsFromPlaylist = (player, playlist) => {
  playlist = playlist || {};

  player.playerTitle = playlist.title;
  // TODO: project title
  // TODO: playlist image
};

const setPropsFromSettings = (player, settings) => {

};

const setPropsFromAds = (player, ads) => {

};

export default setPropsFromData;
