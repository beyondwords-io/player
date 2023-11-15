import { GVL, TCModel, TCString } from "@iabtechlabtcf/core";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

// The writeDaisybitStringsToFile function writes a JavaScript file containing
// IAB TCF daisybit strings that provide GDPR consent for either personalized or
// non-personalized ads across all known vendors from vendor-list.json.
//
// We can prepare these strings at build time because they won't change very
// often and it avoids loading additional dependencies and making additional
// requests as part of the player's loading process.
//
// This page has a handy daisybit encoder/decoder: https://iabtcf.com/#/encode

const writeDaisybitStrings = () => ({
  name: "writeDaisybitStrings",
  enforce: "pre",
  buildStart: () => {
    writeDaisybitStringsToFile("src/helpers/daisybitStrings.ts");
  }
});

const writeDaisybitStringsToFile = async (jsOutputFilename) => {
  const response = await fetch("https://vendor-list.consensu.org/v2/vendor-list.json");
  const vendorList = await response.json();

  const gvl = new GVL(vendorList);

  const stacks = Object.values(gvl.stacks);
  const vendors = Object.values(gvl.fullVendorList);

  const nonPersonalizedStack = stacks.find(s => s.name === "Basic ads, and ad measurement");
  const personalizedStack = stacks.find(s => s.name === "Personalised ads, and ad measurement");

  const nonPersonalizedModel = new TCModel(gvl);
  const personalizedModel = new TCModel(gvl);

  // Allow all purposes based on whether personalized adverts are enabled in the player.
  nonPersonalizedModel.purposeConsents.set(nonPersonalizedStack.purposes);
  personalizedModel.purposeConsents.set(personalizedStack.purposes);

  // Allow all available vendors to provide programmatic adverts to the player.
  // The vendor list might change over time as new vendors are added.
  for (const vendor of vendors) {
    nonPersonalizedModel.vendorConsents.set(vendor.id);
    personalizedModel.vendorConsents.set(vendor.id);
  }

  const nonPersonalizedDaisybit = TCString.encode(nonPersonalizedModel);
  const personalizedDaisybit = TCString.encode(personalizedModel);

  const objectToWrite = { nonPersonalizedDaisybit, personalizedDaisybit };
  const jsonToWrite = JSON.stringify(objectToWrite, null, 2);

  const basename = path.basename(__filename);
  const comment = `// This file is auto-generated at build time by ${basename}\n`;

  fs.writeFileSync(jsOutputFilename, `${comment}export default ${jsonToWrite}`);
};

export default writeDaisybitStrings;
