import { postJson } from "../helpers/fetchJson";

class AnalyticsClient {
  constructor(analyticsUrl) {
    this.analyticsUrl = analyticsUrl;
  }

  sendEvent(data) {
    return postJson(this.analyticsUrl, data);
  }
}

export default AnalyticsClient;
