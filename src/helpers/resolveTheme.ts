const resolveTheme = (theme) => {
  if (theme === "dark") {
    return "dark";
  } else if (theme === "auto" && isBrowserDarkMode()) {
    return "dark";
  } else {
    return "light";
  }
};

const isBrowserDarkMode = () => (
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
);

export default resolveTheme;
