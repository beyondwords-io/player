// Agent client interface for the default player's Chat/Talk surfaces.
//
// The real backend integration does not exist yet, so the player ships with a
// deterministic mock. Answers cycle in order, so screenshots and local testing
// are reproducible.
//
// The callback names deliberately mirror the ElevenLabs Agents SDK, so wiring
// the real agent is a swap rather than a rewrite of the panel:
//
//   onTyping  <- onAgentTyping             the agent has started composing
//   onPart    <- onAgentChatResponsePart   { type: "start" | "delta" | "stop" }
//   onDone    <- onMessage / agent_response_complete, plus citations
//
// Two more of theirs matter when this is wired, and the panel is built to take
// them: onAgentResponseCorrection replaces text that has already been revealed,
// and onAudioAlignment carries per-character timings (chars, char_start_times_ms)
// so a voice answer can reveal its text in step with the speech rather than at
// an invented typing speed.

const SCRIPTED_ANSWERS = [
  {
    text: "This article covers the launch of a new audio platform, " +
      "which converts written journalism into listenable formats. " +
      "The publisher reports early engagement well above their expectations.",
    citations: [{ title: "From the article", url: "#segment-3" }],
  },
  {
    text: "The main points are the partnership announcement, " +
      "the rollout timeline for later this year, " +
      "and the early results from the pilot programme.",
    citations: [
      { title: "Partnership details", url: "#segment-5" },
      { title: "Pilot results", url: "#segment-9" },
    ],
  },
  {
    text: "Yes - the publication has covered this topic before. " +
      "The most recent related piece looked at how newsrooms adopt audio, " +
      "and there is a longer background explainer from earlier this year.",
    citations: [{ title: "Related coverage", url: "#related" }],
  },
];

const MOCK_TRANSCRIPT = "What changed since last week?";

class MockAgentClient {
  answerIndex: number;

  constructor() {
    this.answerIndex = 0;
  }

  // Streams an answer as deltas, the way the agent platform does. Returns a
  // handle with stop().
  send(_question, { onTyping = () => {}, onPart = (_part) => {}, onDone = (_citations) => {} } = {}) {
    const answer = SCRIPTED_ANSWERS[this.answerIndex % SCRIPTED_ANSWERS.length];
    this.answerIndex += 1;

    // Deltas arrive token-sized, so split on word boundaries rather than
    // clauses: three big jumps does not read as an answer being written.
    const deltas = answer.text.match(/\S+\s*/g) || [];

    const instant = typeof window !== "undefined" && (window as { disableAnimation?: boolean }).disableAnimation;
    let stopped = false;
    let timer;

    const deliver = (i) => {
      if (stopped) { return; }

      if (i >= deltas.length) {
        onPart({ type: "stop", text: "" });
        onDone(answer.citations);
        return;
      }

      if (i === 0) { onPart({ type: "start", text: "" }); }
      onPart({ type: "delta", text: deltas[i] });

      timer = setTimeout(() => deliver(i + 1), instant ? 0 : 45);
    };

    if (instant) {
      onPart({ type: "start", text: "" });
      deltas.forEach((text) => onPart({ type: "delta", text }));
      onPart({ type: "stop", text: "" });
      onDone(answer.citations);
    } else {
      // The gap before the first delta is what the typing indicator fills.
      onTyping();
      timer = setTimeout(() => deliver(0), 550);
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
