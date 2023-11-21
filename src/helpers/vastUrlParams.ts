import { version } from "../../package.json";
import { parseUrl} from "./chooseAdvertText";
import daisybitStrings from "./daisybitStrings";

const vastUrlParams = (vastUrl, placement, advertConsent, maxImageSize, projectId, playlistId, contentId, contentLanguage, platform, vendorIdentifier, bundleIdentifier, showingVideo) => {
  const isLocahost = window.location.hostname === "localhost";

  if (isGoogleAdManager(vastUrl)) {
    return googleAdManagerParams(isLocahost, advertConsent, showingVideo);
  }

  if (isDigitalAdExchange(vastUrl)) {
    return digitalAdExchangeParams(isLocahost, vastUrl, placement, advertConsent, maxImageSize, projectId, playlistId, contentId, contentLanguage, platform, vendorIdentifier, bundleIdentifier);
  }

  return {};
};

const isGoogleAdManager = (vastUrl) => vastUrl?.includes("pubads.g.doubleclick.net");
const isDigitalAdExchange = (vastUrl) => vastUrl?.includes("geo.ads.audio.thisisdax.com");

const googleAdManagerParams = (isLocahost, advertConsent, showingVideo) => {
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

  // TODO: does Google Ad Manager support a parameter for companion ad size?
  // If so, we can use maxImageSize like we do with the DAX integration.

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

const digitalAdExchangeParams = (isLocahost, vastUrl, placement, advertConsent, maxImageSize, projectId, playlistId, contentId, contentLanguage, platform, vendorIdentifier, bundleIdentifier) => {
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

  // The player iOS/Android SDK does not ask to track the user's location. The
  // app its embedded in might do, but for now, we don't forward this data.
  params.att = 0;

  // The bundle identifier is fetched by the ios SDK from within the app it is
  // running inside of. This player property won't be set on android/web.
  // https://linear.app/beyondwords/issue/S-3847/set-the-bundleidentifier-player-property-from-the-iosandroid-sdks
  if (vendorIdentifier) { params.idfv = vendorIdentifier; }

  // The 'nlsid' parameter is intentionally left blank. We don't have a Nielsen
  // DMP user account so this parameter is irrelevant.

  // Set the publisher's brand domain from the current URL. This will be null
  // on mobile because the player is loaded in an iframe. It might not always be
  // what we want either but we can set explicitly later from props if needed.
  // https://linear.app/beyondwords/issue/S-3848/add-dax-support-for-publisher-brand-domain-to-mobile-apps
  const hostname = parseUrl(window.location.href)?.hostname?.replace(/^www./, "");
  if (hostname && !isLocahost) { params.u = hostname; }

  // TODO: dur_min: https://linear.app/beyondwords/issue/S-3846/consider-whether-to-allow-publishers-to-set-a-minimum-and-maximum
  // TODO: dur_max: ticket above

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

  // The bundle identifier is fetched by the ios/android SDKs from within the
  // app they are running inside of. This player property won't be set on web.
  // https://linear.app/beyondwords/issue/S-3847/set-the-bundleidentifier-player-property-from-the-iosandroid-sdks
  if (bundleIdentifier) { params.bi = bundleIdentifier; }

  // TODO: lat: https://linear.app/beyondwords/issue/S-3840/consider-whether-to-provide-gps-and-wifi-data-to-dax
  // TODO: long: ticket above
  // TODO: bcat: https://linear.app/beyondwords/issue/S-3845/consider-whether-to-whitelistblacklist-categories-and-domains-for-dax
  // TODO: cat: ticket above
  // TODO: badv: ticket above

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

  // Set content language from the project's default voice for title or summary.
  params.content_language = contentLanguage.split(/[_-]/)[0];

  // We may as well use these parameters to keep track of the BeyondWords
  // identifiers for the content that is currently loaded into the player.
  params.collectionid = projectId ? `project-${projectId}` : "no-project";
  params.showid = playlistId ? `playlist-${playlistId}` : "no-playlist";
  params.episodeid = contentId ? `content-${contentId}` : "no-content";

  // TODO: category: https://linear.app/beyondwords/issue/S-3844/consider-whether-to-provide-categories-and-genres-to-dax
  // TODO: genre: ticket above
  // TODO: bundles: https://linear.app/beyondwords/issue/S-3843/consider-whether-to-provide-bundles-to-dax

  // Almost all BeyondWords content won't be explicit so I think it's
  // reasonable to set this to false. In the future, we might want to allow
  // content to be flagged as explicit, e.g. by setting data-explicit="true".
  params.explicit = false;

  // These is used to identify the player integration making calls on DAX's side.
  params.dax_player = "BeyondWords Player";
  params.dax_version = version;

  // Forward the platform to DAX. The iOS and Android SDKs set this in the props.
  if (platform === "ios") {
    params.dax_platform = "iOS";
  } else if (platform === "android") {
    params.dax_platform = "Android";
  } else {
    params.dax_platform = "web";
  }

  // TODO: cast_platform: https://linear.app/beyondwords/issue/S-3842/consider-whether-to-provide-cast-platform-to-dax

  // The 'age' and 'gender' parameters are intentionally left blank. We don't
  // track these attributes of listeners.

  // TODO: audience: https://linear.app/beyondwords/issue/S-3841/consider-whether-to-provide-the-audience-parameter-to-dax

  // There is no way to log into the player so set this to false for now. We
  // might want to use this for differentiating whether the user is logged into
  // the publisher's site and is listening to paywalled content.
  params.isLoggedIn = false;

  // TODO: gps_accuracy: https://linear.app/beyondwords/issue/S-3840/consider-whether-to-provide-gps-and-wifi-data-to-dax
  // TODO: gps_alt: ticket above
  // TODO: gps_epoch: ticket above
  // TODO: gps_placemarks_geocode: ticket above
  // TODO: gps_provider: ticket above
  // TODO: gps_speed: ticket above
  // TODO: wifi: ticket above

  // Request companion ads if the large or screen player styles are used. The
  // companion ad shows in the LargeImage component. Take display scaling into
  // account when requesting ads so that higher resolution ads are selected.
  if (maxImageSize > 0) {
    const scaledSize = maxImageSize * (window.devicePixelRatio || 1);

    params.comp_size = `${scaledSize}x${scaledSize}`;
    params.is_comp_allowed = 1;
  } else {
    params.is_comp_allowed = 0;
  }

  // Set the cachebuster to a random number. This prevents proxies from caching
  // intermediate results. Use the same 10-digit length that we use for the
  // bulk_sync.js script in SetDaxListenerId.svelte.
  params.cb = Math.floor(Math.random() * 10000000000);

  return params;
};

export default vastUrlParams;
export { isDigitalAdExchange };
