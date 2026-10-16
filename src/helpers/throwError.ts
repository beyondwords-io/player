import { name } from "../../package.json";

type ErrorMessage = string | string[];

const formatErrorMessage = (message: ErrorMessage, context?: Record<string, unknown>): string => {
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

  return error;
};

const throwError = (message: ErrorMessage, context?: Record<string, unknown>): never => {
  throw new Error(formatErrorMessage(message, context));
};

export default throwError;
export { formatErrorMessage };
