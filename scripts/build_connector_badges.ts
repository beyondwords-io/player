import { mkdir, writeFile } from "node:fs/promises";
import { renderConnectorBadge } from "../src/connector/badge";

const destination = new URL("../dist/connector-badges/", import.meta.url);
await mkdir(destination, { recursive: true });
for (const provider of [undefined, "claude", "chatgpt", "grok"] as const) {
  for (const theme of ["light", "dark", "auto"] as const) {
    await writeFile(new URL(`${provider ?? "generic"}-${theme}.svg`, destination), renderConnectorBadge(provider, theme));
  }
}
