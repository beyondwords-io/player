// Returns Google Ad Tag params for the specified 'advertConsent' property.
// https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side/consent

const googleAdTagParams = (advertConsent, showingVideo) => {
  const params = {};

  // The player only supports linear adverts that interrupt content.
  // Adverts that are "non-linear" show over the top of content that is playing.
  params.vad_type = "linear";

  // Set the description_url to the current page's address.
  // https://support.google.com/admanager/answer/10678356?hl=en#description_url
  params.description_url = window.location.href;

  // Set the non-personalized advert flag which limits the ads that can play.
  // This will be set for 'non-personalized' and 'under-the-age-of-consent'.
  params.npa = advertConsent !== "personalized" ? 1 : 0;

  // Set the 'Tag For Users under the Age of Consent in Europe' flag.
  // In this case, npa=1 is implied but we set it explicitly above, anyway.
  params.tfua = advertConsent === "under-the-age-of-consent" ? 1 : 0;

  // If video is showing in either the inline player or the widget, request
  // video or audio adverts. Otherwise, only request audio adverts.
  params.ad_type = showingVideo ? "audio_video" : "audio";

  return params;
};

export default googleAdTagParams;
