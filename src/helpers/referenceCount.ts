class ReferenceCount {
  #count = {};

  reference(object, onFirstReference) {
    if (object) {
      this.#count[object] ||= 0;
      this.#count[object] += 1;

      if (this.#count[object] === 1) {
        onFirstReference();
      }
    }
  }

  unreference(object, onLastReference) {
    if (object) {
      this.#count[object] -= 1;

      if (this.#count[object] === 0) {
        onLastReference();
      }
    }
  }
}

export default ReferenceCount;
