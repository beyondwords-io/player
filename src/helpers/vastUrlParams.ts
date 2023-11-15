const vastUrlParams = (vastUrl, advertConsent, showingVideo) => {
  if (isGoogleAdManager(vastUrl)) { return googleAdManagerParams(advertConsent, showingVideo); }
  if (isDigitalAdExchange(vastUrl)) { return digitalAdExchangeParams(advertConsent, showingVideo); }

  return {};
};

const isGoogleAdManager = (vastUrl) => vastUrl?.includes("pubads.g.doubleclick.net");
const isDigitalAdExchange = (vastUrl) => vastUrl?.includes("geo.ads.audio.thisisdax.com");

const googleAdManagerParams = (advertConsent, showingVideo) => {
  const isLocahost = window.location.hostname === "localhost";
  const params = {};

  // The player only supports linear adverts that interrupt content.
  // Adverts that are "non-linear" show over the top of content that is playing.
  params.vad_type = "linear";

  // Set the non-personalized advert flag which limits the ads that can play.
  // This will be set for 'non-personalized' and 'under-the-age-of-consent'.
  // https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side/consent
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

const digitalAdExchangeParams = (advertConsent, showingVideo) => {
  const params = {};

  // TODO: cid

  // Set the listener ID from the window global that is set by SetDaxListenerId
  // in Player.svelte. This won't be present if personalized ads are disabled.
  if (window.daxListenerId) { params.dax_listenerid = window.daxListenerId; }

  // TODO: gdpr_consent
  // TODO: gdpr
  // TODO: att
  // TODO: idfv
  // TODO: nlsid
  // TODO: u
  // TODO: dur_min
  // TODO: dur_max
  // TODO: adc_min
  // TODO: adc_max
  // TODO: sd
  // TODO: midroll
  // TODO: delivery_type
  // TODO: feed_type
  // TODO: bi
  // TODO: lat
  // TODO: long
  // TODO: bcat
  // TODO: cat
  // TODO: badv
  // TODO: ip
  // TODO: ua
  // TODO: referrer
  // TODO: language
  // TODO: content_language
  // TODO: collectionid
  // TODO: showid
  // TODO: episodeid
  // TODO: category
  // TODO: genre
  // TODO: bundles
  // TODO: explicit
  // TODO: dax_player
  // TODO: dax_version
  // TODO: dax_platform
  // TODO: cast_platform
  // TODO: age
  // TODO: gender
  // TODO: audience
  // TODO: isLoggedIn
  // TODO: gps_accuracy
  // TODO: gps_alt
  // TODO: gps_epoch
  // TODO: gps_placemarks_geocode
  // TODO: gps_provider
  // TODO: gps_speed
  // TODO: wifi
  // TODO: is_comp_allowed
  // TODO: comp_size

  return params;
};

export default vastUrlParams;
export { isDigitalAdExchange };
