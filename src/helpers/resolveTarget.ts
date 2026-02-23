import throwError from "./throwError";

const resolveTarget = (target, ghost) => {
  if (!target) {
    if (ghost) {
      return resolveGhostTarget();
    }

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

const resolveGhostTarget = () => {
  const beyondwordsTargetElement = document.querySelector(".beyondwords-target");
  if (beyondwordsTargetElement) {
    return { newTarget: beyondwordsTargetElement, showUserInterface: true };
  }

  const isPostTemplate = document.body.classList.contains("post-template");
  const isPageTemplate = document.body.classList.contains("page-template");
  if (!isPostTemplate && !isPageTemplate) {
    throwError("Player is only available on Ghost Posts and Pages.");
  }

  const postFullContentElement = document.querySelector(".post-full-content");
  if (postFullContentElement) {
    return { newTarget: postFullContentElement, showUserInterface: true };
  }

  const articleElement = document.querySelector("article");
  if (articleElement) {
    const headerElement = articleElement.querySelector("header");
    if (headerElement) {
      return { newTarget: headerElement, showUserInterface: true };
    }

    return { newTarget: articleElement, showUserInterface: true };
  }

  const contentElement = document.querySelector(".content");
  if (contentElement) {
    return { newTarget: contentElement, showUserInterface: true };
  }

  throwError("Failed to initialize player because the target could not be found.");
};

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

const findByQuery = (target, type = "player") => {
  if (typeof target !== "string") { return target; }

  const elements = document.querySelectorAll(target);

  if (elements.length === 0) {
    throwError(`Failed to initialize ${type} because the target could not be found.`, { target, elements });
  }

  if (elements.length > 1) {
    throwError(`Failed to initialize ${type} because the target is ambiguous. (${elements.length} elements match)`, { target, elements });
  }

  return elements[0];
};

export default resolveTarget;
export { findByQuery };
