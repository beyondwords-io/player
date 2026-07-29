// Agent client interface for the default player's Chat/Talk surfaces.
//
// The real backend integration does not exist yet, so the player ships with a
// deterministic mock that streams scripted answers clause-by-clause. Answers
// cycle in order, so screenshots and local testing are reproducible.

const SCRIPTED_ANSWERS = [
  {
    clauses: [
      "This article covers the launch of a new audio platform, ",
      "which converts written journalism into listenable formats. ",
      "The publisher reports early engagement well above their expectations.",
    ],
    citations: [{ title: "From the article", url: "#segment-3" }],
  },
  {
    clauses: [
      "The main points are the partnership announcement, ",
      "the rollout timeline for later this year, ",
      "and the early results from the pilot programme.",
    ],
    citations: [
      { title: "Partnership details", url: "#segment-5" },
      { title: "Pilot results", url: "#segment-9" },
    ],
  },
  {
    clauses: [
      "Yes - the publication has covered this topic before. ",
      "The most recent related piece looked at how newsrooms adopt audio, ",
      "and there is a longer background explainer from earlier this year.",
    ],
    citations: [{ title: "Related coverage", url: "#related" }],
  },
];

const MOCK_TRANSCRIPT = "What changed since last week?";

class MockAgentClient {
  answerIndex: number;

  constructor() {
    this.answerIndex = 0;
  }

  // Streams an answer clause-by-clause. Returns a handle with stop().
  send(_question, { onClause = (_s) => {}, onDone = (_citations) => {} } = {}) {
    const answer = SCRIPTED_ANSWERS[this.answerIndex % SCRIPTED_ANSWERS.length];
    this.answerIndex += 1;

    const instant = typeof window !== "undefined" && (window as { disableAnimation?: boolean }).disableAnimation;
    let stopped = false;
    let timer;

    const deliver = (i) => {
      if (stopped) { return; }

      if (i >= answer.clauses.length) {
        onDone(answer.citations);
        return;
      }

      onClause(answer.clauses[i]);
      timer = setTimeout(() => deliver(i + 1), instant ? 0 : 350);
    };

    if (instant) {
      answer.clauses.forEach((clause) => onClause(clause));
      onDone(answer.citations);
    } else {
      timer = setTimeout(() => deliver(0), 450);
    }

    return {
      stop: () => {
        stopped = true;
        clearTimeout(timer);
        onDone([]);
      },
    };
  }

  // Simulates voice recognition for the listening strip.
  listen({ onPartial = (_s) => {} } = {}) {
    const instant = typeof window !== "undefined" && (window as { disableAnimation?: boolean }).disableAnimation;
    const words = MOCK_TRANSCRIPT.split(" ");
    let stopped = false;
    let timer;

    const deliver = (i) => {
      if (stopped || i > words.length) { return; }
      onPartial(words.slice(0, i).join(" "));
      timer = setTimeout(() => deliver(i + 1), instant ? 0 : 400);
    };

    deliver(instant ? words.length : 1);

    return {
      transcript: () => MOCK_TRANSCRIPT,
      stop: () => {
        stopped = true;
        clearTimeout(timer);
      },
    };
  }
}

export default MockAgentClient;
