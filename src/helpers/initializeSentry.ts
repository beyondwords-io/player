import * as Sentry from "@sentry/svelte";
import * as stackTraceParser from "stacktrace-parser";

const initializeSentry = () => {
  const thisFilename = originFilename(new Error());
  const isDevelopment = thisFilename?.match(/initializeSentry/);
  const captureEnabled = thisFilename ? {} : { defaultIntegrations: false };

  Sentry.init({
    ...captureEnabled, // See the message below.

    dsn: "https://ea2f0f2a070b4934994dc8543b8d16e1@o271781.ingest.sentry.io/4504853792882688",
    environment: isDevelopment ? "development" : "production",

    beforeSend(event, { originalException: error }) {
      const originatedFromPlayer = originFilename(error) === thisFilename;
      const shouldSendToSentry = originatedFromPlayer || isDevelopment;

      if (shouldSendToSentry) { return event; }
    },
  });

  if (thisFilename) { return; }

  Sentry.captureException(new Error([
    "Unable to determine the filename of the BeyondWords player script.",
    "We therefore can't filter errors to only those originating from the player.",
    "To avoid receiving unrelated errors from publishers, Sentry has been disabled.",
  ].join("\n")));
};

const originFilename = (error) => (
  stackTraceParser.parse(error?.stack || "")[0]?.file
);

initializeSentry();
