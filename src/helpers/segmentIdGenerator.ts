// Give each segment a uniqueId per player that tries to use the segment marker
// if it is available, otherwise a random ID is generated for the DOM node. This
// is needed so that OwnershipMediator has a stable key for when consumers are
// registering and deregistering their interest, e.g. for showing highlights.

class SegmentIdGenerator {
  constructor() {
    this.randomIds = new WeakMap();
  }

  fetchOrAdd(segment) {
    if (!segment?.segmentElement) { return null; }
    if (segment.marker) { return segment.marker; }

    const exists = this.uniqueIds.has(segment.segmentElement);
    if (!exists) { this.uniqueIds.set(segment.segmentElement, this.#randomId()); }

    return this.randomIds.get(segment.segmentElement);
  }

  #randomId() {
    return Math.random().toString(36).substring(2);
  }
}

export default SegmentIdGenerator;
