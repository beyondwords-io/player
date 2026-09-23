import { name } from "../../package.json";

type ErrorMessage = string | string[];

const throwError = (message: ErrorMessage, context?: Record<string, unknown>): never => {
  message = [message].flat().join("\n");

  let error = `${name}:\n\n${message}`;

  if (context) {
    error += "\nThis context may be helpful:\n\n";

    for (const [key, value] of Object.entries(context)) {
      error += `  - ${key}: ${JSON.stringify(value)}\n`;
    }
  } else {
    error += "\n";
  }

  throw new Error(error);
};

export default throwError;
