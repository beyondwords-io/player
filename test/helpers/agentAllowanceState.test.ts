import AgentAllowanceState from "../../src/helpers/agentAllowanceState";

describe("agent allowance state", () => {
  it("shares question consumption and resets only when its identity changes", () => {
    const allowance = new AgentAllowanceState();
    let state;
    allowance.subscribe((value) => state = value);

    allowance.configure({ identity: "article-a:free", questionsLimit: 2, voiceSecondsLimit: null });
    allowance.useQuestion();
    expect(state).toMatchObject({ questionsUsed: 1, questionsRemaining: 1 });

    allowance.configure({ identity: "article-a:free", questionsLimit: 2, voiceSecondsLimit: null });
    expect(state.questionsRemaining).toEqual(1);

    allowance.configure({ identity: "article-b:free", questionsLimit: 2, voiceSecondsLimit: null });
    expect(state).toMatchObject({ questionsUsed: 0, questionsRemaining: 2 });
    allowance.destroy();
  });

  it("meters only a live finite voice session and ends it at zero", () => {
    let tick;
    let cleared = 0;
    let exhausted = 0;
    const allowance = new AgentAllowanceState({
      setIntervalFn: ((callback) => { tick = callback; return 7; }) as typeof setInterval,
      clearIntervalFn: (() => { cleared += 1; }) as typeof clearInterval,
      onVoiceExhausted: () => { exhausted += 1; },
    });
    let state;
    allowance.subscribe((value) => state = value);

    allowance.configure({ identity: "article-a:free", questionsLimit: null, voiceSecondsLimit: 2 });
    allowance.setVoiceLive(true);
    tick();
    expect(state.voiceSecondsRemaining).toEqual(1);
    tick();
    expect(state.voiceSecondsRemaining).toEqual(0);
    expect(exhausted).toEqual(1);
    expect(cleared).toEqual(1);

    allowance.destroy();
  });

  it("does not start a timer for unlimited voice", () => {
    let started = 0;
    const allowance = new AgentAllowanceState({
      setIntervalFn: ((callback) => { started += 1; return callback; }) as typeof setInterval,
    });

    allowance.configure({ identity: "article-a:paid", questionsLimit: null, voiceSecondsLimit: null });
    allowance.setVoiceLive(true);
    expect(started).toEqual(0);
    allowance.destroy();
  });

  it("uses the browser timer with its required receiver", () => {
    vi.useFakeTimers();
    let exhausted = 0;
    const allowance = new AgentAllowanceState({
      onVoiceExhausted: () => { exhausted += 1; },
    });

    allowance.configure({ identity: "article-a:free", questionsLimit: 0, voiceSecondsLimit: 1 });
    allowance.setVoiceLive(true);
    vi.advanceTimersByTime(1000);

    expect(exhausted).toEqual(1);
    allowance.destroy();
    vi.useRealTimers();
  });
});
