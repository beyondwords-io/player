// This class is responsible for selecting which consumer is the current owner
// of a resource. It uses a simple strategy that grants ownership to the
// consumer that most recently registered interest. When a consumer is no longer
// interested, ownership reverts to the next-most-recent consumer, and so on.
//
// If two owners call onSelected with exactly the same arguments then the
// OwnershipMediator avoids calling onSelected unnecessarily. The current owner
// of a resource is always the last element in the this.consumers array.

class OwnershipMediator {
  constructor(onSelected, onDeselected) {
    this.onSelected = onSelected;
    this.onDeselected = onDeselected;
    this.consumers = {};
  }

  registerInterest(resourceId, consumerId, ...args) {
    this.consumers[resourceId] ||= [];
    const last = this.consumers[resourceId].slice(-1)[0];

    this.consumers[resourceId] = this.consumers[resourceId].filter(o => o.consumerId !== consumerId);
    this.consumers[resourceId].push({ consumerId, args });

    if (last && this.#arraysEqual(args, last.args)) { return; }
    this.onSelected(resourceId, ...args);
  }

  deregisterInterest(resourceId, consumerId) {
    this.consumers[resourceId] ||= [];
    const last = this.consumers[resourceId].slice(-1)[0];

    this.consumers[resourceId] = this.consumers[resourceId].filter(o => o.consumerId !== consumerId);

    const wasSelected = last && consumerId === last.consumerId;
    if (!wasSelected) { return; }

    const nextLast = this.consumers[resourceId].slice(-1)[0];
    if (nextLast && this.#arraysEqual(last.args, nextLast.args)) { return; }

    this.onDeselected(resourceId, last.args);
    if (nextLast) { this.onSelected(resourceId, nextLast.args); }
  }

  // private

  #arraysEqual(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every((e, i) => e === arr2[i]);
  }
}

export default OwnershipMediator;
