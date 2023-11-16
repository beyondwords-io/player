import { version } from "../../package.json";
import daisybitStrings from "./daisybitStrings";

const vastUrlParams = (vastUrl, placement, advertConsent, showingVideo) => {
  if (isGoogleAdManager(vastUrl)) { return googleAdManagerParams(advertConsent, showingVideo); }
  if (isDigitalAdExchange(vastUrl)) { return digitalAdExchangeParams(vastUrl, placement, advertConsent); }

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

const digitalAdExchangeParams = (vastUrl, placement, advertConsent) => {
  const params = {};

  // The 'cid' parameter is already included in the URL by the API. It is
  // publisher specific and is used to attribute advert revenue accordingly.
  if (!vastUrl?.includes("cid=")) {
    console.warn("BeyondWords.Player: The DAX VAST URL does not contain the 'cid' parameter.");
  }

  // Set the listener ID from the window global that is set by SetDaxListenerId
  // in Player.svelte. This won't be present if personalized ads are disabled.
  if (window.daxListenerId) { params.dax_listenerid = window.daxListenerId; }

  // Set the 'gdpr_consent' parameter based on whether the player is allowed
  // to request personalized ads. These follow the 'IAB TCF daisybit' standard
  // and encode data about which purposes are allowed and which vendors are
  // allowed. See src/helpers/writeDaisybitStrings.ts for more information.
  if (advertConsent === "personalized") {
    params.gdpr_consent = daisybitStrings.personalizedDaisybit;
  } else {
    params.gdpr_consent = daisybitStrings.nonPersonalizedDaisybit;
  }

  // The 'gdpr' parameter is intentionally left undefined. DAX will infer
  // whether GDPR rules apply based on the region of the VAST request IP.

  // TODO: att
  // TODO: idfv

  // The 'nlsid' parameter is intentionally left blank. We don't have a Nielsen
  // DMP user account so this parameter is irrelevant.

  // TODO: u
  // TODO: dur_min
  // TODO: dur_max

  // Request exactly one audio creative advert. Our audio content is relatively
  // short so we don't want to play more than one advert in series.
  params.adc_min = 1;
  params.adc_max = 1;

  // Inform DAX where the advert is being played relative to the content.
  if (placement === "pre-roll") {
    params.sd = 0;
  } else if (placement === "mid-roll") {
    params.sd = -1;
  } else if (placement === "post-roll") {
    params.sd = -2;
  }

  // The 'midroll' parameter is intentionally left undefined. We don't play
  // multiple midroll ads during one content item so it is better not to provide
  // an index since this might suggest we intend to play multiple midroll ads.

  // Method content is being consumed, either 'download' or 'streaming'. In our
  // case, we set streaming because 99% of users will receive HLS chunks.
  params.delivery_type = "streaming";

  // The 'feed_type' parameter is intentionally left undefined. Default: Podcast

  // TODO: bi
  // TODO: lat
  // TODO: long
  // TODO: bcat
  // TODO: cat
  // TODO: badv

  // The 'ip' parameter is intentionally left undefined. DAX uses the IP of the
  // VAST request when ip is not specified. We are using the client-to-server
  // integration so we don't need to set X-Forwarded-For HTTP header.

  // The 'ua' parameter is intentionally left undefined. The User-Agent HTTP
  // header is set when requesting the VAST URL so we don't need to set this.

  // The 'referrer' parameter is intentionally left undefined. We are using the
  // client-server integration so DAX will infer this from HTTP headers.

  // The 'language' parameter is intentionally left undefined. DAX will infer
  // this from HTTP headers. We might want to explicitly set this in the future
  // if we allow the player to initialized with an explicit language, rather
  // than inferring it from the user's browser settings.

  // TODO: content_language
  // TODO: collectionid
  // TODO: showid
  // TODO: episodeid
  // TODO: category
  // TODO: genre
  // TODO: bundles
  // TODO: explicit

  // These is used to identify the player integration making calls on DAX's side.
  params.dax_player = "BeyondWords Player";
  params.dax_version = version;

  // TODO: dax_platform
  // TODO: cast_platform
  // TODO: age
  // TODO: gender
  // TODO: audience

  // There is no way to log into the player so set this to false for now. We
  // might want to use this for differentiating whether the user is logged into
  // the publisher's site and is listening to paywalled content.
  params.isLoggedIn = false;

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
