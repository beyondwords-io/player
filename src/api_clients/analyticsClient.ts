import { postJson } from "../helpers/fetchJson";

class AnalyticsClient {
  constructor(analyticsSink) {
    this.analyticsSink = analyticsSink;
  }

  sendToCustomAnalytics(data) {
    return postJson(this.analyticsSink, data);
  }

  sendToGoogleAnalytics(data) {
    window.gtag("event", data.event_type, { ...data, send_to: this.analyticsSink });
  }
}

export default AnalyticsClient;
