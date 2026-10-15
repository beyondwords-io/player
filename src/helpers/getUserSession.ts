async function getGhostSessionToken() {
  const response = await fetch("/members/api/session");
  if (response.status !== 200)
    throw new Error(`Failed to fetch session: ${response.status}`);
  const sessionToken = await response.text();
  return sessionToken;
}

export type UserSession = {
  authProvider: "ghost";
  sessionToken: string;
};

export default async function getUserSession(
  authProvider: string,
): Promise<UserSession | null> {
  switch (authProvider) {
    case "ghost": {
      let sessionToken: string;
      try {
        sessionToken = await getGhostSessionToken();
      } catch (error) {
        return null;
      }
      return { authProvider: "ghost", sessionToken };
    }
    default:
      console.warn(
        `BeyondWords.Player: unknown auth provider: ${authProvider}`,
      );
      return null;
  }
}
