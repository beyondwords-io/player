import { name } from "../../package.json";

const throwError = (message, context) => {
  message = [message].flat().join("\n");

  let error = `${name}:\n\n${message}`;

  if (context) {
    error += "\nThis context may be helpful:\n\n";

    for (const [key, value] of Object.entries(context)) {
      error += `  - ${key}: ${JSON.stringify(value)}\n`;
    }
  }

  throw new Error(error);
};

export default throwError;
