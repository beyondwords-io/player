import { postJson } from "../helpers/fetchJson";

class AnalyticsClient {
  constructor(analyticsSink) {
    this.analyticsSink = analyticsSink;
  }

  sendToCustomAnalytics(data) {
    return postJson(this.analyticsSink, data);
  }

  sendToGoogleAnalytics(eventName, data) {
    window.gtag("event", eventName, { ...data, send_to: this.analyticsSink });
  }
}

export default AnalyticsClient;
