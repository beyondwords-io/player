async function getGhostSessionToken() {
  const response = await fetch("/members/api/session");
  if (response.status !== 200)
    throw new Error(`Failed to fetch session: ${response.status}`);
  const sessionToken = await response.text();
  return sessionToken;
}

const PIANO_TIMEOUT_MS = 3000;

type PianoUser = { isUserValid(): boolean; getToken(): string; };
type Tp = {
  push(command: [string, () => void]): void;
  pianoId?: PianoUser;
  pianoIdLite?: PianoUser;
  user: { refreshAccessToken(force: boolean, callback: () => void): void; };
  util: { getTacCookie(): string | undefined; };
};

function getPianoSessionToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const initTimeout = setTimeout(() => reject(new Error("Piano did not initialise")), PIANO_TIMEOUT_MS);
    const w = window as unknown as { tp?: Tp; };
    w.tp = w.tp || ([] as unknown as Tp);
    w.tp.push(["init", () => {
      clearTimeout(initTimeout);
      const { tp } = w;
      const [provider, sdk]: [string?, PianoUser?] = tp.pianoId?.isUserValid() ? ["piano_id", tp.pianoId]
        : tp.pianoIdLite?.isUserValid() ? ["piano_id_lite", tp.pianoIdLite] : [];
      if (!sdk) return reject(new Error("No Piano user is logged in"));

      const read = () => resolve(tp.util.getTacCookie() || `${provider}:${sdk.getToken()}`);
      setTimeout(read, PIANO_TIMEOUT_MS);
      tp.user.refreshAccessToken(true, read);
    }]);
  });
}

export type UserSession = {
  authProvider: "ghost" | "piano";
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
    case "piano": {
      let sessionToken: string;
      try {
        sessionToken = await getPianoSessionToken();
      } catch (error) {
        return null;
      }
      return { authProvider: "piano", sessionToken };
    }
    default:
      console.warn(
        `BeyondWords.Player: unknown auth provider: ${authProvider}`,
      );
      return null;
  }
}
