// The ElevenLabs Agents SDK, kept behind a dynamic import so its WebRTC stack
// (~850KB before compression) never enters the base bundle. This module is
// marked external in vite.config.ts: in development it loads the SDK from
// node_modules, and in production builds bin/vendor_agent bundles it into
// dist/elevenlabs-client.js and repoints the import there - the same
// arrangement as loadTheStyles.ts / style.js and hls.
export * from "@elevenlabs/client";
