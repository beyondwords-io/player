import throwError from "./throwError";

const resolveTarget = (target) => {
  if (!target) {
    return { newTarget: appendDivToBody(), showUserInterface: false };
  }

  if (isScriptTag(target)) {
    return { newTarget: addDivAfter(target), showUserInterface: true };
  }

  if (typeof target === "string") {
    return { newTarget: findByQuery(target), showUserInterface: true };
  }

  return { newTarget: target, showUserInterface: true };
};

// private

const isScriptTag = (target) => {
  return typeof target === "object" && target.nodeName.toLowerCase() === "script";
};

const appendDivToBody = () => {
  const div = document.createElement("div");
  document.body.appendChild(div);

  return div;
};

const addDivAfter = (target) => {
  const div = document.createElement("div");
  target.parentNode.insertBefore(div, target.nextSibling);

  return div;
};

const findByQuery = (target) => {
  const elements = document.querySelectorAll(target);

  if (elements.length === 0) {
    throwError("Failed to initialize player because the target could not be found.", { target, elements });
  }

  if (elements.length > 1) {
    throwError(`Failed to initialize player because the target is ambiguous. (${elements.length} elements match)`, { target, elements });
  }

  return elements[0];
};

export default resolveTarget;
