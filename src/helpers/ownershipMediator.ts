// This class is responsible for selecting which consumer is the current owner
// of a resource. It uses a simple strategy that grants ownership to the
// consumer that most recently added interest. When a consumer removes interest
// ownership reverts to the next-most-recent consumer, and so on.
//
// If two owners call onSelected with exactly the same arguments then the
// OwnershipMediator avoids calling onSelected unnecessarily. The current owner
// of a resource is always the last element in the this.consumers array.

class OwnershipMediator {
  constructor(onSelected, onDeselected) {
    this.onSelected = onSelected;
    this.onDeselected = onDeselected;
    this.consumers = new WeakMap();
  }

  addInterest(resourceId, consumerId, ...args) {
    this.#setInitialValue(this.consumers, resourceId, []);
    const last = this.consumers.get(resourceId).slice(-1)[0];

    this.consumers.get(resourceId).push({ consumerId, args });

    if (last && this.#arraysEqual(args, last.args)) { return; }

    if (last) { this.onDeselected(resourceId, ...last.args); }
    this.onSelected(resourceId, ...args);
  }

  removeInterest(resourceId, consumerId) {
    this.#setInitialValue(this.consumers, resourceId, []);
    const last = this.consumers.get(resourceId).slice(-1)[0];

    this.#removeLast(this.consumers.get(resourceId), o => o.consumerId === consumerId);

    const wasSelected = last && consumerId === last.consumerId;
    if (!wasSelected) { return; }

    const nextLast = this.consumers.get(resourceId).slice(-1)[0];
    if (nextLast && this.#arraysEqual(last.args, nextLast.args)) { return; }

    this.onDeselected(resourceId, ...last.args);
    if (nextLast) { this.onSelected(resourceId, ...nextLast.args); }
  }

  // private

  #setInitialValue(map, key, value) {
    if (!map.has(key)) { map.set(key, value); }
  }

  #arraysEqual(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every((e, i) => e === arr2[i]);
  }

  #removeLast(array, conditionFn) {
    for (let i = array.length - 1; i >= 0; i -= 1) {
      if (!conditionFn(array[i])) { continue; }

      array.splice(i, 1);
      return;
    }
  }
}

export default OwnershipMediator;
