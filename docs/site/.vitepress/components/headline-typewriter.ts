/** Hero headline pairs and typewriter cadence for LandscapeHero. */
export type HeadlinePair = readonly [line1: string, line2: string];

export const HEADLINE_PAIRS = {
  es: [
    ['Tus ideas.', 'En movimiento.'],
    ['De un chat.', 'A un plan.'],
    ['Tú decides.', 'El agente actúa.'],
    ['Un canvas.', 'Decisiones claras.'],
    ['Sigue el flujo.', 'Da el siguiente paso.'],
  ],
  en: [
    ['Your ideas.', 'In motion.'],
    ['From a chat.', 'To a plan.'],
    ['You decide.', 'The agent acts.'],
    ['One canvas.', 'Clear decisions.'],
    ['Follow the flow.', 'Take the next step.'],
  ],
} as const satisfies Record<'es' | 'en', readonly HeadlinePair[]>;

export const HEADLINE_TIMING = {
  typeMs: 52,
  deleteMs: 34,
  afterLine1Ms: 320,
  dwellMs: 2400,
  gapMs: 400,
} as const;

export function settledHeadlineLabel(locale: 'es' | 'en') {
  const [line1, line2] = HEADLINE_PAIRS[locale][0];
  return `${line1} ${line2}`;
}

export type TypewriterView = {
  line1: string;
  line2: string;
  caret: 'line1' | 'line2' | null;
  blink: boolean;
};

type RunnerOptions = {
  getLocale: () => 'es' | 'en';
  isFrozen: () => boolean;
  isHidden: () => boolean;
  onChange: (view: TypewriterView) => void;
  onPhraseComplete?: (label: string) => void;
  now?: () => number;
  schedule?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  cancel?: (id: ReturnType<typeof setTimeout>) => void;
};

/**
 * Type/backspace rotator. Frozen (reduced-motion or Pausar fondo) → pair #1, no caret.
 * Hidden tab pauses timers without resetting the current phrase.
 */
export function createHeadlineTypewriter(options: RunnerOptions) {
  const schedule = options.schedule ?? setTimeout;
  const cancel = options.cancel ?? clearTimeout;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pairIndex = 0;
  let line1 = '';
  let line2 = '';
  let phase:
    | 'frozen'
    | 'type1'
    | 'pause'
    | 'type2'
    | 'dwell'
    | 'delete2'
    | 'delete1'
    | 'gap' = 'frozen';
  let running = false;

  function pairs() {
    return HEADLINE_PAIRS[options.getLocale()];
  }

  function emit(
    caret: TypewriterView['caret'] = null,
    blink = false,
  ) {
    options.onChange({ line1, line2, caret, blink });
  }

  function clear() {
    if (timer !== undefined) cancel(timer);
    timer = undefined;
  }

  function wait(ms: number, next: () => void) {
    clear();
    timer = schedule(() => {
      timer = undefined;
      if (!running || options.isHidden()) return;
      if (options.isFrozen()) {
        freeze();
        return;
      }
      next();
    }, ms);
  }

  function freeze() {
    clear();
    const [a, b] = pairs()[0];
    pairIndex = 0;
    line1 = a;
    line2 = b;
    phase = 'frozen';
    emit(null, false);
  }

  function startPair() {
    const [target1] = pairs()[pairIndex];
    line1 = '';
    line2 = '';
    phase = 'type1';
    emit('line1', false);
    typeLine1(target1);
  }

  function typeLine1(target: string) {
    if (line1.length >= target.length) {
      phase = 'pause';
      emit('line1', false);
      wait(HEADLINE_TIMING.afterLine1Ms, () => {
        const [, target2] = pairs()[pairIndex];
        phase = 'type2';
        emit('line2', false);
        typeLine2(target2);
      });
      return;
    }
    line1 = target.slice(0, line1.length + 1);
    emit('line1', false);
    wait(HEADLINE_TIMING.typeMs, () => typeLine1(target));
  }

  function typeLine2(target: string) {
    if (line2.length >= target.length) {
      phase = 'dwell';
      const [a, b] = pairs()[pairIndex];
      options.onPhraseComplete?.(`${a} ${b}`);
      emit('line2', true);
      wait(HEADLINE_TIMING.dwellMs, () => {
        phase = 'delete2';
        emit('line2', false);
        deleteLine2();
      });
      return;
    }
    line2 = target.slice(0, line2.length + 1);
    emit('line2', false);
    wait(HEADLINE_TIMING.typeMs, () => typeLine2(target));
  }

  function deleteLine2() {
    if (!line2.length) {
      phase = 'delete1';
      emit('line1', false);
      deleteLine1();
      return;
    }
    line2 = line2.slice(0, -1);
    emit('line2', false);
    wait(HEADLINE_TIMING.deleteMs, deleteLine2);
  }

  function deleteLine1() {
    if (!line1.length) {
      phase = 'gap';
      emit(null, false);
      wait(HEADLINE_TIMING.gapMs, () => {
        pairIndex = (pairIndex + 1) % pairs().length;
        startPair();
      });
      return;
    }
    line1 = line1.slice(0, -1);
    emit('line1', false);
    wait(HEADLINE_TIMING.deleteMs, deleteLine1);
  }

  function resumeFromPause() {
    if (!running || options.isFrozen() || options.isHidden()) return;
    if (phase === 'type1') {
      const [target1] = pairs()[pairIndex];
      if (!line1 && !line2) startPair();
      else typeLine1(target1);
      return;
    }
    if (phase === 'pause') {
      wait(HEADLINE_TIMING.afterLine1Ms, () => {
        const [, target2] = pairs()[pairIndex];
        phase = 'type2';
        emit('line2', false);
        typeLine2(target2);
      });
      return;
    }
    if (phase === 'type2') {
      const [, target2] = pairs()[pairIndex];
      typeLine2(target2);
      return;
    }
    if (phase === 'dwell') {
      emit('line2', true);
      wait(HEADLINE_TIMING.dwellMs, () => {
        phase = 'delete2';
        emit('line2', false);
        deleteLine2();
      });
      return;
    }
    if (phase === 'delete2') {
      deleteLine2();
      return;
    }
    if (phase === 'delete1') {
      deleteLine1();
      return;
    }
    if (phase === 'gap') {
      wait(HEADLINE_TIMING.gapMs, () => {
        pairIndex = (pairIndex + 1) % pairs().length;
        startPair();
      });
    }
  }

  function showSettledPair(index = 0) {
    const [a, b] = pairs()[index];
    pairIndex = index;
    line1 = a;
    line2 = b;
    phase = 'dwell';
    emit('line2', true);
  }

  /** First paint stays on settled pair #1; motion then dwells and cycles. */
  function start() {
    running = true;
    if (options.isFrozen()) {
      freeze();
      return;
    }
    showSettledPair(0);
    options.onPhraseComplete?.(`${line1} ${line2}`);
    wait(HEADLINE_TIMING.dwellMs, () => {
      phase = 'delete2';
      emit('line2', false);
      deleteLine2();
    });
  }

  function sync() {
    if (!running) return;
    clear();
    if (options.isFrozen()) {
      freeze();
      return;
    }
    if (options.isHidden()) {
      emit(
        phase === 'dwell' || phase === 'type2' || phase === 'delete2'
          ? 'line2'
          : phase === 'gap' || phase === 'frozen' || (!line1 && !line2)
            ? null
            : 'line1',
        phase === 'dwell',
      );
      return;
    }
    if (phase === 'frozen') {
      start();
      return;
    }
    resumeFromPause();
  }

  return {
    start,
    sync,
    stop() {
      running = false;
      clear();
    },
  };
}
