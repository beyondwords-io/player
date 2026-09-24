// Compile against the package export and generated declarations, not src/.
import { Connector, createConnectorWidget } from "@beyondwords/player/connector";
import type { ConnectorWidgetOptions, ConnectorWidget, ConnectorTheme } from "@beyondwords/player/connector";

const options: ConnectorWidgetOptions = {
  target: "#connector",
  connectUrl: "https://publisher.example/choose",
  provider: "claude",
  theme: "auto",
};

const connector: ConnectorWidget = new Connector(options);
const theme: ConnectorTheme = "dark";
connector.update({ theme, label: "Our journalism" });
connector.update({ provider: undefined });
const host: HTMLElement = connector.element;
createConnectorWidget({ target: host, connectUrl: options.connectUrl }).destroy();
connector.destroy();

// @ts-expect-error Unsupported themes must not silently become an untyped API.
connector.update({ theme: "custom" });
// @ts-expect-error A complete destination is required.
new Connector({ target: "#connector" });
