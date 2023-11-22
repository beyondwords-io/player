// Rather than checking for an exact match, we allow some fuzzyness.
//
// We need this because the segment xpath doesn't always match the xpath from
// the page, for example, if elements are inserted dynamically with JavaScript.
//
// If for example, we dynamically add the player div to the end of <body>, the
// xpath to the 'Hello' text would be /html/body/div[1]/p whereas the xpath
// stored on the segment would be /html/body/div/p because the div is unique.
//
// <html>
//   <body>
//     <div>
//       <p>Hello</p>
//     </div>
//   </body>
// </html>
//
// Similarly, elements could be removed, e.g. by ad blocker extensions, so we
// check if each xpath part exactly matches or is a superset of the other part.
// By 'superset' we mean that /div is a superset of /div[1], /div[2], etc.

const matchesXpath = (xpath1, xpath2) => {
  if (xpath1 === xpath2) { return true; }
  if (!xpath1 || !xpath2) { return false; }

  const parts1 = xpath1.split("/");
  const parts2 = xpath2.split("/");

  if (parts1.length !== parts2.length) { return false; }

  for (let i = 0; i < parts1.length; i += 1) {
    if (parts1[i] === parts2[i]) { continue; }

    if (parts1[i].startsWith(`${parts2[i]}[`)) { continue; }
    if (parts2[i].startsWith(`${parts1[i]}[`)) { continue; }

    return false;
  }

  return true;
};

export default matchesXpath;
