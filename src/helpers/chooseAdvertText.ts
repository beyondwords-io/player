const chooseAdvertText = (clickThroughUrl) => {
  const url = parseUrl(clickThroughUrl);
  if (!url) { return ""; }

  let bestUrl = url;
  let bestScore = -1;

  for (const [key, value] of url.searchParams) {
    const redirectUrl = parseUrl(value);
    if (!redirectUrl) { continue; }

    const thisScore = queryParamScores[key] || 0;
    if (thisScore <= bestScore) { continue; }

    bestUrl = redirectUrl;
    bestScore = thisScore;
  }

  return bestUrl?.hostname?.replace(/^www./, "") || "";
};

const parseUrl = (string) => {
  try {
    return new URL(string);
  } catch {
    return null;
  }
};

// Try to guess the redirect query parameter of the URL.
const queryParamScores = {
  destination: 11,
  dest: 10,
  dst: 9,
  redirect: 8,
  red: 7,
  link: 6,
  visit: 5,
  return: 4,
  d: 3,
  r: 2,
  l: 1,
};

export default chooseAdvertText;
