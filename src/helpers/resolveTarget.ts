import throwError from "./throwError";

const resolveTarget = (target) => {
  if (!target) {
    return { newTarget: document.body, showUserInterface: false };
  }

  if (isScriptTag(target)) {
    return { newTarget: addDivAfter(target), showUserInterface: true };
  }

  if (isIdSelector(target)) {
    return { newTarget: findById(target), showUserInterface: true };
  }

  if (isClassSelector(target)) {
    return { newTarget: findByClass(target), showUserInterface: true };
  }

  return { newTarget: target, showUserInterface: true };
};

// private

const isScriptTag = (target) => {
  return typeof target === "object" && target.nodeName.toLowerCase() === "script";
};

const isIdSelector = (target) => {
  return typeof target === "string" && target.startsWith("#");
};

const isClassSelector = (target) => {
  return typeof target === "string" && target.startsWith(".");
};

const addDivAfter = (target) => {
  const div = document.createElement("div");
  target.parentNode.insertBefore(div, target.nextSibling);
  return div;
};

const findById = (target) => {
  const id = target.slice(1);
  const element = document.getElementById(id);

  if (!element) {
    throwError("Failed to initialize player because the target could not be found.", { target, id });
  }

  return element;
};

const findByClass = (target) => {
  const className = target.slice(1);
  const element = document.getElementsByClassName(className)[0];

  if (!element) {
    throwError("Failed to initialize player because the target could not be found.", { target, className });
  }

  return element;
};

export default resolveTarget;
