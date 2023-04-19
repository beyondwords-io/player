// Returns Google Ad Tag params for the specified 'advertConsent' property.
// https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side/consent

const googleAdTagParams = (advertConsent, showingVideo) => {
  const isLocahost = window.location.hostname === "localhost";
  const params = {};

  // The player only supports linear adverts that interrupt content.
  // Adverts that are "non-linear" show over the top of content that is playing.
  params.vad_type = "linear";

  // Set the non-personalized advert flag which limits the ads that can play.
  // This will be set for 'non-personalized' and 'under-the-age-of-consent'.
  params.npa = advertConsent !== "personalized" ? 1 : 0;

  // Set the 'Tag For Users under the Age of Consent in Europe' flag.
  // In this case, npa=1 is implied but we set it explicitly above, anyway.
  params.tfua = advertConsent === "under-the-age-of-consent" ? 1 : 0;

  // If video is showing in either the inline player or the widget, request
  // video or audio adverts. Otherwise, only request audio adverts.
  params.ad_type = showingVideo ? "audio_video" : "audio";

  // On localhost, the Google IMA SDK does not set the url parameter when it
  // requests adverts which can result in no adverts being returned. Therefore,
  // use the url query parameter from the VAST URL if it is available, otherwise
  // fall back to a URL that is known to work, i.e. for testing VAST tags.
  if (isLocahost) { params.url ||= "https://googleads.github.io"; }

  // On localhost, fall back to a URL that is known to work for description_url.
  // Usually, this will already be provided as a query param in the VAST tag.
  if (isLocahost) { params.description_url ||= "https://googleads.github.io"; }

  // Otherwise, always set the description_url to the current page's address. Do not
  // fall back since we don't want to incorrectly report where ads are served from.
  // https://support.google.com/admanager/answer/10678356?hl=en#description_url
  if (!isLocahost) { params.description_url = window.location.href; }

  return params;
};

export default googleAdTagParams;
