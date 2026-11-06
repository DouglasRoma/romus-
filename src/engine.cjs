/* Image Atlas: vault-local image boards. TextFileView owns board persistence; Markdown notes
 * remain native files. Images use normalized pins; explicitly opened websites use DOM anchors.
 * Web cards retain their guests across board updates. Scene movement updates geometry once per frame. */
const { Plugin, TextFileView, Modal, SuggestModal, Menu, Notice, MarkdownRenderer, Component, ItemView, Platform, normalizePath, setIcon, parseYaml } = require('obsidian');
const VIEW = 'image-atlas-board';
const ROOT = 'Image Atlas';
const COLORS = ['#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#fb7185'];
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const clone = value => JSON.parse(JSON.stringify(value));
const finite = value => typeof value === 'number' && Number.isFinite(value);
const namePart = value => String(value).replace(/[\\/:*?"<>|#\[\]\r\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100) || 'Sem título';
const emptyBoard = title => ({ version: 1, title, indexPath: '', nodes: [], edges: [], camera: { x: 80, y: 70, z: 1 } });
const safeUrl = raw => { try { const url = new URL(raw); return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; } };

// Bundled offline: ts-fsrs 5.4.2 (MIT), open-spaced-repetition. See vendor/ts-fsrs-LICENSE.
const FSRS_ENGINE = (() => { const exports = {}; const module = { exports };
'use strict';

class FSRSError extends Error {
  constructor(message = "FSRS Error") {
    super(message);
    this.name = "FSRSError";
    Error.captureStackTrace?.(this, FSRSError);
  }
}
class FSRSValidationError extends FSRSError {
  constructor(message) {
    super(message);
    this.name = "FSRSValidationError";
    Error.captureStackTrace?.(this, FSRSValidationError);
  }
}

var State = /* @__PURE__ */ ((State2) => {
  State2[State2["New"] = 0] = "New";
  State2[State2["Learning"] = 1] = "Learning";
  State2[State2["Review"] = 2] = "Review";
  State2[State2["Relearning"] = 3] = "Relearning";
  return State2;
})(State || {});
var Rating = /* @__PURE__ */ ((Rating2) => {
  Rating2[Rating2["Manual"] = 0] = "Manual";
  Rating2[Rating2["Again"] = 1] = "Again";
  Rating2[Rating2["Hard"] = 2] = "Hard";
  Rating2[Rating2["Good"] = 3] = "Good";
  Rating2[Rating2["Easy"] = 4] = "Easy";
  return Rating2;
})(Rating || {});

class TypeConvert {
  static card(card) {
    return {
      ...card,
      state: TypeConvert.state(card.state),
      due: TypeConvert.time(card.due),
      last_review: card.last_review ? TypeConvert.time(card.last_review) : void 0
    };
  }
  static rating(value) {
    if (typeof value === "string") {
      const firstLetter = value.charAt(0).toUpperCase();
      const restOfString = value.slice(1).toLowerCase();
      const ret = Rating[`${firstLetter}${restOfString}`];
      if (ret === void 0) {
        throw new FSRSValidationError(`Invalid rating:[${value}]`);
      }
      return ret;
    } else if (typeof value === "number") {
      return value;
    }
    throw new FSRSValidationError(`Invalid rating:[${value}]`);
  }
  static state(value) {
    if (typeof value === "string") {
      const firstLetter = value.charAt(0).toUpperCase();
      const restOfString = value.slice(1).toLowerCase();
      const ret = State[`${firstLetter}${restOfString}`];
      if (ret === void 0) {
        throw new FSRSValidationError(`Invalid state:[${value}]`);
      }
      return ret;
    } else if (typeof value === "number") {
      return value;
    }
    throw new FSRSValidationError(`Invalid state:[${value}]`);
  }
  static time(value) {
    if (value instanceof Date) {
      return value;
    }
    const date = new Date(value);
    if (typeof value === "object" && value !== null && !Number.isNaN(Date.parse(value) || +date)) {
      return date;
    } else if (typeof value === "string") {
      const timestamp = Date.parse(value);
      if (!Number.isNaN(timestamp)) {
        return new Date(timestamp);
      } else {
        throw new FSRSValidationError(`Invalid date:[${value}]`);
      }
    } else if (typeof value === "number") {
      return new Date(value);
    }
    throw new FSRSValidationError(`Invalid date:[${value}]`);
  }
  static review_log(log) {
    return {
      ...log,
      due: TypeConvert.time(log.due),
      rating: TypeConvert.rating(log.rating),
      state: TypeConvert.state(log.state),
      review: TypeConvert.time(log.review)
    };
  }
}

/* istanbul ignore next -- @preserve */
Date.prototype.scheduler = function(t, isDay) {
  return date_scheduler(this, t, isDay);
};
/* istanbul ignore next -- @preserve */
Date.prototype.diff = function(pre, unit) {
  return date_diff(this, pre, unit);
};
/* istanbul ignore next -- @preserve */
Date.prototype.format = function() {
  return formatDate(this);
};
/* istanbul ignore next -- @preserve */
Date.prototype.dueFormat = function(last_review, unit, timeUnit) {
  return show_diff_message(this, last_review, unit, timeUnit);
};
function date_scheduler(now, t, isDay) {
  return new Date(
    isDay ? TypeConvert.time(now).getTime() + t * 24 * 60 * 60 * 1e3 : TypeConvert.time(now).getTime() + t * 60 * 1e3
  );
}
function date_diff(now, pre, unit) {
  if (!now || !pre) {
    throw new FSRSValidationError("Invalid date");
  }
  const diff = TypeConvert.time(now).getTime() - TypeConvert.time(pre).getTime();
  let r = 0;
  switch (unit) {
    case "days":
      r = Math.floor(diff / (24 * 60 * 60 * 1e3));
      break;
    case "minutes":
      r = Math.floor(diff / (60 * 1e3));
      break;
  }
  return r;
}
function formatDate(dateInput) {
  const date = TypeConvert.time(dateInput);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return `${year}-${padZero(month)}-${padZero(day)} ${padZero(hours)}:${padZero(
    minutes
  )}:${padZero(seconds)}`;
}
function padZero(num) {
  return num < 10 ? `0${num}` : `${num}`;
}
const TIMEUNIT = [60, 60, 24, 31, 12];
const TIMEUNITFORMAT = ["second", "min", "hour", "day", "month", "year"];
function show_diff_message(due, last_review, unit, timeUnit = TIMEUNITFORMAT) {
  due = TypeConvert.time(due);
  last_review = TypeConvert.time(last_review);
  if (timeUnit.length !== TIMEUNITFORMAT.length) {
    timeUnit = TIMEUNITFORMAT;
  }
  let diff = due.getTime() - last_review.getTime();
  let i = 0;
  diff /= 1e3;
  for (i = 0; i < TIMEUNIT.length; i++) {
    if (diff < TIMEUNIT[i]) {
      break;
    } else {
      diff /= TIMEUNIT[i];
    }
  }
  return `${Math.floor(diff)}${unit ? timeUnit[i] : ""}`;
}
/* istanbul ignore next -- @preserve */
function fixDate(value) {
  return TypeConvert.time(value);
}
/* istanbul ignore next -- @preserve */
function fixState(value) {
  return TypeConvert.state(value);
}
/* istanbul ignore next -- @preserve */
function fixRating(value) {
  return TypeConvert.rating(value);
}
const Grades = Object.freeze([
  Rating.Again,
  Rating.Hard,
  Rating.Good,
  Rating.Easy
]);
const FUZZ_RANGES = [
  {
    start: 2.5,
    end: 7,
    factor: 0.15
  },
  {
    start: 7,
    end: 20,
    factor: 0.1
  },
  {
    start: 20,
    end: Infinity,
    factor: 0.05
  }
];
function get_fuzz_range(interval, elapsed_days, maximum_interval) {
  let delta = 1;
  for (const range of FUZZ_RANGES) {
    delta += range.factor * Math.max(Math.min(interval, range.end) - range.start, 0);
  }
  interval = Math.min(interval, maximum_interval);
  let min_ivl = Math.max(2, Math.round(interval - delta));
  const max_ivl = Math.min(Math.round(interval + delta), maximum_interval);
  if (interval > elapsed_days) {
    min_ivl = Math.max(min_ivl, elapsed_days + 1);
  }
  min_ivl = Math.min(min_ivl, max_ivl);
  return { min_ivl, max_ivl };
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function roundTo(num, decimals) {
  const factor = 10 ** decimals;
  return Math.round(num * factor) / factor;
}
function dateDiffInDays(last, cur) {
  const utc1 = Date.UTC(
    last.getUTCFullYear(),
    last.getUTCMonth(),
    last.getUTCDate()
  );
  const utc2 = Date.UTC(
    cur.getUTCFullYear(),
    cur.getUTCMonth(),
    cur.getUTCDate()
  );
  return Math.floor(
    (utc2 - utc1) / 864e5
    /** 1000 * 60 * 60 * 24*/
  );
}

const ConvertStepUnitToMinutes = (step) => {
  const unit = step.slice(-1);
  const value = parseInt(step.slice(0, -1), 10);
  if (Number.isNaN(value) || !Number.isFinite(value) || value < 0) {
    throw new FSRSValidationError(`Invalid step value: ${step}`);
  }
  switch (unit) {
    case "m":
      return value;
    case "h":
      return value * 60;
    case "d":
      return value * 1440;
    default:
      throw new FSRSValidationError(
        `Invalid step unit: ${step}, expected m/h/d`
      );
  }
};
const BasicLearningStepsStrategy = (params, state, cur_step) => {
  const learning_steps = state === State.Relearning || state === State.Review ? params.relearning_steps : params.learning_steps;
  const steps_length = learning_steps.length;
  if (steps_length === 0 || cur_step >= steps_length) return {};
  const firstStep = learning_steps[0];
  const toMinutes = ConvertStepUnitToMinutes;
  const getAgainInterval = () => {
    return toMinutes(firstStep);
  };
  const getHardInterval = () => {
    if (steps_length === 1) return Math.round(toMinutes(firstStep) * 1.5);
    const nextStep = learning_steps[1];
    return Math.round((toMinutes(firstStep) + toMinutes(nextStep)) / 2);
  };
  const getStepInfo = (index) => {
    if (index < 0 || index >= steps_length) {
      return null;
    } else {
      return learning_steps[index];
    }
  };
  const getGoodMinutes = (step) => {
    return toMinutes(step);
  };
  const result = {};
  const step_info = getStepInfo(Math.max(0, cur_step));
  if (state === State.Review) {
    result[Rating.Again] = {
      scheduled_minutes: toMinutes(step_info),
      next_step: 0
    };
    return result;
  } else {
    result[Rating.Again] = {
      scheduled_minutes: getAgainInterval(),
      next_step: 0
    };
    result[Rating.Hard] = {
      scheduled_minutes: getHardInterval(),
      next_step: cur_step
    };
    const next_info = getStepInfo(cur_step + 1);
    if (next_info) {
      const nextMin = getGoodMinutes(next_info);
      if (nextMin) {
        result[Rating.Good] = {
          scheduled_minutes: Math.round(nextMin),
          next_step: cur_step + 1
        };
      }
    }
  }
  return result;
};

function DefaultInitSeedStrategy() {
  const time = this.review_time.getTime();
  const reps = this.current.reps;
  const mul = this.current.difficulty * this.current.stability;
  return `${time}_${reps}_${mul}`;
}
function GenSeedStrategyWithCardId(card_id_field) {
  return function() {
    const card_id = Reflect.get(this.current, card_id_field) ?? 0;
    const reps = this.current.reps;
    return String(card_id + reps || 0);
  };
}

var StrategyMode = /* @__PURE__ */ ((StrategyMode2) => {
  StrategyMode2["SCHEDULER"] = "Scheduler";
  StrategyMode2["LEARNING_STEPS"] = "LearningSteps";
  StrategyMode2["SEED"] = "Seed";
  return StrategyMode2;
})(StrategyMode || {});

class AbstractScheduler {
  last;
  current;
  review_time;
  next = /* @__PURE__ */ new Map();
  algorithm;
  strategies;
  elapsed_days = 0;
  // init
  constructor(card, now, algorithm, strategies) {
    this.algorithm = algorithm;
    this.last = TypeConvert.card(card);
    this.current = TypeConvert.card(card);
    this.review_time = TypeConvert.time(now);
    this.strategies = strategies;
    this.init();
  }
  checkGrade(grade) {
    if (!Number.isFinite(grade) || grade < 1 || grade > 4) {
      throw new FSRSValidationError(`Invalid grade "${grade}",expected 1-4`);
    }
  }
  init() {
    const { state, last_review } = this.current;
    let interval = 0;
    if (state !== State.New && last_review) {
      interval = dateDiffInDays(last_review, this.review_time);
    }
    this.current.last_review = this.review_time;
    this.elapsed_days = interval;
    this.current.elapsed_days = interval;
    this.current.reps += 1;
    let seed_strategy = DefaultInitSeedStrategy;
    if (this.strategies) {
      const custom_strategy = this.strategies.get(StrategyMode.SEED);
      if (custom_strategy) {
        seed_strategy = custom_strategy;
      }
    }
    this.algorithm.seed = seed_strategy.call(this);
  }
  preview() {
    return {
      [Rating.Again]: this.review(Rating.Again),
      [Rating.Hard]: this.review(Rating.Hard),
      [Rating.Good]: this.review(Rating.Good),
      [Rating.Easy]: this.review(Rating.Easy),
      [Symbol.iterator]: this.previewIterator.bind(this)
    };
  }
  *previewIterator() {
    for (const grade of Grades) {
      yield this.review(grade);
    }
  }
  review(grade) {
    const { state } = this.last;
    let item;
    this.checkGrade(grade);
    switch (state) {
      case State.New:
        item = this.newState(grade);
        break;
      case State.Learning:
      case State.Relearning:
        item = this.learningState(grade);
        break;
      case State.Review:
        item = this.reviewState(grade);
        break;
    }
    return item;
  }
  buildLog(rating) {
    const { last_review, due, elapsed_days } = this.last;
    return {
      rating,
      state: this.current.state,
      due: last_review || due,
      stability: this.current.stability,
      difficulty: this.current.difficulty,
      elapsed_days: this.elapsed_days,
      last_elapsed_days: elapsed_days,
      scheduled_days: this.current.scheduled_days,
      learning_steps: this.current.learning_steps,
      review: this.review_time
    };
  }
}

class Alea {
  c;
  s0;
  s1;
  s2;
  constructor(seed) {
    const mash = Mash();
    this.c = 1;
    this.s0 = mash(" ");
    this.s1 = mash(" ");
    this.s2 = mash(" ");
    if (seed == null) seed = Date.now();
    this.s0 -= mash(seed);
    if (this.s0 < 0) this.s0 += 1;
    this.s1 -= mash(seed);
    if (this.s1 < 0) this.s1 += 1;
    this.s2 -= mash(seed);
    if (this.s2 < 0) this.s2 += 1;
  }
  next() {
    const t = 2091639 * this.s0 + this.c * 23283064365386963e-26;
    this.s0 = this.s1;
    this.s1 = this.s2;
    this.c = t | 0;
    this.s2 = t - this.c;
    return this.s2;
  }
  set state(state) {
    this.c = state.c;
    this.s0 = state.s0;
    this.s1 = state.s1;
    this.s2 = state.s2;
  }
  get state() {
    return {
      c: this.c,
      s0: this.s0,
      s1: this.s1,
      s2: this.s2
    };
  }
}
function Mash() {
  let n = 4022871197;
  return function mash(data) {
    data = String(data);
    for (let i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      let h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 4294967296;
    }
    return (n >>> 0) * 23283064365386963e-26;
  };
}
function alea(seed) {
  const xg = new Alea(seed);
  const prng = () => xg.next();
  prng.int32 = () => xg.next() * 4294967296 | 0;
  prng.double = () => prng() + (prng() * 2097152 | 0) * 11102230246251565e-32;
  prng.state = () => xg.state;
  prng.importState = (state) => {
    xg.state = state;
    return prng;
  };
  return prng;
}

const version="5.4.2";

const default_request_retention = 0.9;
const default_maximum_interval = 36500;
const default_enable_fuzz = false;
const default_enable_short_term = true;
const default_learning_steps = Object.freeze([
  "1m",
  "10m"
]);
const default_relearning_steps = Object.freeze([
  "10m"
]);
const FSRSVersion = `v${version} using FSRS-6.0`;
const S_MIN = 1e-3;
const S_MAX = 36500;
const INIT_S_MAX = 100;
const FSRS5_DEFAULT_DECAY = 0.5;
const FSRS6_DEFAULT_DECAY = 0.1542;
const default_w = Object.freeze([
  0.212,
  1.2931,
  2.3065,
  8.2956,
  6.4133,
  0.8334,
  3.0194,
  1e-3,
  1.8722,
  0.1666,
  0.796,
  1.4835,
  0.0614,
  0.2629,
  1.6483,
  0.6014,
  1.8729,
  0.5425,
  0.0912,
  0.0658,
  FSRS6_DEFAULT_DECAY
]);
const W17_W18_Ceiling = 2;
const CLAMP_PARAMETERS = (w17_w18_ceiling, enable_short_term = default_enable_short_term) => [
  [S_MIN, INIT_S_MAX],
  [S_MIN, INIT_S_MAX],
  [S_MIN, INIT_S_MAX],
  [S_MIN, INIT_S_MAX],
  [1, 10],
  [1e-3, 4],
  [1e-3, 4],
  [1e-3, 0.75],
  [0, 4.5],
  [0, 0.8],
  [1e-3, 3.5],
  [1e-3, 5],
  [1e-3, 0.25],
  [1e-3, 0.9],
  [0, 4],
  [0, 1],
  [1, 6],
  [0, w17_w18_ceiling],
  [0, w17_w18_ceiling],
  [
    enable_short_term ? 0.01 : 0,
    0.8
  ],
  [0.1, 0.8]
];

const clipParameters = (parameters, numRelearningSteps, enableShortTerm = default_enable_short_term) => {
  const clip = CLAMP_PARAMETERS(W17_W18_Ceiling, enableShortTerm).slice(
    0,
    parameters.length
  );
  if (Math.max(0, numRelearningSteps) > 1) {
    const w11 = clamp(parameters[11] || 0, clip[11][0], clip[11][1]);
    const w13 = clamp(parameters[13] || 0, clip[13][0], clip[13][1]);
    const w14 = clamp(parameters[14] || 0, clip[14][0], clip[14][1]);
    const value = -(Math.log(w11) + Math.log(Math.pow(2, w13) - 1) + w14 * 0.3) / numRelearningSteps;
    const w17_w18_ceiling = clamp(
      roundTo(Math.sqrt(Math.max(value, 0)), 8),
      0.01,
      W17_W18_Ceiling
    );
    if (clip[17]) clip[17] = [clip[17][0], w17_w18_ceiling];
    if (clip[18]) clip[18] = [clip[18][0], w17_w18_ceiling];
  }
  return clip.map(
    ([min, max], index) => clamp(parameters[index] || 0, min, max)
  );
};
const checkParameters = (parameters) => {
  const invalid = parameters.find((param) => !Number.isFinite(param));
  if (invalid !== void 0) {
    throw new FSRSValidationError(
      `Non-finite or NaN value in parameters ${parameters}`
    );
  } else if (![17, 19, 21].includes(parameters.length)) {
    throw new FSRSValidationError(
      `Invalid parameter length: ${parameters.length}. Must be 17, 19 or 21 for FSRSv4, 5 and 6 respectively.`
    );
  }
  return parameters;
};
const migrateParameters = (parameters, numRelearningSteps = 0, enableShortTerm = default_enable_short_term) => {
  if (parameters === void 0) {
    return [...default_w];
  }
  switch (parameters.length) {
    case 21:
      return clipParameters(
        Array.from(parameters),
        numRelearningSteps,
        enableShortTerm
      );
    case 19:
      console.debug("[FSRS-6]auto fill w from 19 to 21 length");
      return clipParameters(
        Array.from(parameters),
        numRelearningSteps,
        enableShortTerm
      ).concat([0, FSRS5_DEFAULT_DECAY]);
    case 17: {
      const w = clipParameters(
        Array.from(parameters),
        numRelearningSteps,
        enableShortTerm
      );
      w[4] = +(w[5] * 2 + w[4]).toFixed(8);
      w[5] = +(Math.log(w[5] * 3 + 1) / 3).toFixed(8);
      w[6] = +(w[6] + 0.5).toFixed(8);
      console.debug("[FSRS-6]auto fill w from 17 to 21 length");
      return w.concat([0, 0, 0, FSRS5_DEFAULT_DECAY]);
    }
    default:
      console.warn("[FSRS]Invalid parameters length, using default parameters");
      return [...default_w];
  }
};
const generatorParameters = (props) => {
  const learning_steps = Array.isArray(props?.learning_steps) ? props.learning_steps : default_learning_steps;
  const relearning_steps = Array.isArray(props?.relearning_steps) ? props.relearning_steps : default_relearning_steps;
  const enable_short_term = props?.enable_short_term ?? default_enable_short_term;
  const w = migrateParameters(
    props?.w,
    relearning_steps.length,
    enable_short_term
  );
  return {
    request_retention: props?.request_retention || default_request_retention,
    maximum_interval: props?.maximum_interval || default_maximum_interval,
    w,
    enable_fuzz: props?.enable_fuzz ?? default_enable_fuzz,
    enable_short_term,
    learning_steps,
    relearning_steps
  };
};
function createEmptyCard(now, afterHandler) {
  const emptyCard = {
    due: now ? TypeConvert.time(now) : /* @__PURE__ */ new Date(),
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    learning_steps: 0,
    state: State.New,
    last_review: void 0
  };
  if (afterHandler && typeof afterHandler === "function") {
    return afterHandler(emptyCard);
  } else {
    return emptyCard;
  }
}

const computeDecayFactor = (decayOrParams) => {
  const decay = typeof decayOrParams === "number" ? -decayOrParams : -decayOrParams[20];
  const factor = Math.exp(Math.pow(decay, -1) * Math.log(0.9)) - 1;
  return { decay, factor: roundTo(factor, 8) };
};
function forgetting_curve(decayOrParams, elapsed_days, stability) {
  const { decay, factor } = computeDecayFactor(decayOrParams);
  return roundTo(Math.pow(1 + factor * elapsed_days / stability, decay), 8);
}
class FSRSAlgorithm {
  param;
  intervalModifier;
  _seed;
  constructor(params) {
    this.param = new Proxy(
      this.prepare_parameters(params),
      this.params_handler_proxy()
    );
    this.intervalModifier = this.calculate_interval_modifier(
      this.param.request_retention
    );
    this.forgetting_curve = forgetting_curve.bind(this, this.param.w);
  }
  get interval_modifier() {
    return this.intervalModifier;
  }
  set seed(seed) {
    this._seed = seed;
  }
  /**
   * @see https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm#fsrs-5
   *
   * The formula used is: $$I(r,s) = (r^{\frac{1}{DECAY}} - 1) / FACTOR \times s$$
   * @param request_retention 0<request_retention<=1,Requested retention rate
   * @throws {Error} Requested retention rate should be in the range (0,1]
   */
  calculate_interval_modifier(request_retention) {
    if (request_retention <= 0 || request_retention > 1) {
      throw new FSRSValidationError(
        "Requested retention rate should be in the range (0,1]"
      );
    }
    const { decay, factor } = computeDecayFactor(this.param.w);
    return roundTo((Math.pow(request_retention, 1 / decay) - 1) / factor, 8);
  }
  /**
   * Get the parameters of the algorithm.
   */
  get parameters() {
    return this.param;
  }
  /**
   * Set the parameters of the algorithm.
   * @param params Partial<FSRSParameters>
   */
  set parameters(params) {
    this.update_parameters(params);
  }
  params_handler_proxy() {
    const _this = this;
    return {
      set: function(target, prop, value) {
        if (prop === "request_retention" && Number.isFinite(value)) {
          _this.intervalModifier = _this.calculate_interval_modifier(
            Number(value)
          );
        } else if (prop === "w") {
          value = migrateParameters(
            value,
            target.relearning_steps.length,
            target.enable_short_term
          );
          value = clipParameters(
            Array.from(value),
            target.relearning_steps.length,
            target.enable_short_term
          );
          _this.forgetting_curve = forgetting_curve.bind(this, value);
          _this.intervalModifier = _this.calculate_interval_modifier(
            Number(target.request_retention)
          );
        }
        Reflect.set(target, prop, value);
        return true;
      }
    };
  }
  update_parameters(params) {
    const _params = this.prepare_parameters(params);
    for (const key in _params) {
      const paramKey = key;
      this.param[paramKey] = _params[paramKey];
    }
  }
  prepare_parameters = (params) => {
    const generated = generatorParameters(params);
    generated.w = clipParameters(
      Array.from(generated.w),
      generated.relearning_steps.length,
      generated.enable_short_term
    );
    return generated;
  };
  /**
     * The formula used is :
     * $$ S_0(G) = w_{G-1}$$
     * $$S_0 = \max \lbrace S_0,0.1\rbrace $$
  
     * @param g Grade (rating at Anki) [1.again,2.hard,3.good,4.easy]
     * @return Stability (interval when R=90%)
     */
  init_stability(g) {
    return Math.max(this.param.w[g - 1], 0.1);
  }
  /**
   * The formula used is :
   * $$D_0(G) = w_4 - e^{(G-1) \cdot w_5} + 1 $$
   * $$D_0 = \min \lbrace \max \lbrace D_0(G),1 \rbrace,10 \rbrace$$
   * where the $$D_0(1)=w_4$$ when the first rating is good.
   *
   * @param {Grade} g Grade (rating at Anki) [1.again,2.hard,3.good,4.easy]
   * @return {number} Difficulty $$D \in [1,10]$$
   */
  init_difficulty(g) {
    const w = this.param.w;
    const d = w[4] - Math.exp((g - 1) * w[5]) + 1;
    return roundTo(d, 8);
  }
  /**
   * If fuzzing is disabled or ivl is less than 2.5, it returns the original interval.
   * @param {number} ivl - The interval to be fuzzed.
   * @param {number} elapsed_days t days since the last review
   * @return {number} - The fuzzed interval.
   **/
  apply_fuzz(ivl, elapsed_days) {
    if (!this.param.enable_fuzz || ivl < 2.5) return Math.round(ivl);
    const generator = alea(this._seed);
    const fuzz_factor = generator();
    const { min_ivl, max_ivl } = get_fuzz_range(
      ivl,
      elapsed_days,
      this.param.maximum_interval
    );
    return Math.floor(fuzz_factor * (max_ivl - min_ivl + 1) + min_ivl);
  }
  /**
   *   @see The formula used is : {@link FSRSAlgorithm.calculate_interval_modifier}
   *   @param {number} s - Stability (interval when R=90%)
   *   @param {number} elapsed_days t days since the last review
   */
  next_interval(s, elapsed_days) {
    const newInterval = Math.min(
      Math.max(1, Math.round(s * this.intervalModifier)),
      this.param.maximum_interval
    );
    return this.apply_fuzz(newInterval, elapsed_days);
  }
  /**
   * @see https://github.com/open-spaced-repetition/fsrs4anki/issues/697
   */
  linear_damping(delta_d, old_d) {
    return roundTo(delta_d * (10 - old_d) / 9, 8);
  }
  /**
   * The formula used is :
   * $$\text{delta}_d = -w_6 \cdot (g - 3)$$
   * $$\text{next}_d = D + \text{linear damping}(\text{delta}_d , D)$$
   * $$D^\prime(D,R) = w_7 \cdot D_0(4) +(1 - w_7) \cdot \text{next}_d$$
   * @param {number} d Difficulty $$D \in [1,10]$$
   * @param {Grade} g Grade (rating at Anki) [1.again,2.hard,3.good,4.easy]
   * @return {number} $$\text{next}_D$$
   */
  next_difficulty(d, g) {
    const delta_d = -this.param.w[6] * (g - 3);
    const next_d = d + this.linear_damping(delta_d, d);
    return clamp(
      this.mean_reversion(this.init_difficulty(Rating.Easy), next_d),
      1,
      10
    );
  }
  /**
   * The formula used is :
   * $$w_7 \cdot \text{init} +(1 - w_7) \cdot \text{current}$$
   * @param {number} init $$w_2 : D_0(3) = w_2 + (R-2) \cdot w_3= w_2$$
   * @param {number} current $$D - w_6 \cdot (R - 2)$$
   * @return {number} difficulty
   */
  mean_reversion(init, current) {
    const w = this.param.w;
    return roundTo(w[7] * init + (1 - w[7]) * current, 8);
  }
  /**
   * The formula used is :
   * $$S^\prime_r(D,S,R,G) = S\cdot(e^{w_8}\cdot (11-D)\cdot S^{-w_9}\cdot(e^{w_{10}\cdot(1-R)}-1)\cdot w_{15}(\text{if} G=2) \cdot w_{16}(\text{if} G=4)+1)$$
   * @param {number} d Difficulty D \in [1,10]
   * @param {number} s Stability (interval when R=90%)
   * @param {number} r Retrievability (probability of recall)
   * @param {Grade} g Grade (Rating[0.again,1.hard,2.good,3.easy])
   * @return {number} S^\prime_r new stability after recall
   */
  next_recall_stability(d, s, r, g) {
    const w = this.param.w;
    const hard_penalty = Rating.Hard === g ? w[15] : 1;
    const easy_bound = Rating.Easy === g ? w[16] : 1;
    return roundTo(
      clamp(
        s * (1 + Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp((1 - r) * w[10]) - 1) * hard_penalty * easy_bound),
        S_MIN,
        36500
      ),
      8
    );
  }
  /**
   * The formula used is :
   * $$S^\prime_f(D,S,R) = w_{11}\cdot D^{-w_{12}}\cdot ((S+1)^{w_{13}}-1) \cdot e^{w_{14}\cdot(1-R)}$$
   * enable_short_term = true : $$S^\prime_f \in \min \lbrace \max \lbrace S^\prime_f,0.01\rbrace, \frac{S}{e^{w_{17} \cdot w_{18}}} \rbrace$$
   * enable_short_term = false : $$S^\prime_f \in \min \lbrace \max \lbrace S^\prime_f,0.01\rbrace, S \rbrace$$
   * @param {number} d Difficulty D \in [1,10]
   * @param {number} s Stability (interval when R=90%)
   * @param {number} r Retrievability (probability of recall)
   * @return {number} S^\prime_f new stability after forgetting
   */
  next_forget_stability(d, s, r) {
    const w = this.param.w;
    return roundTo(
      clamp(
        w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp((1 - r) * w[14]),
        S_MIN,
        36500
      ),
      8
    );
  }
  /**
   * The formula used is :
   * $$S^\prime_s(S,G) = S \cdot e^{w_{17} \cdot (G-3+w_{18})}$$
   * @param {number} s Stability (interval when R=90%)
   * @param {Grade} g Grade (Rating[0.again,1.hard,2.good,3.easy])
   */
  next_short_term_stability(s, g) {
    const w = this.param.w;
    const sinc = Math.pow(s, -w[19]) * Math.exp(w[17] * (g - 3 + w[18]));
    const maskedSinc = g >= Rating.Hard ? Math.max(sinc, 1) : sinc;
    return roundTo(clamp(s * maskedSinc, S_MIN, 36500), 8);
  }
  /**
   * The formula used is :
   * $$R(t,S) = (1 + \text{FACTOR} \times \frac{t}{9 \cdot S})^{\text{DECAY}}$$
   * @param {number} elapsed_days t days since the last review
   * @param {number} stability Stability (interval when R=90%)
   * @return {number} r Retrievability (probability of recall)
   */
  forgetting_curve;
  /**
   * Calculates the next state of memory based on the current state, time elapsed, and grade.
   *
   * @param memory_state - The current state of memory, which can be null.
   * @param t - The time elapsed since the last review.
   * @param {Rating} g Grade (Rating[0.Manual,1.Again,2.Hard,3.Good,4.Easy])
   * @param r - Optional retrievability value. If not provided, it will be calculated.
   * @returns The next state of memory with updated difficulty and stability.
   */
  next_state(memory_state, t, g, r) {
    const { difficulty: d, stability: s } = memory_state ?? {
      difficulty: 0,
      stability: 0
    };
    if (t < 0) {
      throw new FSRSValidationError(`Invalid delta_t "${t}"`);
    }
    if (g < 0 || g > 4) {
      throw new FSRSValidationError(`Invalid grade "${g}"`);
    }
    if (d === 0 && s === 0) {
      return {
        difficulty: clamp(this.init_difficulty(g), 1, 10),
        stability: this.init_stability(g)
      };
    }
    if (g === 0) {
      return {
        difficulty: d,
        stability: s
      };
    }
    if (d < 1 || s < S_MIN) {
      throw new FSRSValidationError(
        `Invalid memory state { difficulty: ${d}, stability: ${s} }`
      );
    }
    const w = this.param.w;
    r = typeof r === "number" ? r : this.forgetting_curve(t, s);
    let new_s;
    if (t === 0 && this.param.enable_short_term) {
      new_s = this.next_short_term_stability(s, g);
    } else if (g === 1) {
      const s_after_fail = this.next_forget_stability(d, s, r);
      let [w_17, w_18] = [0, 0];
      if (this.param.enable_short_term) {
        w_17 = w[17];
        w_18 = w[18];
      }
      const next_s_min = s / Math.exp(w_17 * w_18);
      new_s = clamp(roundTo(next_s_min, 8), S_MIN, s_after_fail);
    } else {
      new_s = this.next_recall_stability(d, s, r, g);
    }
    const new_d = this.next_difficulty(d, g);
    return { difficulty: new_d, stability: new_s };
  }
}

class BasicScheduler extends AbstractScheduler {
  learningStepsStrategy;
  constructor(card, now, algorithm, strategies) {
    super(card, now, algorithm, strategies);
    let learningStepStrategy = BasicLearningStepsStrategy;
    if (this.strategies) {
      const custom_strategy = this.strategies.get(StrategyMode.LEARNING_STEPS);
      if (custom_strategy) {
        learningStepStrategy = custom_strategy;
      }
    }
    this.learningStepsStrategy = learningStepStrategy;
  }
  getLearningInfo(card, grade) {
    const parameters = this.algorithm.parameters;
    card.learning_steps = card.learning_steps || 0;
    const steps_strategy = this.learningStepsStrategy(
      parameters,
      card.state,
      card.learning_steps
    );
    const scheduled_minutes = Math.max(
      0,
      steps_strategy[grade]?.scheduled_minutes ?? 0
    );
    const next_steps = Math.max(0, steps_strategy[grade]?.next_step ?? 0);
    return {
      scheduled_minutes,
      next_steps
    };
  }
  /**
   * @description This function applies the learning steps based on the current card's state and grade.
   */
  applyLearningSteps(nextCard, grade, to_state) {
    const { scheduled_minutes, next_steps } = this.getLearningInfo(
      this.current,
      grade
    );
    if (scheduled_minutes > 0 && scheduled_minutes < 1440) {
      nextCard.learning_steps = next_steps;
      nextCard.scheduled_days = 0;
      nextCard.state = to_state;
      nextCard.due = date_scheduler(
        this.review_time,
        Math.round(scheduled_minutes),
        false
        /** true:days false: minute */
      );
    } else {
      nextCard.state = State.Review;
      if (scheduled_minutes >= 1440) {
        nextCard.learning_steps = next_steps;
        nextCard.due = date_scheduler(
          this.review_time,
          Math.round(scheduled_minutes),
          false
          /** true:days false: minute */
        );
        nextCard.scheduled_days = Math.floor(scheduled_minutes / 1440);
      } else {
        nextCard.learning_steps = 0;
        const interval = this.algorithm.next_interval(
          nextCard.stability,
          this.elapsed_days
        );
        nextCard.scheduled_days = interval;
        nextCard.due = date_scheduler(this.review_time, interval, true);
      }
    }
  }
  newState(grade) {
    const exist = this.next.get(grade);
    if (exist) {
      return exist;
    }
    const next = this.next_ds(this.elapsed_days, grade);
    this.applyLearningSteps(next, grade, State.Learning);
    const item = {
      card: next,
      log: this.buildLog(grade)
    };
    this.next.set(grade, item);
    return item;
  }
  learningState(grade) {
    const exist = this.next.get(grade);
    if (exist) {
      return exist;
    }
    const next = this.next_ds(this.elapsed_days, grade);
    this.applyLearningSteps(
      next,
      grade,
      this.last.state
      /** Learning or Relearning */
    );
    const item = {
      card: next,
      log: this.buildLog(grade)
    };
    this.next.set(grade, item);
    return item;
  }
  reviewState(grade) {
    const exist = this.next.get(grade);
    if (exist) {
      return exist;
    }
    const interval = this.elapsed_days;
    const retrievability = this.algorithm.forgetting_curve(
      interval,
      this.current.stability
    );
    const next_again = this.next_ds(interval, Rating.Again, retrievability);
    const next_hard = this.next_ds(interval, Rating.Hard, retrievability);
    const next_good = this.next_ds(interval, Rating.Good, retrievability);
    const next_easy = this.next_ds(interval, Rating.Easy, retrievability);
    this.next_interval(next_hard, next_good, next_easy, interval);
    this.next_state(next_hard, next_good, next_easy);
    this.applyLearningSteps(next_again, Rating.Again, State.Relearning);
    next_again.lapses += 1;
    const item_again = {
      card: next_again,
      log: this.buildLog(Rating.Again)
    };
    const item_hard = {
      card: next_hard,
      log: super.buildLog(Rating.Hard)
    };
    const item_good = {
      card: next_good,
      log: super.buildLog(Rating.Good)
    };
    const item_easy = {
      card: next_easy,
      log: super.buildLog(Rating.Easy)
    };
    this.next.set(Rating.Again, item_again);
    this.next.set(Rating.Hard, item_hard);
    this.next.set(Rating.Good, item_good);
    this.next.set(Rating.Easy, item_easy);
    return this.next.get(grade);
  }
  /**
   * Review next_ds
   */
  next_ds(t, g, r) {
    const next_state = this.algorithm.next_state(
      {
        difficulty: this.current.difficulty,
        stability: this.current.stability
      },
      t,
      g,
      r
    );
    const card = TypeConvert.card(this.current);
    card.difficulty = next_state.difficulty;
    card.stability = next_state.stability;
    return card;
  }
  /**
   * Review next_interval
   */
  next_interval(next_hard, next_good, next_easy, interval) {
    let hard_interval, good_interval;
    hard_interval = this.algorithm.next_interval(next_hard.stability, interval);
    good_interval = this.algorithm.next_interval(next_good.stability, interval);
    hard_interval = Math.min(hard_interval, good_interval);
    good_interval = Math.max(good_interval, hard_interval + 1);
    const easy_interval = Math.max(
      this.algorithm.next_interval(next_easy.stability, interval),
      good_interval + 1
    );
    next_hard.scheduled_days = hard_interval;
    next_hard.due = date_scheduler(this.review_time, hard_interval, true);
    next_good.scheduled_days = good_interval;
    next_good.due = date_scheduler(this.review_time, good_interval, true);
    next_easy.scheduled_days = easy_interval;
    next_easy.due = date_scheduler(this.review_time, easy_interval, true);
  }
  /**
   * Review next_state
   */
  next_state(next_hard, next_good, next_easy) {
    next_hard.state = State.Review;
    next_hard.learning_steps = 0;
    next_good.state = State.Review;
    next_good.learning_steps = 0;
    next_easy.state = State.Review;
    next_easy.learning_steps = 0;
  }
}

class LongTermScheduler extends AbstractScheduler {
  newState(grade) {
    const exist = this.next.get(grade);
    if (exist) {
      return exist;
    }
    this.current.scheduled_days = 0;
    this.current.elapsed_days = 0;
    const first_interval = 0;
    const next_again = this.next_ds(first_interval, Rating.Again);
    const next_hard = this.next_ds(first_interval, Rating.Hard);
    const next_good = this.next_ds(first_interval, Rating.Good);
    const next_easy = this.next_ds(first_interval, Rating.Easy);
    this.next_interval(
      next_again,
      next_hard,
      next_good,
      next_easy,
      first_interval
    );
    this.next_state(next_again, next_hard, next_good, next_easy);
    this.update_next(next_again, next_hard, next_good, next_easy);
    return this.next.get(grade);
  }
  next_ds(t, g, r) {
    const next_state = this.algorithm.next_state(
      {
        difficulty: this.current.difficulty,
        stability: this.current.stability
      },
      t,
      g,
      r
    );
    const card = TypeConvert.card(this.current);
    card.difficulty = next_state.difficulty;
    card.stability = next_state.stability;
    return card;
  }
  /**
   * @see https://github.com/open-spaced-repetition/ts-fsrs/issues/98#issuecomment-2241923194
   */
  learningState(grade) {
    return this.reviewState(grade);
  }
  reviewState(grade) {
    const exist = this.next.get(grade);
    if (exist) {
      return exist;
    }
    const interval = this.elapsed_days;
    const retrievability = this.algorithm.forgetting_curve(
      interval,
      this.current.stability
    );
    const next_again = this.next_ds(interval, Rating.Again, retrievability);
    const next_hard = this.next_ds(interval, Rating.Hard, retrievability);
    const next_good = this.next_ds(interval, Rating.Good, retrievability);
    const next_easy = this.next_ds(interval, Rating.Easy, retrievability);
    this.next_interval(next_again, next_hard, next_good, next_easy, interval);
    this.next_state(next_again, next_hard, next_good, next_easy);
    next_again.lapses += 1;
    this.update_next(next_again, next_hard, next_good, next_easy);
    return this.next.get(grade);
  }
  /**
   * Review/New next_interval
   */
  next_interval(next_again, next_hard, next_good, next_easy, interval) {
    let again_interval, hard_interval, good_interval, easy_interval;
    again_interval = this.algorithm.next_interval(
      next_again.stability,
      interval
    );
    hard_interval = this.algorithm.next_interval(next_hard.stability, interval);
    good_interval = this.algorithm.next_interval(next_good.stability, interval);
    easy_interval = this.algorithm.next_interval(next_easy.stability, interval);
    again_interval = Math.min(again_interval, hard_interval);
    hard_interval = Math.max(hard_interval, again_interval + 1);
    good_interval = Math.max(good_interval, hard_interval + 1);
    easy_interval = Math.max(easy_interval, good_interval + 1);
    next_again.scheduled_days = again_interval;
    next_again.due = date_scheduler(this.review_time, again_interval, true);
    next_hard.scheduled_days = hard_interval;
    next_hard.due = date_scheduler(this.review_time, hard_interval, true);
    next_good.scheduled_days = good_interval;
    next_good.due = date_scheduler(this.review_time, good_interval, true);
    next_easy.scheduled_days = easy_interval;
    next_easy.due = date_scheduler(this.review_time, easy_interval, true);
  }
  /**
   * Review/New next_state
   */
  next_state(next_again, next_hard, next_good, next_easy) {
    next_again.state = State.Review;
    next_again.learning_steps = 0;
    next_hard.state = State.Review;
    next_hard.learning_steps = 0;
    next_good.state = State.Review;
    next_good.learning_steps = 0;
    next_easy.state = State.Review;
    next_easy.learning_steps = 0;
  }
  update_next(next_again, next_hard, next_good, next_easy) {
    const item_again = {
      card: next_again,
      log: this.buildLog(Rating.Again)
    };
    const item_hard = {
      card: next_hard,
      log: super.buildLog(Rating.Hard)
    };
    const item_good = {
      card: next_good,
      log: super.buildLog(Rating.Good)
    };
    const item_easy = {
      card: next_easy,
      log: super.buildLog(Rating.Easy)
    };
    this.next.set(Rating.Again, item_again);
    this.next.set(Rating.Hard, item_hard);
    this.next.set(Rating.Good, item_good);
    this.next.set(Rating.Easy, item_easy);
  }
}

class Reschedule {
  fsrs;
  /**
   * Creates an instance of the `Reschedule` class.
   * @param fsrs - An instance of the FSRS class used for scheduling.
   */
  constructor(fsrs) {
    this.fsrs = fsrs;
  }
  /**
   * Replays a review for a card and determines the next review date based on the given rating.
   * @param card - The card being reviewed.
   * @param reviewed - The date the card was reviewed.
   * @param rating - The grade given to the card during the review.
   * @returns A `RecordLogItem` containing the updated card and review log.
   */
  replay(card, reviewed, rating) {
    return this.fsrs.next(card, reviewed, rating);
  }
  /**
   * Processes a manual review for a card, allowing for custom state, stability, difficulty, and due date.
   * @param card - The card being reviewed.
   * @param state - The state of the card after the review.
   * @param reviewed - The date the card was reviewed.
   * @param elapsed_days - The number of days since the last review.
   * @param stability - (Optional) The stability of the card.
   * @param difficulty - (Optional) The difficulty of the card.
   * @param due - (Optional) The due date for the next review.
   * @returns A `RecordLogItem` containing the updated card and review log.
   * @throws Will throw an error if the state or due date is not provided when required.
   */
  handleManualRating(card, state, reviewed, elapsed_days, stability, difficulty, due) {
    if (typeof state === "undefined") {
      throw new FSRSValidationError(
        "reschedule: state is required for manual rating"
      );
    }
    let log;
    let next_card;
    if (state === State.New) {
      log = {
        rating: Rating.Manual,
        state,
        due: due ?? reviewed,
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days,
        last_elapsed_days: card.elapsed_days,
        scheduled_days: card.scheduled_days,
        learning_steps: card.learning_steps,
        review: reviewed
      };
      next_card = createEmptyCard(reviewed);
      next_card.last_review = reviewed;
    } else {
      if (typeof due === "undefined") {
        throw new FSRSValidationError(
          "reschedule: due is required for manual rating"
        );
      }
      const scheduled_days = date_diff(due, reviewed, "days");
      log = {
        rating: Rating.Manual,
        state: card.state,
        due: card.last_review || card.due,
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days,
        last_elapsed_days: card.elapsed_days,
        scheduled_days: card.scheduled_days,
        learning_steps: card.learning_steps,
        review: reviewed
      };
      next_card = {
        ...card,
        state,
        due,
        last_review: reviewed,
        stability: stability || card.stability,
        difficulty: difficulty || card.difficulty,
        elapsed_days,
        scheduled_days,
        reps: card.reps + 1
      };
    }
    return { card: next_card, log };
  }
  /**
   * Reschedules a card based on its review history.
   *
   * @param current_card - The card to be rescheduled.
   * @param reviews - An array of review history objects.
   * @returns An array of record log items representing the rescheduling process.
   */
  reschedule(current_card, reviews) {
    const collections = [];
    let cur_card = createEmptyCard(current_card.due);
    for (const review of reviews) {
      let item;
      review.review = TypeConvert.time(review.review);
      if (review.rating === Rating.Manual) {
        let interval = 0;
        if (cur_card.state !== State.New && cur_card.last_review) {
          interval = date_diff(review.review, cur_card.last_review, "days");
        }
        item = this.handleManualRating(
          cur_card,
          review.state,
          review.review,
          interval,
          review.stability,
          review.difficulty,
          review.due ? TypeConvert.time(review.due) : void 0
        );
      } else {
        item = this.replay(cur_card, review.review, review.rating);
      }
      collections.push(item);
      cur_card = item.card;
    }
    return collections;
  }
  calculateManualRecord(current_card, now, record_log_item, update_memory) {
    if (!record_log_item) {
      return null;
    }
    const { card: reschedule_card, log } = record_log_item;
    const cur_card = TypeConvert.card(current_card);
    if (cur_card.due.getTime() === reschedule_card.due.getTime()) {
      return null;
    }
    cur_card.scheduled_days = date_diff(
      reschedule_card.due,
      cur_card.due,
      "days"
    );
    return this.handleManualRating(
      cur_card,
      reschedule_card.state,
      TypeConvert.time(now),
      log.elapsed_days,
      update_memory ? reschedule_card.stability : void 0,
      update_memory ? reschedule_card.difficulty : void 0,
      reschedule_card.due
    );
  }
}

function applyAfterHandler(value, afterHandler) {
  return typeof afterHandler === "function" ? afterHandler(value) : value;
}
class FSRS extends FSRSAlgorithm {
  strategyHandler = /* @__PURE__ */ new Map();
  Scheduler;
  constructor(param) {
    super(param);
    const { enable_short_term } = this.parameters;
    this.Scheduler = enable_short_term ? BasicScheduler : LongTermScheduler;
  }
  params_handler_proxy() {
    const _this = this;
    return {
      set: function(target, prop, value) {
        if (prop === "request_retention" && Number.isFinite(value)) {
          _this.intervalModifier = _this.calculate_interval_modifier(
            Number(value)
          );
        } else if (prop === "enable_short_term") {
          _this.Scheduler = value === true ? BasicScheduler : LongTermScheduler;
        } else if (prop === "w") {
          value = migrateParameters(
            value,
            target.relearning_steps.length,
            target.enable_short_term
          );
          value = clipParameters(
            Array.from(value),
            target.relearning_steps.length,
            target.enable_short_term
          );
          _this.forgetting_curve = forgetting_curve.bind(this, value);
          _this.intervalModifier = _this.calculate_interval_modifier(
            Number(target.request_retention)
          );
        }
        Reflect.set(target, prop, value);
        return true;
      }
    };
  }
  useStrategy(mode, handler) {
    this.strategyHandler.set(mode, handler);
    return this;
  }
  clearStrategy(mode) {
    if (mode) {
      this.strategyHandler.delete(mode);
    } else {
      this.strategyHandler.clear();
    }
    return this;
  }
  getScheduler(card, now) {
    const schedulerStrategy = this.strategyHandler.get(
      StrategyMode.SCHEDULER
    );
    const Scheduler = schedulerStrategy || this.Scheduler;
    const instance = new Scheduler(card, now, this, this.strategyHandler);
    return instance;
  }
  /**
   * Display the collection of cards and logs for the four scenarios after scheduling the card at the current time.
   * @param card Card to be processed
   * @param now Current time or scheduled time
   * @param afterHandler Convert the result to another type. (Optional)
   * @example
   * ```typescript
   * const card: Card = createEmptyCard(new Date());
   * const f = fsrs();
   * const recordLog = f.repeat(card, new Date());
   * ```
   * @example
   * ```typescript
   * interface RevLogUnchecked
   *   extends Omit<ReviewLog, "due" | "review" | "state" | "rating"> {
   *   cid: string;
   *   due: Date | number;
   *   state: StateType;
   *   review: Date | number;
   *   rating: RatingType;
   * }
   *
   * interface RepeatRecordLog {
   *   card: CardUnChecked; //see method: createEmptyCard
   *   log: RevLogUnchecked;
   * }
   *
   * function repeatAfterHandler(recordLog: RecordLog) {
   *     const record: { [key in Grade]: RepeatRecordLog } = {} as {
   *       [key in Grade]: RepeatRecordLog;
   *     };
   *     for (const grade of Grades) {
   *       record[grade] = {
   *         card: {
   *           ...(recordLog[grade].card as Card & { cid: string }),
   *           due: recordLog[grade].card.due.getTime(),
   *           state: State[recordLog[grade].card.state] as StateType,
   *           last_review: recordLog[grade].card.last_review
   *             ? recordLog[grade].card.last_review!.getTime()
   *             : null,
   *         },
   *         log: {
   *           ...recordLog[grade].log,
   *           cid: (recordLog[grade].card as Card & { cid: string }).cid,
   *           due: recordLog[grade].log.due.getTime(),
   *           review: recordLog[grade].log.review.getTime(),
   *           state: State[recordLog[grade].log.state] as StateType,
   *           rating: Rating[recordLog[grade].log.rating] as RatingType,
   *         },
   *       };
   *     }
   *     return record;
   * }
   * const card: Card = createEmptyCard(new Date(), cardAfterHandler); //see method:  createEmptyCard
   * const f = fsrs();
   * const recordLog = f.repeat(card, new Date(), repeatAfterHandler);
   * ```
   */
  repeat(card, now, afterHandler) {
    const instance = this.getScheduler(card, now);
    const recordLog = instance.preview();
    return applyAfterHandler(recordLog, afterHandler);
  }
  /**
   * Display the collection of cards and logs for the card scheduled at the current time, after applying a specific grade rating.
   * @param card Card to be processed
   * @param now Current time or scheduled time
   * @param grade Rating of the review (Again, Hard, Good, Easy)
   * @param afterHandler Convert the result to another type. (Optional)
   * @example
   * ```typescript
   * const card: Card = createEmptyCard(new Date());
   * const f = fsrs();
   * const recordLogItem = f.next(card, new Date(), Rating.Again);
   * ```
   * @example
   * ```typescript
   * interface RevLogUnchecked
   *   extends Omit<ReviewLog, "due" | "review" | "state" | "rating"> {
   *   cid: string;
   *   due: Date | number;
   *   state: StateType;
   *   review: Date | number;
   *   rating: RatingType;
   * }
   *
   * interface NextRecordLog {
   *   card: CardUnChecked; //see method: createEmptyCard
   *   log: RevLogUnchecked;
   * }
   *
  function nextAfterHandler(recordLogItem: RecordLogItem) {
    const recordItem = {
      card: {
        ...(recordLogItem.card as Card & { cid: string }),
        due: recordLogItem.card.due.getTime(),
        state: State[recordLogItem.card.state] as StateType,
        last_review: recordLogItem.card.last_review
          ? recordLogItem.card.last_review!.getTime()
          : null,
      },
      log: {
        ...recordLogItem.log,
        cid: (recordLogItem.card as Card & { cid: string }).cid,
        due: recordLogItem.log.due.getTime(),
        review: recordLogItem.log.review.getTime(),
        state: State[recordLogItem.log.state] as StateType,
        rating: Rating[recordLogItem.log.rating] as RatingType,
      },
    };
    return recordItem
  }
   * const card: Card = createEmptyCard(new Date(), cardAfterHandler); //see method:  createEmptyCard
   * const f = fsrs();
   * const recordLogItem = f.repeat(card, new Date(), Rating.Again, nextAfterHandler);
   * ```
   */
  next(card, now, grade, afterHandler) {
    const instance = this.getScheduler(card, now);
    const g = TypeConvert.rating(grade);
    if (g === Rating.Manual) {
      throw new FSRSValidationError("Cannot review a manual rating");
    }
    const recordLogItem = instance.review(g);
    return applyAfterHandler(recordLogItem, afterHandler);
  }
  /**
   * Get the retrievability of the card
   * @param card  Card to be processed
   * @param now  Current time or scheduled time
   * @param format  default:true , Convert the result to another type. (Optional)
   * @returns  The retrievability of the card,if format is true, the result is a string, otherwise it is a number
   */
  get_retrievability(card, now, format = true) {
    const processedCard = TypeConvert.card(card);
    now = now ? TypeConvert.time(now) : /* @__PURE__ */ new Date();
    const t = processedCard.state !== State.New ? Math.max(date_diff(now, processedCard.last_review, "days"), 0) : 0;
    const r = processedCard.state !== State.New ? this.forgetting_curve(t, +processedCard.stability.toFixed(8)) : 0;
    return format ? `${(r * 100).toFixed(2)}%` : r;
  }
  /**
   *
   * @param card Card to be processed
   * @param log last review log
   * @param afterHandler Convert the result to another type. (Optional)
   * @example
   * ```typescript
   * const now = new Date();
   * const f = fsrs();
   * const emptyCardFormAfterHandler = createEmptyCard(now);
   * const repeatFormAfterHandler = f.repeat(emptyCardFormAfterHandler, now);
   * const { card, log } = repeatFormAfterHandler[Rating.Hard];
   * const rollbackFromAfterHandler = f.rollback(card, log);
   * ```
   *
   * @example
   * ```typescript
   * const now = new Date();
   * const f = fsrs();
   * const emptyCardFormAfterHandler = createEmptyCard(now, cardAfterHandler);  //see method: createEmptyCard
   * const repeatFormAfterHandler = f.repeat(emptyCardFormAfterHandler, now, repeatAfterHandler); //see method: fsrs.repeat()
   * const { card, log } = repeatFormAfterHandler[Rating.Hard];
   * const rollbackFromAfterHandler = f.rollback(card, log, cardAfterHandler);
   * ```
   */
  rollback(card, log, afterHandler) {
    const processedCard = TypeConvert.card(card);
    const processedLog = TypeConvert.review_log(log);
    if (processedLog.rating === Rating.Manual) {
      throw new FSRSValidationError("Cannot rollback a manual rating");
    }
    let last_due;
    let last_review;
    let last_lapses;
    switch (processedLog.state) {
      case State.New:
        last_due = processedLog.due;
        last_review = void 0;
        last_lapses = 0;
        break;
      case State.Learning:
      case State.Relearning:
      case State.Review:
        last_due = processedLog.review;
        last_review = processedLog.due;
        last_lapses = processedCard.lapses - (processedLog.rating === Rating.Again && processedLog.state === State.Review ? 1 : 0);
        break;
    }
    const prevCard = {
      ...processedCard,
      due: last_due,
      stability: processedLog.stability,
      difficulty: processedLog.difficulty,
      elapsed_days: processedLog.last_elapsed_days,
      scheduled_days: processedLog.scheduled_days,
      reps: Math.max(0, processedCard.reps - 1),
      lapses: Math.max(0, last_lapses),
      learning_steps: processedLog.learning_steps,
      state: processedLog.state,
      last_review
    };
    return applyAfterHandler(prevCard, afterHandler);
  }
  /**
   *
   * @param card Card to be processed
   * @param now Current time or scheduled time
   * @param reset_count Should the review count information(reps,lapses) be reset. (Optional)
   * @param afterHandler Convert the result to another type. (Optional)
   * @example
   * ```typescript
   * const now = new Date();
   * const f = fsrs();
   * const emptyCard = createEmptyCard(now);
   * const scheduling_cards = f.repeat(emptyCard, now);
   * const { card, log } = scheduling_cards[Rating.Hard];
   * const forgetCard = f.forget(card, new Date(), true);
   * ```
   *
   * @example
   * ```typescript
   * interface RepeatRecordLog {
   *   card: CardUnChecked; //see method: createEmptyCard
   *   log: RevLogUnchecked; //see method: fsrs.repeat()
   * }
   *
   * function forgetAfterHandler(recordLogItem: RecordLogItem): RepeatRecordLog {
   *     return {
   *       card: {
   *         ...(recordLogItem.card as Card & { cid: string }),
   *         due: recordLogItem.card.due.getTime(),
   *         state: State[recordLogItem.card.state] as StateType,
   *         last_review: recordLogItem.card.last_review
   *           ? recordLogItem.card.last_review!.getTime()
   *           : null,
   *       },
   *       log: {
   *         ...recordLogItem.log,
   *         cid: (recordLogItem.card as Card & { cid: string }).cid,
   *         due: recordLogItem.log.due.getTime(),
   *         review: recordLogItem.log.review.getTime(),
   *         state: State[recordLogItem.log.state] as StateType,
   *         rating: Rating[recordLogItem.log.rating] as RatingType,
   *       },
   *     };
   * }
   * const now = new Date();
   * const f = fsrs();
   * const emptyCardFormAfterHandler = createEmptyCard(now, cardAfterHandler); //see method:  createEmptyCard
   * const repeatFormAfterHandler = f.repeat(emptyCardFormAfterHandler, now, repeatAfterHandler); //see method: fsrs.repeat()
   * const { card } = repeatFormAfterHandler[Rating.Hard];
   * const forgetFromAfterHandler = f.forget(card, date_scheduler(now, 1, true), false, forgetAfterHandler);
   * ```
   */
  forget(card, now, reset_count = false, afterHandler) {
    const processedCard = TypeConvert.card(card);
    now = TypeConvert.time(now);
    const scheduled_days = processedCard.state === State.New ? 0 : date_diff(now, processedCard.due, "days");
    const forget_log = {
      rating: Rating.Manual,
      state: processedCard.state,
      due: processedCard.due,
      stability: processedCard.stability,
      difficulty: processedCard.difficulty,
      elapsed_days: 0,
      last_elapsed_days: processedCard.elapsed_days,
      scheduled_days,
      learning_steps: processedCard.learning_steps,
      review: now
    };
    const forget_card = {
      ...processedCard,
      due: now,
      stability: 0,
      difficulty: 0,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: reset_count ? 0 : processedCard.reps,
      lapses: reset_count ? 0 : processedCard.lapses,
      learning_steps: 0,
      state: State.New,
      last_review: processedCard.last_review
    };
    const recordLogItem = { card: forget_card, log: forget_log };
    return applyAfterHandler(recordLogItem, afterHandler);
  }
  /**
   * Reschedules the current card and returns the rescheduled collections and reschedule item.
   *
   * @template T - The type of the record log item.
   * @param {CardInput | Card} current_card - The current card to be rescheduled.
   * @param {Array<FSRSHistory>} reviews - The array of FSRSHistory objects representing the reviews.
   * @param {Partial<RescheduleOptions<T>>} options - The optional reschedule options.
   * @returns {IReschedule<T>} - The rescheduled collections and reschedule item.
   *
   * @example
   * ```typescript
   * const f = fsrs()
   * const grades: Grade[] = [Rating.Good, Rating.Good, Rating.Good, Rating.Good]
   * const reviews_at = [
   *   new Date(2024, 8, 13),
   *   new Date(2024, 8, 13),
   *   new Date(2024, 8, 17),
   *   new Date(2024, 8, 28),
   * ]
   *
   * const reviews: FSRSHistory[] = []
   * for (let i = 0; i < grades.length; i++) {
   *   reviews.push({
   *     rating: grades[i],
   *     review: reviews_at[i],
   *   })
   * }
   *
   * const results_short = scheduler.reschedule(
   *   createEmptyCard(),
   *   reviews,
   *   {
   *     skipManual: false,
   *   }
   * )
   * console.log(results_short)
   * ```
   */
  reschedule(current_card, reviews = [], options = {}) {
    const {
      recordLogHandler,
      reviewsOrderBy,
      skipManual = true,
      now = /* @__PURE__ */ new Date(),
      update_memory_state: updateMemoryState = false
    } = options;
    if (reviewsOrderBy && typeof reviewsOrderBy === "function") {
      reviews.sort(reviewsOrderBy);
    }
    if (skipManual) {
      reviews = reviews.filter((review) => review.rating !== Rating.Manual);
    }
    const rescheduleSvc = new Reschedule(this);
    const collections = rescheduleSvc.reschedule(
      options.first_card || createEmptyCard(),
      reviews
    );
    const len = collections.length;
    const cur_card = TypeConvert.card(current_card);
    const manual_item = rescheduleSvc.calculateManualRecord(
      cur_card,
      now,
      len ? collections[len - 1] : void 0,
      updateMemoryState
    );
    return {
      collections: typeof recordLogHandler === "function" ? collections.map(recordLogHandler) : collections,
      reschedule_item: manual_item ? applyAfterHandler(manual_item, recordLogHandler) : null
    };
  }
}
const fsrs = (params) => {
  return new FSRS(params || {});
};

exports.AbstractScheduler = AbstractScheduler;
exports.BasicLearningStepsStrategy = BasicLearningStepsStrategy;
exports.CLAMP_PARAMETERS = CLAMP_PARAMETERS;
exports.ConvertStepUnitToMinutes = ConvertStepUnitToMinutes;
exports.DefaultInitSeedStrategy = DefaultInitSeedStrategy;
exports.FSRS = FSRS;
exports.FSRS5_DEFAULT_DECAY = FSRS5_DEFAULT_DECAY;
exports.FSRS6_DEFAULT_DECAY = FSRS6_DEFAULT_DECAY;
exports.FSRSAlgorithm = FSRSAlgorithm;
exports.FSRSVersion = FSRSVersion;
exports.GenSeedStrategyWithCardId = GenSeedStrategyWithCardId;
exports.Grades = Grades;
exports.INIT_S_MAX = INIT_S_MAX;
exports.Rating = Rating;
exports.S_MAX = S_MAX;
exports.S_MIN = S_MIN;
exports.State = State;
exports.StrategyMode = StrategyMode;
exports.TypeConvert = TypeConvert;
exports.W17_W18_Ceiling = W17_W18_Ceiling;
exports.checkParameters = checkParameters;
exports.clamp = clamp;
exports.clipParameters = clipParameters;
exports.computeDecayFactor = computeDecayFactor;
exports.createEmptyCard = createEmptyCard;
exports.dateDiffInDays = dateDiffInDays;
exports.date_diff = date_diff;
exports.date_scheduler = date_scheduler;
exports.default_enable_fuzz = default_enable_fuzz;
exports.default_enable_short_term = default_enable_short_term;
exports.default_learning_steps = default_learning_steps;
exports.default_maximum_interval = default_maximum_interval;
exports.default_relearning_steps = default_relearning_steps;
exports.default_request_retention = default_request_retention;
exports.default_w = default_w;
exports.fixDate = fixDate;
exports.fixRating = fixRating;
exports.fixState = fixState;
exports.forgetting_curve = forgetting_curve;
exports.formatDate = formatDate;
exports.fsrs = fsrs;
exports.generatorParameters = generatorParameters;
exports.get_fuzz_range = get_fuzz_range;
exports.migrateParameters = migrateParameters;
exports.roundTo = roundTo;
exports.show_diff_message = show_diff_message;
module.exports = Object.assign(exports.default || {}, exports)


return module.exports; })();

/** Reject unsupported/corrupt board data without silently overwriting the original file. */
function parseBoard(raw) {
  const b = JSON.parse(raw);
  if (b?.version !== 1 || typeof b.title !== 'string' || typeof b.indexPath !== 'string' || !Array.isArray(b.nodes) || !Array.isArray(b.edges)) throw new Error('Formato de quadro inválido.');
  const ids = new Set();
  const flashIds = new Set();
  for (const n of b.nodes) {
    if (!n || !['image', 'note', 'web', 'mind', 'whiteboard'].includes(n.type) || typeof n.id !== 'string' || ids.has(n.id) || typeof n.path !== 'string' || ![n.x, n.y, n.w, n.h].every(finite) || n.w < 80 || n.h <= 0) throw new Error('Cartão inválido no quadro.');
    if (n.type === 'whiteboard' && !n.path.endsWith('.imageboard')) throw new Error('Referência de whiteboard inválida.');
    ids.add(n.id);
    if (n.visualIdentity !== undefined) {
      const identity = n.visualIdentity;
      if (!identity || typeof identity !== 'object' || Array.isArray(identity) || !['nodes', 'pins', 'edges', 'cards'].every(kind => identity[kind] && typeof identity[kind] === 'object' && !Array.isArray(identity[kind]) && Object.entries(identity[kind]).every(([key, value]) => key !== '__proto__' && key !== 'constructor' && key !== 'prototype' && typeof value === 'string'))) throw new Error('Identidade da ocorrência visual inválida.');
    }
    if (n.flashcards !== undefined) {
      if (!Array.isArray(n.flashcards)) throw new Error('Flashcards inválidos.');
      for (const card of n.flashcards) {
        if (!card || typeof card.id !== 'string' || flashIds.has(card.id) || typeof card.question !== 'string' || typeof card.answer !== 'string' || !Number.isSafeInteger(card.order) || card.order < 1 || (card.answerSource !== undefined && card.answerSource !== 'children')) throw new Error('Flashcard inválido.');
        flashIds.add(card.id);
      }
    }
    if (n.type === 'web' && !safeUrl(n.path) && !(n.mediaFile === n.path && /\.pdf$/i.test(n.path) && !/^(?:[a-z]+:|[\\/])|(?:^|\/)\.\.(?:\/|$)/i.test(n.path))) throw new Error('Endereço externo inválido.');
    if (n.visualSource !== undefined && (!['image', 'mind', 'note'].includes(n.type) || typeof n.visualSource !== 'string' || !/\.(imageboard|md)$/.test(n.visualSource) || typeof n.visualNote !== 'string')) throw new Error('Referência de nota visual inválida.');
    for (const field of ['noteMaps', 'noteLinks']) if (n[field] !== undefined && (n.type !== 'note' || !Array.isArray(n[field]) || !n[field].every(value => typeof value === 'string'))) throw new Error('Conteúdo associado à nota inválido.');
    if (n.type === 'image' || n.type === 'web') {
      if (!Array.isArray(n.pins)) throw new Error('Alfinetes inválidos.');
      const pins = new Set();
      for (const p of n.pins) {
        if (!p || typeof p.id !== 'string' || pins.has(p.id) || typeof p.label !== 'string' || !finite(p.u) || !finite(p.v) || p.u < 0 || p.u > 1 || p.v < 0 || p.v > 1 || typeof p.notePath !== 'string') throw new Error('Alfinete inválido.');
        pins.add(p.id);
        if (p.area && (![p.area.w, p.area.h].every(finite) || p.area.w <= 0 || p.area.h <= 0 || p.area.w > 1 || p.area.h > 1 || p.u < p.area.w / 2 - 1e-8 || p.u > 1 - p.area.w / 2 + 1e-8 || p.v < p.area.h / 2 - 1e-8 || p.v > 1 - p.area.h / 2 + 1e-8)) throw new Error('Área de marcação inválida.');
        if (p.anchor && (!safeUrl(p.anchor.url) || typeof p.anchor.selector !== 'string' || p.anchor.selector.length > 2000 || typeof p.anchor.text !== 'string' || p.anchor.text.length > 240 || ![p.anchor.rx, p.anchor.ry].every(finite) || p.anchor.rx < 0 || p.anchor.rx > 1 || p.anchor.ry < 0 || p.anchor.ry > 1)) throw new Error('Âncora de página inválida.');
      }
    }
  }
  const byId = new Map(b.nodes.map(n => [n.id, n]));
  const validatedMind = new Set(), pinIds = new Map(b.nodes.filter(n => n.pins).map(n => [n.id, new Set(n.pins.map(p => p.id))]));
  for (const n of b.nodes) {
    if (n.type === 'mind') {
      if (n.relation !== undefined && typeof n.relation !== 'boolean') throw new Error('Grupo de relação inválido.');
      if (n.pinHidden !== undefined && typeof n.pinHidden !== 'boolean') throw new Error('Visibilidade do mapa inválida.');
      if (typeof n.title !== 'string' || typeof n.body !== 'string' || typeof n.mapId !== 'string' || typeof n.parentId !== 'string') throw new Error('Nó de mapa mental inválido.');
      const root = byId.get(n.mapId), parent = byId.get(n.parentId);
      if (root?.type !== 'mind' || root.id !== root.mapId || root.parentId !== '' || (n.id !== n.mapId && (parent?.type !== 'mind' || parent.mapId !== n.mapId))) throw new Error('Hierarquia do mapa mental inválida.');
      const seen = new Set([n.id]); let cursor = parent;
      while (cursor && !validatedMind.has(cursor.id)) { if (seen.has(cursor.id)) throw new Error('Ciclo no mapa mental.'); seen.add(cursor.id); cursor = byId.get(cursor.parentId); }
      for (const id of seen) validatedMind.add(id);
    }
    for (const p of n.pins || []) if (p.mapRoot && (byId.get(p.mapRoot)?.type !== 'mind' || byId.get(p.mapRoot)?.mapId !== p.mapRoot)) throw new Error('Mapa do alfinete inexistente.');
  }
  for (const e of b.edges) {
    if (e?.label !== undefined && (typeof e.label !== 'string' || e.label.length > 500)) throw new Error('Rótulo de linha inválido.');
    if (!e || typeof e.id !== 'string' || !e.from || !e.to || !ids.has(e.from.node) || !ids.has(e.to.node)) throw new Error('Ligação inválida no quadro.');
    for (const endpoint of [e.from, e.to]) if (endpoint.pin && !pinIds.get(endpoint.node)?.has(endpoint.pin)) throw new Error('Ligação com alfinete inexistente.');
  }
  if (!b.camera || ![b.camera.x, b.camera.y, b.camera.z].every(finite)) b.camera = { x: 80, y: 70, z: 1 };
  b.camera.z = Math.min(3, Math.max(.15, b.camera.z));
  if (b.groups !== undefined) {
    if (!Array.isArray(b.groups)) throw new Error('Grupos inválidos.');
    const groupIds = new Set();
    for (const g of b.groups) {
      if (!g || typeof g.id !== 'string' || groupIds.has(g.id) || typeof g.title !== 'string' || !/^#[0-9a-f]{6}$/i.test(g.color) || !Array.isArray(g.members) || !g.members.every(id => typeof id === 'string') || ![g.x, g.y].every(finite)) throw new Error('Grupo inválido.');
      groupIds.add(g.id); g.members = [...new Set(g.members.filter(id => ids.has(id)))];
      if (g.excluded !== undefined && (!Array.isArray(g.excluded) || !g.excluded.every(id => typeof id === 'string'))) throw new Error('Exclusões do grupo inválidas.');
    }
  }
  return b;
}

// A visual note has one canonical scene; whiteboards keep positioned occurrences.
function cleanNestedState(node) {
  for (const key of ['linkedVisualRoot', 'visualExpanded', 'visualParents', 'nestedOnly', 'visualChildOf', 'visualCollapsed', 'visualIdentity', 'mediaStudyNode', 'mediaStudyCollapsed', 'mediaStudyFor', 'mediaSourceDetached', 'cardColor']) delete node[key];
  return node;
}
function mapVisualIds(bundle, resolve) {
  for (const n of bundle.nodes) {
    n.id = resolve('nodes', n.id);
    if (n.mapId) n.mapId = resolve('nodes', n.mapId);
    if (n.parentId) n.parentId = resolve('nodes', n.parentId);
    if (n.noteMaps) n.noteMaps = n.noteMaps.map(id => resolve('nodes', id));
    for (const pin of n.pins || []) { pin.id = resolve('pins', pin.id); if (pin.mapRoot) pin.mapRoot = resolve('nodes', pin.mapRoot); }
    for (const card of n.flashcards || []) card.id = resolve('cards', card.id);
  }
  for (const e of bundle.edges) {
    e.id = resolve('edges', e.id);
    for (const point of [e.from, e.to]) { point.node = resolve('nodes', point.node); if (point.pin) point.pin = resolve('pins', point.pin); }
  }
  bundle.visualRoot = resolve('nodes', bundle.visualRoot);
  return bundle;
}
function canonicalVisualBundle(bundle, root) {
  if (!root.visualIdentity) return bundle;
  const inverse = {};
  for (const kind of ['nodes', 'pins', 'edges', 'cards']) inverse[kind] = new Map(Object.entries(root.visualIdentity[kind] || {}).map(([canonical, local]) => [local, canonical]));
  return mapVisualIds(bundle, (kind, id) => {
    if (inverse[kind].has(id)) return inverse[kind].get(id);
    root.visualIdentity[kind] ||= {}; root.visualIdentity[kind][id] = id; inverse[kind].set(id, id); return id;
  });
}
function visualContentHash(bundle) {
  return JSON.stringify({ root: bundle.visualRoot, nodes: bundle.nodes.map(n => { const copy = { ...n }; for (const key of ['x', 'y', 'w', 'h', 'collapsed', 'pinHidden']) delete copy[key]; return copy; }), edges: bundle.edges });
}
function atlasSceneIndex(board) {
  const byId = new Map(), maps = new Map(), order = new Map(), outgoing = new Map();
  board.nodes.forEach((node, i) => { byId.set(node.id, node); order.set(node.id, i); if (node.type === 'mind') { if (!maps.has(node.mapId)) maps.set(node.mapId, []); maps.get(node.mapId).push(node); } });
  for (const edge of board.edges) { if (!outgoing.has(edge.from.node)) outgoing.set(edge.from.node, []); outgoing.get(edge.from.node).push(edge); }
  return { byId, maps, order, outgoing };
}
function visualInputHash(board, root, index) {
  const members = reusableNodes(board, root, index), ids = new Set(members.map(n => n.id));
  return JSON.stringify({ nodes: members.map(({ x, y, w, h, collapsed, pinHidden, ...content }) => content), edges: board.edges.filter(e => ids.has(e.from.node) && ids.has(e.to.node)) });
}
function visualBundle(board, image, index) {
  const ids = new Set([image.id]), maps = new Set(image.pins.map(p => p.mapRoot).filter(Boolean));
  if (index) for (const node of reusableNodes(board, image, index)) ids.add(node.id);
  else for (const node of board.nodes) if (node.type === 'mind' && maps.has(node.mapId)) ids.add(node.id);
  for (const edge of index ? index.outgoing.get(image.id) || [] : board.edges) if (edge.from.node === image.id && image.pins.some(p => p.id === edge.from.pin)) {
    const node = board.nodes.find(n => n.id === edge.to.node);
    if (node?.type === 'note' && image.pins.some(p => p.notePath === node.path)) ids.add(node.id);
  }
  const bundle = emptyBoard(image.title || 'Nota visual');
  bundle.nodes = board.nodes.filter(n => ids.has(n.id)).map(n => {
    const copy = clone(n); copy.x -= image.x; copy.y -= image.y;
    cleanNestedState(copy);
    delete copy.visualSource; delete copy.visualNote; delete copy.visualDetached;
    if (copy.type === 'mind') { copy.collapsed = false; if (!copy.parentId) copy.pinHidden = true; }
    return copy;
  });
  bundle.edges = clone(board.edges.filter(e => ids.has(e.from.node) && ids.has(e.to.node)));
  bundle.visualRoot = image.id; bundle.visualNotePath = image.visualNote || ''; return canonicalVisualBundle(bundle, image);
}
function readVisualBundle(raw) {
  const bundle = parseBoard(raw);
  if (typeof bundle.visualRoot !== 'string' || !['image', 'mind', 'note'].includes(bundle.nodes.find(n => n.id === bundle.visualRoot)?.type)) throw new Error('Nota visual inválida.');
  return bundle;
}
function mindNoteBundle(board, root, index) {
  const bundle = emptyBoard(root.title), nodes = index ? index.maps.get(root.mapId) || [] : board.nodes.filter(n => n.type === 'mind' && n.mapId === root.mapId), ids = new Set(nodes.map(n => n.id));
  bundle.nodes = nodes.map(n => { const copy = cleanNestedState(clone(n)); copy.x -= root.x; copy.y -= root.y; delete copy.visualSource; delete copy.visualNote; copy.collapsed = false; copy.pinHidden = false; return copy; });
  bundle.edges = clone(board.edges.filter(e => ids.has(e.from.node) && ids.has(e.to.node)));
  bundle.visualRoot = root.id; bundle.visualNotePath = root.visualNote || root.path || ''; return canonicalVisualBundle(bundle, root);
}
/** Scene membership without cloning Markdown, flashcards or connectors during interaction. */
function reusableNodes(board, root, index) {
  if (index) {
    if (root.type === 'mind') return index.maps.get(root.mapId) || [];
    const members = new Map([[root.id, root]]), maps = root.type === 'image' ? root.pins.map(p => p.mapRoot).filter(Boolean) : root.noteMaps || [];
    for (const map of maps) for (const node of index.maps.get(map) || []) members.set(node.id, node);
    const pins = new Set((root.pins || []).map(p => p.id)), links = new Set(root.type === 'image' ? root.pins.map(p => p.notePath).filter(Boolean) : root.noteLinks || []);
    for (const edge of index.outgoing.get(root.id) || []) if (root.type !== 'image' || pins.has(edge.from.pin)) { const node = index.byId.get(edge.to.node); if (node?.type === 'note' && links.has(node.path)) members.set(node.id, node); }
    return [...members.values()].sort((a, b) => index.order.get(a.id) - index.order.get(b.id));
  }
  if (root.type === 'mind') return board.nodes.filter(n => n.type === 'mind' && n.mapId === root.mapId);
  const ids = new Set([root.id]);
  const maps = new Set(root.type === 'image' ? root.pins.map(p => p.mapRoot).filter(Boolean) : root.noteMaps || []);
  const links = new Set(root.type === 'image' ? root.pins.map(p => p.notePath).filter(Boolean) : root.noteLinks || []);
  for (const node of board.nodes) if (node.type === 'mind' && maps.has(node.mapId)) ids.add(node.id);
  if (root.type === 'note') for (const edge of board.edges) if (edge.from.node === root.id) { const node = board.nodes.find(n => n.id === edge.to.node); if (node?.type === 'note' && links.has(node.path)) ids.add(node.id); }
  if (root.type === 'image') {
    const pins = new Set(root.pins.map(p => p.id));
    const byId = new Map(board.nodes.map(n => [n.id, n]));
    for (const edge of board.edges) if (edge.from.node === root.id && pins.has(edge.from.pin)) { const node = byId.get(edge.to.node); if (node?.type === 'note' && links.has(node.path)) ids.add(node.id); }
  }
  return board.nodes.filter(n => ids.has(n.id));
}
function reparentMindBranch(board, node, parent, dryRun = false) {
  if (!board.nodes.includes(node) || !board.nodes.includes(parent) || node.type !== 'mind' || parent.type !== 'mind' || !node.parentId) throw new Error('Escolha um ramo e um novo pai do mapa mental.');
  if (node.mapId !== parent.mapId) throw new Error('Escolha um pai dentro do mesmo mapa mental.');
  const byId = new Map(board.nodes.map(n => [n.id, n])); let cursor = parent; const seen = new Set();
  while (cursor) { if (cursor.id === node.id || seen.has(cursor.id)) throw new Error('Um ramo não pode ser filho de si mesmo ou de seus descendentes.'); seen.add(cursor.id); cursor = byId.get(cursor.parentId); }
  if (dryRun || node.parentId === parent.id) return true;
  node.parentId = parent.id; parent.collapsed = false;
  const edge = board.edges.find(e => e.mindTree && e.to.node === node.id);
  if (edge) edge.from = { node: parent.id };
  else board.edges.push({ id: uid(), from: { node: parent.id }, to: { node: node.id }, mindTree: true, color: node.color || COLORS[0] });
  return true;
}
function adoptMindChildren(board, node, root) {
  if (node.type !== 'mind' || node.id === root.id || node.mapId === root.mapId) return 0;
  const children = new Map();
  for (const n of board.nodes) if (n.type === 'mind' && n.mapId === node.mapId && n.parentId) { if (!children.has(n.parentId)) children.set(n.parentId, []); children.get(n.parentId).push(n); }
  const direct = children.get(node.id) || [], moved = new Set(), queue = [...direct];
  while (queue.length) { const n = queue.pop(); if (moved.has(n.id)) continue; moved.add(n.id); queue.push(...(children.get(n.id) || [])); }
  if (moved.has(root.id)) throw new Error('Não é possível mover o mapa para dentro dele mesmo.');
  for (const n of board.nodes) if (moved.has(n.id)) { n.mapId = root.mapId; if (n.parentId === node.id) n.parentId = root.id; }
  for (const e of board.edges) if (e.mindTree && e.from.node === node.id && moved.has(e.to.node)) e.from = { node: root.id };
  if (moved.size) { root.pinHidden = false; root.collapsed = false; }
  return moved.size;
}
function affectedEdges(adjacency, ids) {
  const edges = new Set();
  for (const id of ids) for (const edge of adjacency.get(id) || []) edges.add(edge);
  return [...edges];
}
function pinchCamera(start, points) {
  const [a, b] = points, distance = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
  const z = Math.max(.15, Math.min(3, start.camera.z * distance / start.distance));
  return { x: (a.x + b.x) / 2 - start.left - start.anchor.x * z, y: (a.y + b.y) / 2 - start.top - start.anchor.y * z, z };
}
function reusableBundle(board, root, index) {
  if (root.type === 'image') return visualBundle(board, root, index);
  if (root.type === 'mind') return mindNoteBundle(board, root, index);
  const bundle = emptyBoard(root.title || 'Nota'), ids = new Set(reusableNodes(board, root, index).map(n => n.id));
  bundle.nodes = board.nodes.filter(n => ids.has(n.id)).map(n => { const node = cleanNestedState(clone(n)); node.x -= root.x; node.y -= root.y; delete node.visualSource; delete node.visualNote; if (node.type === 'mind') { node.pinHidden = false; node.collapsed = false; } return node; });
  bundle.edges = clone(board.edges.filter(e => ids.has(e.from.node) && ids.has(e.to.node)));
  bundle.visualRoot = root.id; bundle.visualNotePath = root.path; return canonicalVisualBundle(bundle, root);
}

const NOTE_CARDS_START = '<!-- image-atlas-flashcards:start -->';
const NOTE_CARDS_END = '<!-- image-atlas-flashcards:end -->';
function noteFlashcardBlock(text) {
  const start = text.indexOf(NOTE_CARDS_START), end = text.indexOf(NOTE_CARDS_END);
  if (start < 0 && end < 0) return { source: '', original: null };
  if (start < 0 || end < start || text.indexOf(NOTE_CARDS_START, start + 1) >= 0 || text.indexOf(NOTE_CARDS_END, end + 1) >= 0) throw new Error('O bloco de flashcards da nota está incompleto ou duplicado. Corrija os marcadores no Obsidian antes de salvar.');
  return { source: text.slice(start + NOTE_CARDS_START.length, end).trim(), original: text.slice(start, end + NOTE_CARDS_END.length) };
}
function writeNoteFlashcardBlock(text, original, source) {
  if (/<!--\s*image-atlas-(?:flashcards|visual):/.test(source)) throw new Error('Cole apenas os cartões, sem os marcadores internos do ROMUS.');
  const current = noteFlashcardBlock(text);
  if (current.original !== original) throw new Error('Os flashcards foram alterados em outra janela. Reabra o editor para carregar a versão atual. Seu texto continua neste editor.');
  if (original === null && !source.trim()) return text;
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const block = [NOTE_CARDS_START, source.trim().replace(/\r?\n/g, eol), NOTE_CARDS_END].join(eol);
  return current.original === null ? text + (text.endsWith(eol + eol) ? '' : text.endsWith(eol) ? eol : eol + eol) + '## Flashcards' + eol + eol + block + eol : text.replace(current.original, () => block);
}
/** One card per line; indented continuation lines support lists and multiline Markdown. */
function parseNoteFlashcards(text, path = '', strict = false) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/), cards = [], errors = [];
  let frontmatter = lines[0] === '---', visual = false, comment = false, fence = null, previous = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i], trimmed = line.trim();
    if (frontmatter) { if (i > 0 && trimmed === '---') frontmatter = false; continue; }
    if (trimmed === '<!-- image-atlas-visual:start -->') { visual = true; previous = null; continue; }
    if (visual) { if (trimmed === '<!-- image-atlas-visual:end -->') visual = false; continue; }
    if (trimmed === NOTE_CARDS_START || trimmed === NOTE_CARDS_END) { previous = null; continue; }
    if (previous && /^(?: {2}|\t)/.test(line)) { previous.answer += '\n' + line.replace(/^(?: {2}|\t)/, ''); continue; }
    if (comment) { if (line.includes('-->')) comment = false; continue; }
    if (/^\s*<!--/.test(line)) { comment = !line.includes('-->'); previous = null; continue; }
    const fenced = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fence) { if (fenced && fenced[1][0] === fence[0] && fenced[1].length >= fence.length && /^ {0,3}(?:`+|~+)\s*$/.test(line)) fence = null; continue; }
    if (fenced) { fence = fenced[1]; previous = null; continue; }
    if (!trimmed || /^#{1,6}\s/.test(trimmed)) { previous = null; continue; }
    const separators = []; let ticks = 0;
    for (let j = 0; j < line.length; j++) {
      if (line[j] === '\\') { j++; continue; }
      if (line[j] === '`') { let count = 1; while (line[j + count] === '`') count++; ticks = ticks === count ? 0 : ticks || count; j += count - 1; continue; }
      if (!ticks && line.slice(j, j + 2) === '==' && line[j - 1] !== '=' && line[j + 2] !== '=') { separators.push(j); j++; }
    }
    if (separators.length !== 1) { if (strict) errors.push(i + 1); previous = null; continue; }
    const position = separators[0], question = line.slice(0, position).replace(/^\s*[-*+]\s+/, '').trim(), answer = line.slice(position + 2).trim();
    if (!question || !answer) { if (strict) errors.push(i + 1); previous = null; continue; }
    previous = { id: `${path}:line:${i + 1}`, question, answer, order: cards.length + 1, sourcePath: path }; cards.push(previous);
  }
  for (const card of cards) card.answer = card.answer.trimEnd();
  return { cards, errors };
}
function noteFlashcardPath(node) {
  const path = node.mediaNote || node.visualNote || (['note', 'mind'].includes(node.type) ? node.path : '');
  return typeof path === 'string' && path.endsWith('.md') ? path : null;
}
function whiteboardFlashcardNotes(nodes, summaryOrder = false) {
  if (summaryOrder) {
    const byId = new Map(nodes.map(node => [node.id, node])), parents = new Map(), children = new Map(), positions = new Map(nodes.map((node, i) => [node, i]));
    for (const node of nodes) {
      const parent = node.parentId || node.childOf;
      if (parent && parent !== node.id && byId.has(parent)) parents.set(node.id, parent);
      for (const id of [...(node.noteMaps || []), ...(node.pins || []).map(pin => pin.mapRoot)]) if (id !== node.id && byId.has(id) && !parents.has(id)) parents.set(id, node.id);
    }
    for (const node of nodes) { const parent = parents.get(node.id); if (!children.has(parent)) children.set(parent, []); children.get(parent).push(node); }
    const compare = (a, b) => (a.y || 0) - (b.y || 0) || (a.x || 0) - (b.x || 0) || positions.get(a) - positions.get(b);
    for (const group of children.values()) group.sort(compare);
    const visited = new Set(), ordered = [], stack = [...(children.get(undefined) || []), ...nodes.slice().sort(compare)].reverse();
    while (stack.length) { const node = stack.pop(); if (visited.has(node.id)) continue; visited.add(node.id); ordered.push(node); stack.push(...(children.get(node.id) || []).slice().reverse()); }
    nodes = ordered;
  }
  const paths = new Set();
  for (const node of nodes) {
    for (const path of [noteFlashcardPath(node), node.visualSource, ...(node.pins || []).map(pin => pin.notePath)]) {
      if (typeof path === 'string' && path.endsWith('.md')) paths.add(path);
    }
  }
  return [...paths];
}

/** Accept the whole Markdown code block copied from chat as a batch, without its wrapper. */
function normalizeFlashcardPaste(text) {
  let source = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const fenced = source.trim().match(/^(`{3,}|~{3,})(?:markdown|md|text|txt)?[ \t]*\n([\s\S]*)\n\1[ \t]*$/i);
  if (fenced) source = fenced[2];
  else source = source.replace(/^(?:[ \t]*\n)+|(?:\n[ \t]*)+$/g, '');
  const lines = source.split('\n'), nonempty = lines.filter(line => line.trim());
  const indent = nonempty.length ? Math.min(...nonempty.map(line => line.match(/^[ \t]*/)[0].length)) : 0;
  if (indent) source = lines.map(line => line.slice(Math.min(indent, line.match(/^[ \t]*/)[0].length))).join('\n');
  return source.trim();
}
function flashcardPasteBatch(text) {
  const source = normalizeFlashcardPaste(text), parsed = parseNoteFlashcards(source, '', true);
  return { source, cards: parsed.cards, errors: parsed.errors };
}

/** Keep malformed pasted lines visible for correction instead of silently discarding them. */
function numberedFlashcardRows(source) {
  const rows = [];
  for (const line of source.split(/\r?\n/)) {
    if (/^(?: {2}|\t)/.test(line) && rows.length) { rows[rows.length - 1].answer += '\n' + line.replace(/^(?: {2}|\t)/, ''); continue; }
    if (!line.trim()) continue;
    const clean = line.replace(/^\s*\d+[.)]\s+/, ''), parsed = parseNoteFlashcards(clean).cards;
    rows.push(parsed.length === 1 ? { question: parsed[0].question, answer: parsed[0].answer } : { question: line, answer: '', incomplete: true });
  }
  return rows;
}
function serializeFlashcardRows(rows) {
  return rows.filter(row => row.question.trim() || row.answer.trim()).map(row => {
    const answer = row.answer.trim().split(/\r?\n/);
    return row.question.trim() + ' == ' + answer[0] + answer.slice(1).map(line => '\n  ' + line).join('');
  }).join('\n');
}
/** Numbered question/answer rows; the portable storage remains native Markdown. */
class WhiteboardStudyPicker extends Modal {
  constructor(plugin, boardPath, origin) { super(plugin.app); this.plugin = plugin; this.boardPath = boardPath; this.origin = origin; this.alive = true; }
  async onOpen() {
    this.modalEl.addClass('ia-study-topics-modal'); this.setTitle('Escolher tema para estudar');
    this.contentEl.createEl('p', { cls: 'ia-muted', text: 'Escolha uma nota ou responda todos os temas. Somente cartões novos e revisões já vencidas entram na sessão; o histórico FSRS é preservado.' });
    this.summary = this.contentEl.createDiv({ cls: 'ia-study-topics-summary', attr: { role: 'status', 'aria-live': 'polite' } });
    const actions = this.contentEl.createDiv({ cls: 'ia-modal-actions' });
    this.all = AtlasView.prototype.button.call(this, actions, 'Responder todos', 'layers', () => this.choose()); this.all.addClass('mod-cta'); this.all.disabled = true;
    this.refresh = AtlasView.prototype.button.call(this, actions, 'Atualizar temas', 'refresh-cw', () => this.load());
    this.reset = AtlasView.prototype.button.call(this, actions, 'Resetar como novos', 'rotate-ccw', () => {
      if (this.loading || this.resetting || !this.entries?.length) return;
      this.resetCandidates = this.entries.map(entry => ({ entry, expected: entry.record.revision }));
      this.resetMessage.textContent = `Resetar ${this.resetCandidates.length} cartões das notas deste quadro? Eles voltarão a ser novos em todos os lugares onde essas notas aparecem. O histórico anterior será arquivado.`;
      this.confirmReset.hidden = false;
    }); this.reset.disabled = true;
    this.confirmReset = this.contentEl.createDiv({ cls: 'ia-flashcard-bulk' }); this.confirmReset.hidden = true;
    this.resetMessage = this.confirmReset.createEl('p');
    const resetActions = this.confirmReset.createDiv({ cls: 'ia-modal-actions' });
    this.confirmResetButton = AtlasView.prototype.button.call(this, resetActions, 'Confirmar reset como novos', 'rotate-ccw', () => this.resetCards());
    AtlasView.prototype.button.call(this, resetActions, 'Cancelar reset', 'x', () => { this.confirmReset.hidden = true; this.resetCandidates = null; });
    const sorting = this.contentEl.createEl('label', { cls: 'ia-card-position' }); sorting.createSpan({ text: 'Ordenar temas' });
    this.sort = sorting.createEl('select', { attr: { 'aria-label': 'Ordenar temas' } });
    for (const [value, label] of [['summary', 'Ordem do quadro/mapa'], ['added', 'Primeiros adicionados'], ['answered', 'Primeiros respondidos']]) this.sort.createEl('option', { text: label, attr: { value } });
    this.sort.value = this.plugin.studyTopicSort?.get(this.boardPath) || 'summary';
    this.sort.onchange = () => { this.plugin.studyTopicSort ||= new Map(); this.plugin.studyTopicSort.set(this.boardPath, this.sort.value); this.renderTopics(); };
    this.search = this.contentEl.createEl('input', { cls: 'ia-study-topic-search', attr: { type: 'search', placeholder: 'Digite para buscar um tema…', 'aria-label': 'Buscar tema', autocomplete: 'off' } });
    this.search.oninput = () => this.renderTopics();
    this.search.onkeydown = event => {
      if (event.isComposing) return;
      if (event.key === 'Escape' && this.search.value) { event.preventDefault(); event.stopPropagation(); this.search.value = ''; this.renderTopics(); }
      else if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); this.list.querySelector('button:not(:disabled)')?.click(); }
    };
    this.searchStatus = this.contentEl.createDiv({ cls: 'ia-muted ia-study-topic-search-status', attr: { role: 'status', 'aria-live': 'polite' } });
    this.list = this.contentEl.createDiv({ cls: 'ia-study-topics-list' });
    await this.load();
    if (this.alive && !this.contentEl.ownerDocument.defaultView.matchMedia('(max-width: 600px)').matches) this.search.focus({ preventScroll: true });
  }
  async load() {
    if (this.loading) return; this.loading = true; this.refresh.disabled = true; this.all.disabled = true; this.reset.disabled = true;
    this.confirmReset.hidden = true; this.resetCandidates = null;
    this.summary.textContent = 'Buscando os temas deste whiteboard…';
    try {
      const data = await this.plugin.loadReviewEntries({ boardPath: this.boardPath, boardNotesOnly: true }); if (!this.alive) return;
      this.boardTitle = data.title.replace(/^Flashcards · /, '');
      this.entries = data.entries; this.reset.disabled = !data.entries.length;
      this.setTitle(`Estudar · ${data.title.replace(/^Flashcards · /, '')}`);
      const now = Date.now(), groups = new Map();
      for (const entry of data.entries) {
        const path = entry.sourcePath;
        if (!groups.has(path)) groups.set(path, { path, title: entry.nodeTitle || path.split('/').pop().replace(/\.md$/, ''), total: 0, due: 0, fresh: 0, later: 0, firstAnswered: Infinity, added: groups.size });
        const group = groups.get(path), schedule = entry.record.schedule; group.total++;
        for (const event of entry.record.history) { const at = new Date(event.at).getTime(); if (!event.undone && Number.isFinite(at)) group.firstAnswered = Math.min(group.firstAnswered, at); }
        if (!schedule) group.fresh++;
        else if (new Date(schedule.due).getTime() <= now) { if (schedule.reps) group.due++; else group.fresh++; }
        else group.later++;
      }
      this.topicGroups = [...groups.values()].map(group => ({ ...group, searchKey: atlasSearchText(`${group.title}\n${group.path}`) })); this.topicOrder = new Map((data.topicOrder || []).map((path, i) => [path, i])); this.renderTopics();
      const ready = this.topicGroups.reduce((sum, group) => sum + group.due + group.fresh, 0);
      this.all.disabled = !ready; this.all.title = `${ready} cartões disponíveis pelo agendamento FSRS`;
      this.summary.textContent = groups.size ? `${ready} para responder agora · ${groups.size} temas · ${data.entries.length} cartões no total` : 'Nenhuma nota com flashcards neste whiteboard.';
    } catch (error) { if (this.alive) this.summary.textContent = `Não foi possível carregar os temas: ${error.message}`; }
    finally { this.loading = false; if (this.alive) this.refresh.disabled = false; }
  }
  renderTopics() {
      if (!this.topicGroups) return;
      const tokens = atlasSearchText(this.search.value).trim().split(/\s+/).filter(Boolean);
      const groups = this.topicGroups.filter(group => tokens.every(token => group.searchKey.includes(token))), mode = this.sort.value;
      groups.sort((a, b) => (mode === 'answered' ? a.firstAnswered - b.firstAnswered : mode === 'summary' ? (this.topicOrder.get(a.path) ?? Infinity) - (this.topicOrder.get(b.path) ?? Infinity) : 0) || a.added - b.added);
      this.list.empty();
      this.searchStatus.textContent = tokens.length ? `${groups.length} de ${this.topicGroups.length} temas` : '';
      if (!groups.length && tokens.length) this.list.createEl('p', { cls: 'ia-muted', text: 'Nenhum tema encontrado. Tente outro nome ou limpe a busca.' });
      for (const group of groups) {
        const count = group.due + group.fresh;
        const button = this.contentEl.ownerDocument.createElement('button'); button.type = 'button'; button.className = 'ia-study-topic'; button.disabled = !count;
        button.createEl('strong', { text: group.title });
        button.createSpan({ cls: 'ia-study-topic-ready', text: count ? `${count} para responder` : 'Em dia' });
        button.createSpan({ cls: 'ia-muted', text: `${group.due} vencidos · ${group.fresh} novos · ${group.later} agendados para depois · ${group.total} no total` });
        button.createSpan({ cls: 'ia-study-topic-path ia-muted', text: this.app.metadataCache.getFirstLinkpathDest(group.path)?.basename || group.path.split('/').pop().replace(/\.md$/i,'') });
        if (mode === 'answered') button.createSpan({ cls: 'ia-muted', text: Number.isFinite(group.firstAnswered) ? `Primeira resposta: ${new Date(group.firstAnswered).toLocaleString()}` : 'Ainda não respondido' });
        button.onclick = () => this.choose(group.path); this.list.append(button);
      }
  }
  async choose(path) {
    if (this.loading || this.opening || this.resetting) return; this.opening = true;
    try { await this.plugin.openReviewPopup({ boardPath: this.boardPath, boardNotesOnly: true, ...(path ? { boardThemePath: path } : {}), title: (path && this.app.vault.getFileByPath(path)?.basename) || this.boardTitle || 'Whiteboard' }, this.origin); this.close(); }
    catch (error) { this.opening = false; this.summary.textContent = error.message; }
  }
  async resetCards() {
    if (this.resetting || !this.resetCandidates?.length) return;
    this.resetting = true; this.confirmResetButton.disabled = true; this.all.disabled = this.refresh.disabled = this.reset.disabled = true;
    try {
      const count = await this.plugin.getReviewStore().resetAsNew(this.resetCandidates);
      if (!this.alive) return;
      await this.load(); this.summary.textContent = `${count} cartões resetados como novos. ${this.summary.textContent}`;
    } catch (error) { if (this.alive) this.resetMessage.textContent = `Não foi possível concluir o reset: ${error.message}`; }
    finally { this.resetting = false; if (this.alive) { this.confirmResetButton.disabled = false; this.refresh.disabled = false; this.reset.disabled = !this.entries?.length; } }
  }
  onClose() { this.alive = false; this.contentEl.empty(); }
}
class NoteFlashcardEditor extends Modal {
  open() { if (this.app.shouldDockFlashcardEditor?.()) return this.app.dockFlashcardEditor(this).catch(error => new Notice(error.message)); return super.open(); }
  constructor(view, note, options = {}) { super(view.app); this.view = view; this.note = note; this.options = options; this.alive = true; this.rows = []; this.mode = 'cards'; }
  async onOpen() {
    this.modalEl.addClass('ia-note-flash-editor'); this.setTitle(`Flashcards · ${this.note.basename}`);
    const host = this.contentEl; host.createDiv({ cls: 'ia-muted', text: 'Carregando flashcards da nota…' });
    try {
      const text = await this.app.vault.read(this.note); if (!this.alive) return;
      const block = noteFlashcardBlock(text); this.original = block.original; host.empty();
      if (this.options.card) {
        const target = this.options.card, cards = parseNoteFlashcards(text, this.note.path).cards;
        const matches = cards.filter(card => card.question === target.question && card.answer === target.answer);
        this.target = matches.find(card => card.id === target.sourceCardId) || (matches.length === 1 ? matches[0] : null);
        if (!this.target) throw new Error('Este cartão mudou ou pertence ao mapa. Abra a nota original para editá-lo com segurança.');
        this.targetText = text;
        block.source = serializeFlashcardRows([this.target]);
        this.setTitle(`Editar flashcard · ${this.note.basename}`);
      }
      host.createDiv({ cls: 'ia-eyebrow', text: 'SALVOS NESTA NOTA' });
      host.createEl('p', { cls: 'ia-muted', text: this.target ? 'Esta é a questão que você está respondendo. Markdown e links [[Nota]] funcionam nos dois campos. Ctrl+Enter salva e retorna à revisão.' : 'Um cartão em cada bloco numerado. Enter na pergunta vai para a resposta. Ctrl+Enter adiciona o próximo cartão. Markdown funciona nos dois campos.' });
      const modes = host.createDiv({ cls: 'ia-card-editor-modes' });
      this.cardsButton = this.view.button(modes, 'Cartões numerados', 'list-ordered', () => this.switchMode('cards'));
      this.markdownButton = this.view.button(modes, 'Markdown ==', 'code', () => this.switchMode('markdown'));
      this.view.button(modes, 'Colar vários cartões', 'clipboard-paste', () => this.openBulkPaste());
      this.bulkHost = host.createDiv({ cls: 'ia-flashcard-bulk' }); this.bulkHost.hidden = true;
      this.bulkHost.createEl('p', { cls: 'ia-muted', text: 'Cole os cartões no formato Pergunta == Resposta e escolha onde inseri-los. A ordem dos cartões colados será mantida.' });
      const placement = this.bulkHost.createEl('label', { cls: 'ia-card-position' });
      placement.createSpan({ text: 'Inserir a partir da posição' });
      this.bulkPosition = placement.createEl('input', { attr: { type: 'number', min: '1', step: '1', 'aria-label': 'Inserir a partir da posição' } });
      this.bulkInput = this.bulkHost.createEl('textarea', { cls: 'ia-flashcard-bulk-input', attr: { rows: '6', placeholder: 'Pergunta 1 == Resposta 1\nPergunta 2 == Resposta 2', 'aria-label': 'Colar vários flashcards' } });
      this.bulkStatus = this.bulkHost.createDiv({ cls: 'ia-bulk-status', attr: { role: 'status' } });
      this.bulkInput.oninput = () => this.updateBulkCount();
      const bulkActions = this.bulkHost.createDiv({ cls: 'ia-modal-actions' });
      this.view.button(bulkActions, 'Adicionar cartões colados', 'plus', () => this.importBulkPaste());
      this.view.button(bulkActions, 'Cancelar colagem', 'x', () => { this.bulkHost.hidden = true; });
      const toolbar = host.createDiv({ cls: 'ia-card-editor-tools' });
      this.view.button(toolbar, 'Negrito', 'bold', () => this.wrap('**'));
      this.view.button(toolbar, 'Itálico', 'italic', () => this.wrap('*'));
      this.view.button(toolbar, 'Código', 'code', () => this.wrap('`'));
      this.view.button(toolbar, 'Lista na resposta', 'list', () => this.wrap(this.mode === 'markdown' ? '\n  - ' : '\n- ', ''));
      this.view.button(toolbar, 'Escrever / Prévia', 'eye', () => this.togglePreview());
      toolbar.onpointerdown = event => { if (event.target.closest('button')) event.preventDefault(); };
      this.cardsHost = host.createDiv({ cls: 'ia-numbered-card-list' });
      this.input = host.createEl('textarea', { cls: 'ia-card-markdown-editor', attr: { rows: '12', spellcheck: 'true', 'aria-label': 'Flashcards em Markdown', placeholder: 'Pergunta == Resposta' } });
      this.input.value = block.source; this.input.hidden = true;
      this.input.onfocus = () => { this.activeInput = this.input; };
      this.input.oninput = () => this.updateCount(); this.input.onkeydown = event => this.keydown(event, this.input);
      this.previewHost = host.createDiv({ cls: 'ia-card-editor-preview' }); this.previewHost.hidden = true;
      const additions = host.createDiv({ cls: 'ia-numbered-card-additions' }); this.additions = additions;
      this.view.button(additions, 'Adicionar cartão · Ctrl+Enter', 'plus', () => this.addRow());
      this.undoButton = this.view.button(additions, 'Desfazer remoção', 'undo', () => {
        if (!this.removed) return;
        const { data, index } = this.removed; this.removed = null; this.undoButton.hidden = true; this.addRow(data, index);
      }); this.undoButton.hidden = true;
      this.undoPasteButton = this.view.button(additions, 'Desfazer colagem', 'undo', () => this.undoBulkPaste()); this.undoPasteButton.hidden = true;
      this.status = host.createDiv({ cls: 'ia-card-editor-status', attr: { role: 'status', 'aria-live': 'polite' } });
      const outside = block.original === null ? text : text.replace(block.original, '');
      const outsideCount = parseNoteFlashcards(outside, this.note.path).cards.length;
      if (outsideCount && !this.target) host.createEl('p', { cls: 'ia-muted', text: `${outsideCount} cartão(ões) escrito(s) em outras partes da nota também entra(m) na revisão. Edite-os diretamente no Obsidian.` });
      const actions = host.createDiv({ cls: 'ia-modal-actions' });
      this.saveButton = this.view.button(actions, 'Salvar na nota', 'check', () => this.save(false));
      this.studyButton = this.view.button(actions, 'Salvar e estudar', 'play', () => this.save(true)); this.studyButton.addClass('mod-cta');
      host.onpaste = event => this.pasteBatch(event);
      this.editorShortcut = event => {
        if (event.defaultPrevented || event.isComposing || !(event.ctrlKey || event.metaKey) || !(event.key === 'Enter' || event.code === 'NumpadEnter')) return;
        if (event.repeat) { event.preventDefault(); event.stopPropagation(); return; }
        const active = host.ownerDocument.activeElement, row = this.rows.find(row => row.question === active || row.answer === active);
        if (active === this.bulkInput && !this.bulkHost.hidden) { event.preventDefault(); event.stopPropagation(); this.importBulkPaste(); return; }
        this.keydown(event, active, row); event.stopPropagation();
      };
      host.addEventListener('keydown', this.editorShortcut, true);
      this.scope?.register(['Mod'], 'Enter', event => { this.editorShortcut(event); return false; });
      this.scope?.register(['Mod', 'Shift'], 'Enter', event => { this.editorShortcut(event); return false; });
      if (this.target) { this.addRow(this.target, 0, false); this.renumber(); } else this.loadRows(block.source);
      this.showMode();
      if (this.target) {
        modes.hidden = additions.hidden = true;
        this.rows[0].el.querySelector('.ia-numbered-card-remove').hidden = true;
        host.createDiv({ cls: 'ia-muted', text: 'Editando a questão atual. Digite [[ para vincular uma nota, por exemplo [[PSA]].' });
        this.rows[0].answer.focus();
      } else this.rows[0]?.question.focus();
      if (this.options.paste && !this.target) this.openBulkPaste();
      this.linkInput = event => this.suggestLinks(event.target);
      this.linkKeydown = event => this.handleLinkKey(event);
      host.addEventListener('input', this.linkInput);
      host.addEventListener('click', this.linkInput);
      host.addEventListener('keydown', this.linkKeydown, true);
    } catch (error) { if (this.alive) { host.empty(); host.createEl('p', { text: error.message }); } }
  }
  closeLinkSuggestions() { this.linkMenu?.remove(); this.linkMenu = null; this.linkMatch = null; }
  suggestLinks(input) {
    if (input?.tagName !== 'TEXTAREA' || input === this.bulkInput) { this.closeLinkSuggestions(); return; }
    const before = input.value.slice(0, input.selectionStart), match = before.match(/\[\[([^\[\]\n|]*)$/);
    if (!match || input.selectionStart !== input.selectionEnd) { this.closeLinkSuggestions(); return; }
    this.linkFiles ||= this.app.vault.getMarkdownFiles?.() || [];
    const query = match[1].toLocaleLowerCase();
    const files = this.linkFiles.filter(file => file.path.toLocaleLowerCase().includes(query)).sort((a, b) => Number(b.basename.toLocaleLowerCase() === query) - Number(a.basename.toLocaleLowerCase() === query)).slice(0, 8);
    this.closeLinkSuggestions();
    if (!files.length) return;
    this.linkMatch = { input, start: before.length - match[0].length, end: input.selectionStart, files, index: 0 };
    this.linkMenu = this.contentEl.createDiv({ cls: 'ia-wikilink-suggestions', attr: { role: 'listbox', 'aria-label': 'Vincular nota' } });
    const rect = input.getBoundingClientRect(), win = this.contentEl.ownerDocument.defaultView;
    const above = rect.bottom + 240 > win.innerHeight;
    Object.assign(this.linkMenu.style, { left: `${Math.max(8, rect.left)}px`, top: `${above ? Math.max(8, rect.top - 230) : rect.bottom + 4}px`, width: `${Math.min(rect.width, win.innerWidth - 24)}px` });
    files.forEach((file, index) => {
      const button = this.linkMenu.createEl('button', { attr: { type: 'button', role: 'option', 'aria-selected': String(index === 0) } });
      button.createDiv({ text: file.basename }); button.createDiv({ cls: 'ia-muted', text: this.app.displayFileLabel?.(file) || file.basename });
      button.onpointerdown = event => { event.preventDefault(); this.chooseLink(index); };
    });
  }
  handleLinkKey(event) {
    const match = this.linkMatch;
    if (!match || event.target !== match.input || event.isComposing || event.ctrlKey || event.metaKey) return;
    if (!['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(event.key)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (event.key === 'Escape') { this.closeLinkSuggestions(); return; }
    if (event.key === 'Enter' || event.key === 'Tab') { this.chooseLink(match.index); return; }
    match.index = (match.index + (event.key === 'ArrowDown' ? 1 : -1) + match.files.length) % match.files.length;
    [...this.linkMenu.children].forEach((el, index) => el.setAttribute('aria-selected', String(index === match.index)));
    this.linkMenu.children[match.index].scrollIntoView({ block: 'nearest' });
  }
  chooseLink(index) {
    const match = this.linkMatch; if (!match) return;
    const file = match.files[index], text = this.app.metadataCache?.fileToLinktext?.(file, this.note.path, true) || file.path.replace(/\.md$/i, '');
    const end = match.input.value.slice(match.end).startsWith(']]') ? match.end + 2 : match.end;
    match.input.setRangeText(`[[${text}]]`, match.start, end, 'end'); match.input.focus();
    this.resizeInput(match.input); this.updateCount(); this.closeLinkSuggestions();
  }
  openBulkPaste(text = '') {
    if (this.target) return;
    const values = this.mode === 'markdown' ? numberedFlashcardRows(normalizeFlashcardPaste(this.input.value)) : this.rowValues();
    const last = values[values.length - 1];
    this.bulkPosition.max = String(values.length + 1);
    this.bulkPosition.value = String(Math.max(1, values.length + (last && !last.question.trim() && !last.answer.trim() ? 0 : 1)));
    this.bulkHost.hidden = false; this.bulkInput.value = text; this.updateBulkCount(); this.bulkInput.focus();
  }
  updateBulkCount() {
    const batch = flashcardPasteBatch(this.bulkInput.value);
    this.bulkStatus.textContent = batch.errors.length ? `Confira a linha ${batch.errors[0]}: use Pergunta == Resposta. Nenhum cartão foi importado.` : `${batch.cards.length} cartões prontos para adicionar`;
  }
  pasteBatch(event) {
    if (event.defaultPrevented || this.busy || this.target || event.target === this.bulkInput) return;
    const text = event.clipboardData?.getData('text/plain'); if (!text) return;
    const batch = flashcardPasteBatch(text);
    if (this.mode === 'markdown') {
      if (event.target === this.input && text.trim() !== batch.source && batch.cards.length && !batch.errors.length) {
        event.preventDefault(); event.stopPropagation();
        this.input.setRangeText(batch.source, this.input.selectionStart, this.input.selectionEnd, 'end'); this.updateCount();
      }
      return;
    }
    const row = this.rows.find(row => event.target === row.question || event.target === row.answer);
    const wholeEmptyQuestion = row && !row.answer.value.trim() && event.target === row.question && row.question.selectionStart === 0 && row.question.selectionEnd === row.question.value.length;
    const hasBatch = batch.cards.length >= 2 || /\n/.test(batch.source) && batch.cards.length >= 1 || batch.cards.length === 1 && (wholeEmptyQuestion || row && !row.question.value.trim() && !row.answer.value.trim());
    if (!hasBatch) return;
    event.preventDefault(); event.stopPropagation();
    if (batch.errors.length) { this.openBulkPaste(text); return; }
    this.insertPastedCards(batch.source, wholeEmptyQuestion ? row : row && !row.question.value.trim() && !row.answer.value.trim() ? row : null, row);
  }
  importBulkPaste() {
    const batch = flashcardPasteBatch(this.bulkInput.value);
    if (!batch.cards.length || batch.errors.length) { this.updateBulkCount(); this.bulkInput.focus(); return false; }
    if (this.mode === 'markdown') this.loadRows(this.input.value);
    const position = Number(this.bulkPosition.value);
    if (!Number.isInteger(position) || position < 1 || position > this.rows.length + 1) {
      this.bulkStatus.textContent = `Escolha uma posição de 1 a ${this.rows.length + 1}.`; this.bulkPosition.focus(); return false;
    }
    const candidate = this.rows[position - 1];
    const placeholder = candidate && !candidate.question.value.trim() && !candidate.answer.value.trim() ? candidate : null;
    this.insertPastedCards(batch.source, placeholder, null, position - 1); this.bulkHost.hidden = true; return true;
  }
  insertPastedCards(source, placeholder = null, after = null, at = null) {
    if (this.busy) return;
    const values = numberedFlashcardRows(source); if (!values.length) return;
    let index = at ?? (placeholder ? this.rows.indexOf(placeholder) : after ? this.rows.indexOf(after) + 1 : this.rows.length);
    index = Math.max(0, index);
    const replaced = placeholder ? { data: { question: placeholder.question.value, answer: placeholder.answer.value }, index } : null;
    if (placeholder) { this.rows.splice(index, 1); placeholder.el.remove(); }
    this.loadingRows = true; const inserted = [];
    for (const data of values) inserted.push(this.addRow(data, index++, false));
    this.loadingRows = false; this.lastPaste = { inserted, replaced }; this.undoPasteButton.hidden = false;
    this.mode = 'cards'; this.renumber(); this.showMode();
    inserted[0].question.focus(); inserted[0].el.scrollIntoView({ block: 'nearest' });
    this.status.textContent = `${inserted.length} cartões adicionados · ${this.rows.length} no total · Clique em Salvar na nota`;
  }
  undoBulkPaste() {
    if (!this.lastPaste) return;
    const { inserted, replaced } = this.lastPaste; this.lastPaste = null;
    for (const row of inserted) { const index = this.rows.indexOf(row); if (index >= 0) { this.rows.splice(index, 1); row.el.remove(); } }
    if (replaced) this.addRow(replaced.data, Math.min(replaced.index, this.rows.length), false);
    if (!this.rows.length) this.addRow({ question: '', answer: '' }, 0, false);
    this.undoPasteButton.hidden = true; this.renumber(); this.updateCount();
  }
  loadRows(source) {
    this.lastPaste = this.removed = null;
    if (this.undoPasteButton) this.undoPasteButton.hidden = true;
    if (this.undoButton) this.undoButton.hidden = true;
    this.cardsHost.empty(); this.rows = []; this.loadingRows = true;
    const data = numberedFlashcardRows(normalizeFlashcardPaste(source));
    for (const row of data.length ? data : [{ question: '', answer: '' }]) this.addRow(row, this.rows.length, false);
    this.loadingRows = false; this.renumber(); this.updateCount();
    for (const row of this.rows.slice(0, 3)) { this.resizeInput(row.question); this.resizeInput(row.answer); }
  }
  addRow(data = { question: '', answer: '' }, index = this.rows.length, focus = true) {
    const row = { el: this.cardsHost.createDiv({ cls: 'ia-numbered-card' }) };
    const heading = row.el.createDiv({ cls: 'ia-numbered-card-heading' });
    row.number = heading.createSpan({ cls: 'ia-numbered-card-number' });
    const actions = heading.createDiv({ cls: 'ia-card-order-actions' });
    const placement = actions.createEl('label', { cls: 'ia-card-position' }); placement.hidden = Boolean(this.target);
    placement.createSpan({ text: 'Mover para' });
    row.position = placement.createEl('input', { attr: { type: 'number', min: '1', step: '1' } });
    row.position.onchange = () => this.moveRow(row, Number(row.position.value));
    const remove = this.view.button(actions, 'Remover', 'trash-2', () => {
      this.removed = { data: { question: row.question.value, answer: row.answer.value }, index: this.rows.indexOf(row) };
      this.rows.splice(this.rows.indexOf(row), 1); row.el.remove(); this.undoButton.hidden = false;
      if (!this.rows.length) this.addRow({ question: '', answer: '' }, 0, false);
      this.renumber(); this.updateCount();
    }); remove.addClass('ia-numbered-card-remove');
    const fields = row.el.createDiv({ cls: 'ia-numbered-card-fields' });
    const question = fields.createEl('label', { cls: 'ia-numbered-card-field' }); question.createSpan({ text: 'Pergunta' });
    row.question = question.createEl('textarea', { attr: { rows: '2', placeholder: 'Escreva sua pergunta…', spellcheck: 'true' } }); row.question.value = data.question;
    const answer = fields.createEl('label', { cls: 'ia-numbered-card-field' }); answer.createSpan({ text: 'Resposta · Markdown' });
    row.answer = answer.createEl('textarea', { attr: { rows: '2', placeholder: 'Escreva a resposta…', spellcheck: 'true' } }); row.answer.value = data.answer;
    if (index < this.rows.length) this.cardsHost.insertBefore(row.el, this.rows[index].el);
    this.rows.splice(index, 0, row);
    for (const input of [row.question, row.answer]) {
      input.onfocus = () => { this.activeInput = input; this.resizeInput(input); };
      input.oninput = () => { if (this.app.reviewInteractions) this.app.reviewInteractions.scheduleTyping(this, input); else { this.resizeInput(input); this.updateCount(); } };
      input.onkeydown = event => {
        if (this.keydown(event, input, row)) return;
        if (event.isComposing) return;
        if (input === row.question && event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); row.answer.focus(); }
        if (input === row.answer && event.key === 'Tab' && !event.shiftKey) {
          if (this.target) return;
          event.preventDefault(); const next = this.rows[this.rows.indexOf(row) + 1]; if (next) next.question.focus(); else this.addRow();
        }
      };
    }
    if (!this.loadingRows) {
      this.renumber(); if (this.status) this.updateCount();
      for (const input of [row.question, row.answer]) this.resizeInput(input);
    }
    if (focus) { this.mode = 'cards'; this.showMode(); row.question.focus(); row.el.scrollIntoView({ block: 'nearest' }); }
    return row;
  }
  resizeInput(input) { input.style.height = 'auto'; input.style.height = `${Math.min(240, Math.max(70, input.scrollHeight))}px`; }
  renumber() {
    this.rows.forEach((row, i) => { row.number.textContent = `${i + 1}.`; row.question.setAttribute('aria-label', `Pergunta do cartão ${i + 1}`); row.answer.setAttribute('aria-label', `Resposta do cartão ${i + 1}`); row.position.value = String(i + 1); row.position.max = String(this.rows.length); row.position.setAttribute('aria-label', `Mover cartão ${i + 1} para a posição`); });
    if (this.bulkPosition) this.bulkPosition.max = String(this.rows.length + 1);
  }
  moveRow(row, position) {
    if (this.target || this.busy) return;
    if (!Number.isInteger(position) || position < 1 || position > this.rows.length) { this.renumber(); this.status.textContent = `Escolha uma posição de 1 a ${this.rows.length}.`; return; }
    const previous = this.rows.indexOf(row); if (previous < 0) return;
    this.rows.splice(previous, 1); this.rows.splice(position - 1, 0, row);
    this.cardsHost.insertBefore(row.el, this.rows[position]?.el || null);
    this.renumber(); this.updateCount(); row.el.scrollIntoView({ block: 'nearest' });
    this.status.textContent = `Cartão movido para a posição ${position}. Clique em Salvar na nota.`;
  }
  rowValues() { return this.rows.map(row => ({ question: row.question.value, answer: row.answer.value })); }
  source() { return this.mode === 'markdown' ? normalizeFlashcardPaste(this.input.value) : serializeFlashcardRows(this.rowValues()); }
  showMode() {
    this.previewHost.hidden = true; this.preview?.unload(); this.preview = null;
    this.cardsHost.hidden = this.mode !== 'cards'; this.input.hidden = this.mode !== 'markdown'; this.additions.hidden = this.mode !== 'cards' || Boolean(this.target);
    this.cardsButton.setAttribute('aria-pressed', String(this.mode === 'cards')); this.markdownButton.setAttribute('aria-pressed', String(this.mode === 'markdown')); this.updateCount();
  }
  switchMode(mode) {
    if (mode === this.mode) { this.showMode(); return; }
    if (mode === 'markdown') this.input.value = serializeFlashcardRows(this.rowValues());
    else this.loadRows(this.input.value);
    this.mode = mode; this.showMode();
    const input = mode === 'markdown' ? this.input : this.rows[0]?.question; input?.focus();
  }
  wrap(before, after = before) {
    const input = this.activeInput && !this.activeInput.hidden && this.activeInput.isConnected ? this.activeInput : this.mode === 'markdown' ? this.input : this.rows[0]?.question;
    if (!input) return; const start = input.selectionStart, end = input.selectionEnd;
    input.setRangeText(before + input.value.slice(start, end) + after, start, end, 'select'); input.focus(); this.resizeInput(input); this.updateCount();
  }
  keydown(event, input, row) {
    if (event.isComposing || !(event.ctrlKey || event.metaKey)) return false;
    if (event.key.toLowerCase() === 'b') { event.preventDefault(); this.activeInput = input; this.wrap('**'); return true; }
    if (event.key.toLowerCase() === 'i') { event.preventDefault(); this.activeInput = input; this.wrap('*'); return true; }
    if (event.key === 'Enter' || event.code === 'NumpadEnter') {
      event.preventDefault();
      if (event.shiftKey || this.mode === 'markdown') this.save(false);
      else if (this.target) this.save(false);
      else this.addRow({ question: '', answer: '' }, row ? this.rows.indexOf(row) + 1 : this.rows.length);
      return true;
    }
    return false;
  }
  updateCount() {
    if (!this.status) return;
    if (this.mode === 'cards') {
      const values = this.rowValues(), incomplete = values.findIndex(row => (row.question.trim() || row.answer.trim()) && (!row.question.trim() || !row.answer.trim() || /[\r\n]/.test(row.question)));
      this.rows.forEach((row, i) => row.el.classList.toggle('is-incomplete', i === incomplete));
      const count = values.filter(row => row.question.trim() || row.answer.trim()).length;
      this.status.textContent = incomplete >= 0 ? `Complete a pergunta e a resposta do cartão ${incomplete + 1}. A pergunta deve ocupar uma linha.` : this.target ? 'Questão atual · Ctrl+Enter para salvar · [[ para vincular uma nota' : `${count} ${count === 1 ? 'cartão' : 'cartões'} · Ctrl+Enter: próximo · Ctrl+Shift+Enter: salvar`;
    } else {
      const parsed = parseNoteFlashcards(this.source(), this.note.path, true);
      this.status.textContent = parsed.errors.length ? `Confira a linha ${parsed.errors[0]}: use Pergunta == Resposta.` : `${parsed.cards.length} flashcards · Markdown · Ctrl+Enter para salvar`;
    }
  }
  async togglePreview() {
    const showing = this.previewHost.hidden;
    if (!showing) { this.showMode(); return; }
    this.previewHost.hidden = false; this.cardsHost.hidden = this.input.hidden = this.additions.hidden = true;
    this.preview?.unload(); this.previewHost.empty();
    const card = parseNoteFlashcards(this.source(), this.note.path).cards[0];
    if (!card) { this.previewHost.createEl('p', { text: 'Preencha a pergunta e a resposta para visualizar o primeiro cartão.' }); return; }
    this.preview = new Component(); this.preview.load();
    this.previewHost.createDiv({ cls: 'ia-eyebrow', text: 'PRÉVIA DO PRIMEIRO CARTÃO' });
    const question = this.previewHost.createDiv({ cls: 'ia-flash-question' }), answer = this.previewHost.createDiv({ cls: 'ia-flash-answer' });
    await Promise.all([MarkdownRenderer.render(this.app, card.question, question, this.note.path, this.preview), MarkdownRenderer.render(this.app, card.answer, answer, this.note.path, this.preview)]).catch(error => new Notice(error.message));
  }
  async save(study) {
    if (this.busy || !this.input) return;
    if (!this.bulkHost.hidden && this.bulkInput.value.trim() && !this.importBulkPaste()) return;
    if (this.mode === 'cards') {
      const bad = this.rowValues().findIndex(row => (row.question.trim() || row.answer.trim()) && (!row.question.trim() || !row.answer.trim() || /[\r\n]/.test(row.question)));
      if (bad >= 0) { this.showMode(); this.status.textContent = `Complete a pergunta e a resposta do cartão ${bad + 1}.`; (!this.rows[bad].question.value.trim() ? this.rows[bad].question : this.rows[bad].answer).focus(); return; }
    }
    const source = this.source(), parsed = parseNoteFlashcards(source, this.note.path, true);
    if (parsed.errors.length) { this.status.textContent = `Confira ${this.mode === 'cards' ? 'o cartão' : 'a linha'} ${parsed.errors[0]}: pergunta e resposta devem estar completas.`; return; }
    if (this.target && !parsed.cards.length) { this.status.textContent = 'Preencha a pergunta e a resposta da questão antes de salvar.'; return; }
    this.busy = true; this.saveButton.disabled = this.studyButton.disabled = true;
    try {
      await this.app.vault.process(this.note, text => {
        if (!this.target) return writeNoteFlashcardBlock(text, this.original, source);
        if (/<!--\s*image-atlas-(?:flashcards|visual):/.test(source)) throw new Error('Cole apenas o cartão, sem os marcadores internos do ROMUS.');
        // Recover all rows from editors opened with the old bulk controls exposed.
        // Replace only the original question; keep every other card and note section.
        const oldLines = this.targetText.split(/\r?\n/), lines = text.split(/\r?\n/), start = Number(this.target.id.match(/:line:(\d+)$/)[1]) - 1;
        let end = start + 1; while (end < oldLines.length && /^(?: {2}|\t)/.test(oldLines[end])) end++;
        const fragment = oldLines.slice(start, end).join('\n');
        if (lines.slice(start, end).join('\n') !== fragment) throw new Error('A nota mudou enquanto você editava. Reabra esta questão antes de salvar.');
        lines.splice(start, end - start, ...source.split('\n'));
        return lines.join(text.includes('\r\n') ? '\r\n' : '\n');
      });
      await this.options.onWritten?.(parsed.cards[0]);
      if (this.view.plugin.registerNoteDeck) {
        try { await this.view.plugin.registerNoteDeck(this.note); }
        catch (error) { new Notice(`Cartões salvos na nota; cadastro FSRS pendente: ${error.message}`); }
      }
      if (!this.alive) return;
      await this.options.onSaved?.();
      this.close();
      if (study && !this.options.resumeReview && (!this.target || !this.options.onSaved)) await this.view.plugin.openNoteFlashcardReview(this.note, this.view).catch(error => new Notice(error.message));
      else if (!study) new Notice('Flashcards salvos na nota.');
    } catch (error) { if (this.alive) this.status.textContent = error.message; }
    finally { this.busy = false; if (this.alive) this.saveButton.disabled = this.studyButton.disabled = false; }
  }
  onClose() { this.alive = false; this.closeLinkSuggestions(); this.contentEl.onpaste = null; this.contentEl.removeEventListener('keydown', this.editorShortcut, true); this.contentEl.removeEventListener('input', this.linkInput); this.contentEl.removeEventListener('click', this.linkInput); this.contentEl.removeEventListener('keydown', this.linkKeydown, true); this.preview?.unload(); this.contentEl.empty(); }
}

/** File names own note-card titles; explicit labels on linked topics remain local. */
function reconcileAtlasNoteNames(board, vault, renames = {}, event = null) {
  if (!vault?.getFileByPath || !Array.isArray(board?.nodes)) return false;
  let changed = false; const cache = new Map();
  const basename = path => path.split('/').pop().replace(/\.md$/i, '');
  const resolve = path => {
    if (typeof path !== 'string' || !path.endsWith('.md')) return null;
    if (cache.has(path)) return cache.get(path);
    let current = path; const seen = new Set();
    while (!vault.getFileByPath(current) && typeof renames[current] === 'string' && !seen.has(current)) { seen.add(current); current = renames[current]; }
    const file = vault.getFileByPath(current), result = typeof file?.basename === 'string' && file.extension === 'md' ? file : null;
    cache.set(path, result); return result;
  };
  const set = (object, key, value) => { if (object[key] !== value) { object[key] = value; changed = true; } };
  const own = resolve(board.visualNotePath); if (own) set(board, 'visualNotePath', own.path);
  const index = resolve(board.indexPath); if (index) set(board, 'indexPath', index.path);
  for (const node of board.nodes) {
    const priorPath = node.visualNote || (node.path?.endsWith('.md') ? node.path : node.visualSource), file = resolve(priorPath);
    if (file) {
      const previous = node.noteTitle || (event?.file.path === file.path ? basename(event.oldPath) : file.path !== priorPath ? basename(priorPath) : null);
      const canonical = node.type === 'note';
      // Renaming a label on the whiteboard opts that topic out of title following.
      if (canonical || !node.title || node.title === previous) set(node, 'title', file.basename);
      set(node, 'noteTitle', file.basename);
    }
    for (const key of ['path', 'visualNote', 'visualSource']) { const target = resolve(node[key]); if (target) set(node, key, target.path); }
    for (const pin of node.pins || []) {
      const target = resolve(pin.notePath); if (!target) continue;
      const previous = pin.noteTitle || (event?.file.path === target.path ? basename(event.oldPath) : pin.notePath !== target.path ? basename(pin.notePath) : null);
      if (pin.label === previous) set(pin, 'label', target.basename);
      set(pin, 'noteTitle', target.basename); set(pin, 'notePath', target.path);
    }
  }
  return changed;
}
function atlasNotePreviewText(raw, limit = 8000) {
  const text = raw.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '').replace(/<!-- image-atlas-visual:start -->[\s\S]*?<!-- image-atlas-visual:end -->/g, '').trim();
  return { text: text.slice(0, limit), truncated: text.length > limit };
}
function atlasSearchText(text) { return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(); }
/** Compact title/path/text index. Markdown notes and image bytes are never read. */
function atlasBoardSearchRows(board, file) {
  if (!Array.isArray(board?.nodes) || board.visualRoot) return [];
  const title = board.title || file.basename, byId = new Map(board.nodes.filter(n => n && typeof n.id === 'string').map(n => [n.id, n]));
  const rows = [];
  const add = (nodeId, name, kind, path = '', context = '', body = '', pinId = '') => {
    const row = { boardPath: file.path, boardTitle: title, nodeId, title: String(name), kind, path, context, pinId };
    row.nameKey = atlasSearchText(row.title); row.searchKey = atlasSearchText([name, path, context, title, body].join(' ')); rows.push(row);
  };
  add('', title, 'Whiteboard', file.path);
  for (const node of byId.values()) {
    const path = node.visualNote || node.path || '', fallback = path.split('/').pop()?.replace(/\.[^.]+$/, '');
    const name = node.title || fallback || (node.type === 'mind' ? 'Tópico' : 'Cartão');
    if (!['mind', 'note', 'image', 'whiteboard', 'web'].includes(node.type)) continue;
    const ancestors = [], seen = new Set([node.id]); let cursor = byId.get(node.parentId);
    while (cursor && !seen.has(cursor.id) && ancestors.length < 12) { ancestors.unshift(cursor.title || 'Tópico'); seen.add(cursor.id); cursor = byId.get(cursor.parentId); }
    add(node.id, name, node.type === 'mind' ? (node.parentId ? 'Tópico do mapa' : 'Mapa mental') : node.type === 'note' ? 'Nota' : node.type === 'image' ? 'Imagem / nota visual' : node.type === 'whiteboard' ? 'Subwhiteboard' : 'Página', path, ancestors.join(' › '), String(node.body || '').slice(0, 1800));
    for (const pin of node.pins || []) if (pin?.label) add(node.id, pin.label, 'Alfinete', pin.notePath || '', name, '', pin.id);
  }
  return rows;
}
function atlasSearchResults(rows, query) {
  const clean = atlasSearchText(query).trim(), tokens = clean.split(/\s+/).filter(Boolean);
  if (!tokens.length) return rows.filter(row => !row.nodeId).slice(0, 60);
  return rows.filter(row => tokens.every(token => row.searchKey.includes(token))).map(row => ({ row, score: (row.nameKey === clean ? 100 : row.nameKey.startsWith(clean) ? 80 : row.nameKey.includes(clean) ? 65 : tokens.every(token => row.nameKey.includes(token)) ? 50 : 10) - (row.boardPath.includes('.sync-conflict-') ? 5 : 0) })).sort((a, b) => b.score - a.score || a.row.title.localeCompare(b.row.title) || a.row.boardTitle.localeCompare(b.row.boardTitle)).slice(0, 80).map(item => item.row);
}
function atlasSearchRevealPlan(board, target) {
  const byId = new Map(board.nodes.map(n => [n.id, n])), visited = new Set(), changes = new Map(), maps = new Set(), stack = [target];
  const nested = board.nodes.filter(n => n.nestedOnly && n.visualParents?.length).map(root => ({ root, ids: new Set(reusableNodes(board, root).map(n => n.id)) }));
  const change = (node, key, value) => { if (node[key] !== value) { if (!changes.has(node)) changes.set(node, {}); changes.get(node)[key] = value; } };
  while (stack.length) {
    const node = stack.pop(); if (!node || visited.has(node.id)) continue; visited.add(node.id);
    if (node.type === 'mind') {
      if (node.collapsed) { change(node, 'collapsed', false); maps.add(node.mapId); }
      if (node.pinHidden) { change(node, 'pinHidden', false); maps.add(node.mapId); }
      stack.push(byId.get(node.parentId), byId.get(node.mapId));
    }
    for (const { root, ids } of nested) if (ids.has(node.id)) {
      const parent = byId.get(root.visualChildOf) || root.visualParents.map(id => byId.get(id)).find(n => n?.linkedVisualRoot === root.id);
      if (parent) { change(parent, 'visualExpanded', true); if (parent.visualCollapsed) change(parent, 'visualCollapsed', false); stack.push(parent); }
    }
  }
  return { changes, maps };
}
class AtlasBoardSearchModal extends Modal {
  constructor(plugin) { super(plugin.app); this.plugin = plugin; this.alive = true; this.matches = []; this.index = 0; }
  onOpen() {
    this.modalEl.addClass('ia-board-search'); this.setTitle('Buscar nos whiteboards');
    this.contentEl.createEl('p', { cls: 'ia-muted', text: 'Encontre notas, mapas e tópicos em todos os quadros. Enter abre o resultado no lugar certo.' });
    this.input = this.contentEl.createEl('input', { cls: 'ia-board-search-input', attr: { type: 'search', placeholder: 'Ex.: Hematuria, PSA, diagnóstico…', 'aria-label': 'Buscar notas e mapas nos whiteboards', autocomplete: 'off' } });
    this.status = this.contentEl.createDiv({ cls: 'ia-muted', attr: { role: 'status', 'aria-live': 'polite' } });
    this.resultsEl = this.contentEl.createDiv({ cls: 'ia-board-search-results', attr: { role: 'listbox', 'aria-label': 'Resultados nos whiteboards' } });
    const footer = this.contentEl.createDiv({ cls: 'ia-board-search-footer' });
    AtlasView.prototype.button.call(this, footer, 'Atualizar busca', 'refresh-cw', () => this.load(true));
    footer.createSpan({ cls: 'ia-muted', text: '↑ ↓ selecionar · Enter abrir · Esc fechar' });
    this.input.oninput = () => { clearTimeout(this.timer); this.timer = setTimeout(() => { this.timer = null; this.filter(); }, 100); };
    this.input.onkeydown = event => {
      if (event.isComposing) return;
      if (['Enter', 'ArrowDown', 'ArrowUp'].includes(event.key) && this.timer) { clearTimeout(this.timer); this.timer = null; this.filter(); }
      if (event.key === 'Enter') { event.preventDefault(); this.choose(this.matches[this.index]); }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); if (this.matches.length) { this.index = (this.index + (event.key === 'ArrowDown' ? 1 : -1) + this.matches.length) % this.matches.length; this.select(); } }
    };
    this.load(); this.input.focus();
  }
  async load(force = false) {
    const token = this.loadToken = (this.loadToken || 0) + 1; this.status.textContent = 'Localizando notas e mapas nos quadros…';
    this.rows = null; this.matches = []; this.resultsEl.empty();
    try {
      const data = await this.plugin.boardSearchIndex(force);
      if (!this.alive || token !== this.loadToken) return;
      this.rows = data.rows; this.boardCount = data.boardCount; this.skipped = data.skipped; this.filter();
    } catch (error) { if (this.alive && token === this.loadToken) this.status.textContent = `Não foi possível pesquisar: ${error.message}`; }
  }
  filter() {
    if (!this.alive || !this.rows) return;
    this.matches = atlasSearchResults(this.rows, this.input.value); this.index = 0; this.resultsEl.empty();
    this.status.textContent = `${this.matches.length === 80 ? 'Até 80' : this.matches.length} resultados · ${this.boardCount} whiteboards${this.skipped ? ` · ${this.skipped} arquivos não puderam ser lidos` : ''}`;
    if (!this.matches.length) this.resultsEl.createDiv({ cls: 'ia-board-search-empty', text: 'Nenhum resultado. Tente outro nome ou uma parte do título.' });
    this.matches.forEach((row, index) => {
      const item = this.resultsEl.createEl('button', { cls: 'ia-board-search-result', attr: { type: 'button', role: 'option', 'aria-selected': String(index === 0) } });
      item.createDiv({ cls: 'ia-board-search-result-title', text: row.title });
      item.createDiv({ cls: 'ia-muted', text: `${row.kind} · Whiteboard: ${row.boardTitle}${row.context ? ` · ${row.context}` : ''}` });
      item.createDiv({ cls: 'ia-board-search-path', text: row.boardTitle });
      item.onclick = () => this.choose(row);
    });
  }
  select() {
    [...this.resultsEl.children].forEach((el, i) => el.setAttribute('aria-selected', String(i === this.index)));
    this.resultsEl.children[this.index]?.scrollIntoView({ block: 'nearest' });
  }
  async choose(row) {
    if (!row || this.opening) return;
    this.opening = true;
    try { await this.plugin.openBoardSearchResult(row); this.close(); }
    catch (error) { this.status.textContent = error.message; }
    finally { this.opening = false; }
  }
  onClose() { this.alive = false; this.loadToken++; clearTimeout(this.timer); this.rows = null; this.matches = []; this.contentEl.empty(); }
}

/** Native picker searches existing vault files; image bytes never leave the vault. */
class FilePicker extends SuggestModal {
  constructor(app, files, choose, placeholder) { super(app); this.files = files; this.choose = choose; this.setPlaceholder(placeholder); }
  getSuggestions(query) { return this.files.filter(f => this.app.vault.getFileByPath(f.path) === f && (f.extension !== 'md' || !this.app.noteCatalog || this.app.noteCatalog.isMainNote(f) || this.app.media?.byNote(f)) && f.path.toLocaleLowerCase().includes(query.toLocaleLowerCase())).slice(0, 70); }
  renderSuggestion(file, el) { el.createDiv({ text: file.basename }); el.createDiv({ text: this.app.displayFileLabel?.(file) || file.basename, cls: 'ia-muted' }); }
  onChooseSuggestion(file) { this.choose(file); }
}

/** A short native form creates a pin summary or links an existing note. */
class PinModal extends Modal {
  constructor(view, image, u, v, anchor, committed) { super(view.app); this.view = view; this.image = image; this.u = u; this.v = v; this.anchor = anchor; this.committed = committed; this.color = COLORS[image.pins.length % COLORS.length]; this.busy = false; }
  onOpen() {
    this.setTitle(this.image.type === 'web' ? 'Marcar um ponto da página' : 'Marcar uma região da imagem');
    this.contentEl.addClass('ia-pin-modal');
    this.contentEl.createEl('label', { text: 'O que você quer criar neste alfinete?' });
    this.kind = this.contentEl.createEl('select');
    this.kind.createEl('option', { value: 'note', text: 'Nota Markdown' });
    this.kind.createEl('option', { value: 'mind', text: 'Mapa mental' });
    this.contentEl.createEl('label', { text: 'Nome da região' });
    this.nameInput = this.contentEl.createEl('input', { type: 'text', attr: { placeholder: 'Ex.: Riñón, néfron, artéria renal…' } });
    this.summaryLabel = this.contentEl.createEl('label', { text: 'Resumo inicial · Markdown' });
    this.summary = this.contentEl.createEl('textarea', { attr: { placeholder: 'Escreva seu resumo aqui, ou edite a nota depois no Obsidian.', rows: '6' } });
    const colorRow = this.contentEl.createDiv({ cls: 'ia-form-color' });
    colorRow.createSpan({ text: 'Cor do alfinete' });
    const color = colorRow.createEl('input', { type: 'color', value: this.color });
    color.oninput = () => { this.color = color.value; };
    const actions = this.contentEl.createDiv({ cls: 'ia-modal-actions' });
    this.linkButton = actions.createEl('button', { text: 'Vincular nota existente' });
    this.linkButton.onclick = () => {
      new FilePicker(this.app, this.app.vault.getMarkdownFiles(), file => this.commit(file), 'Buscar uma nota…').open();
    };
    this.createButton = actions.createEl('button', { text: 'Criar resumo', cls: 'mod-cta' });
    this.createButton.onclick = () => this.commit();
    this.kind.onchange = () => {
      const mind = this.kind.value === 'mind'; this.linkButton.textContent = mind ? 'Usar nota da biblioteca como nó central' : 'Vincular nota existente';
      this.createButton.textContent = mind ? 'Criar mapa mental' : 'Criar resumo';
      this.summaryLabel.textContent = mind ? 'Texto do nó central (opcional)' : 'Resumo inicial · Markdown';
    };
    this.nameInput.focus();
  }
  async commit(existing) {
    if (this.busy || !this.view.file || !this.view.board.nodes.includes(this.image)) return;
    const label = this.nameInput.value.trim() || existing?.basename;
    if (!label) { new Notice('Dê um nome à região.'); this.nameInput.focus(); return; }
    this.busy = true; this.createButton.disabled = this.linkButton.disabled = true;
    try {
      if (this.kind.value === 'mind') {
        this.view.checkpoint();
        const pin = { id: uid(), label, u: this.u, v: this.v, color: this.color, notePath: '' };
        if (this.area) pin.area = this.area;
        if (this.anchor) pin.anchor = this.anchor;
        this.image.pins.push(pin);
        const root = this.view.makeMindMap(label, this.summary.value.trim(), { x: this.image.x + this.image.w + 130, y: this.image.y + this.v * this.image.h });
        if (existing) root.path = existing.path;
        pin.mapRoot = root.id;
        this.view.board.edges.push({ id: uid(), from: { node: this.image.id, pin: pin.id }, to: { node: root.id }, color: pin.color });
        this.view.placePinMap(this.image, root);
        this.view.mode = 'select'; this.view.selected = { node: root.id }; this.view.changed(true); this.view.render(); this.view.focusNode(root); this.close(); this.committed?.(pin); if (existing) this.view.persistMindRoot(root).catch(error => new Notice(error.message)); return;
      }
      let note = existing;
      if (!note) {
        await this.view.plugin.folder(`${ROOT}/Resumos`);
        const path = this.view.plugin.unique(`${ROOT}/Resumos/${namePart(label)}.md`);
        const source = this.app.vault.getFileByPath(this.image.path);
        const url = safeUrl(this.anchor?.url || this.image.path);
        const origin = source ? this.app.fileManager.generateMarkdownLink(source, path) : url ? `<${url}>` : '';
        const index = this.app.vault.getFileByPath(this.view.board.indexPath);
        const boardLink = index ? this.app.fileManager.generateMarkdownLink(index, path) : '';
        note = await this.app.vault.create(path, `# ${label}\n\n${this.summary.value.trim()}\n\n---\n${this.image.type === 'web' ? 'Página' : 'Imagem'} de origem: ${origin}\n\nQuadro: ${boardLink}\n`);
      }
      if (!this.view.file || !this.view.board.nodes.includes(this.image)) { new Notice('A nota foi salva. Reabra o quadro para vinculá-la.'); this.close(); return; }
      this.view.checkpoint();
      const pin = { id: uid(), label, u: this.u, v: this.v, color: this.color, notePath: note.path };
      if (this.area) pin.area = this.area;
      if (this.anchor) pin.anchor = this.anchor;
      this.image.pins.push(pin);
      this.view.selected = { node: this.image.id, pin: pin.id }; this.view.mode = 'select';
      this.view.changed(true); this.view.render(); this.view.showPin(this.image, pin); this.close();
      this.committed?.(pin);
    } catch (error) { new Notice(`Não foi possível criar a marcação: ${error.message}`); }
    finally { this.busy = false; this.createButton.disabled = this.linkButton.disabled = false; }
  }
}

/** Small form shared by standalone maps and individual branches. */
class SubboardModal extends Modal {
  constructor(view) { super(view.app); this.view = view; this.board = view.board; }
  onOpen() {
    this.setTitle('Adicionar subwhiteboard');
    this.view.button(this.contentEl, 'Vincular whiteboard existente', 'folder-input', () => {
      this.close(); new FilePicker(this.app, this.app.vault.getFiles().filter(f => f.extension === 'imageboard' && f !== this.view.file), file => { if (this.view.board === this.board) this.view.addSubboard(file); }, 'Escolher whiteboard…').open();
    });
    this.contentEl.createEl('p', { text: 'Ou crie um novo whiteboard:' });
    const input = this.contentEl.createEl('input', { type: 'text', attr: { placeholder: 'Ex.: Vejiga, Próstata, Infecciones Urinarias', 'aria-label': 'Nome do novo subwhiteboard' } });
    const button = this.contentEl.createEl('button', { text: 'Criar e adicionar', cls: 'mod-cta' });
    const create = async () => {
      if (button.disabled || !input.value.trim() || this.view.board !== this.board) return;
      button.disabled = true;
      try { const file = await this.view.plugin.createBoardFile(input.value.trim()); if (this.view.board === this.board) this.view.addSubboard(file); this.close(); }
      catch (error) { new Notice(error.message); button.disabled = false; }
    };
    button.onclick = create; input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); create(); } }; input.focus();
  }
  onClose() { this.contentEl.empty(); }
}
class BoardRenameModal extends Modal {
  constructor(view) { super(view.app); this.view = view; this.board = view.board; this.file = view.file; }
  onOpen() {
    this.setTitle('Renomear whiteboard');
    const input = this.contentEl.createEl('input', { type: 'text', value: this.file.basename, attr: { 'aria-label': 'Novo nome do whiteboard' } });
    const status = this.contentEl.createEl('p', { cls: 'ia-muted' });
    const button = this.contentEl.createEl('button', { text: 'Renomear', cls: 'mod-cta' });
    const commit = async () => {
      if (button.disabled) return;
      const title = input.value.trim().replace(/\.imageboard$/i, '').trim();
      if (!title || /[\\/:*?"<>|\r\n]/.test(title) || /[. ]$/.test(title) || title === '.' || title === '..') { status.textContent = 'Digite um nome válido, sem barras ou caracteres especiais de arquivo.'; input.focus(); return; }
      const view = this.view;
      if (view.board !== this.board || view.file !== this.file) { status.textContent = 'O quadro mudou. Reabra esta opção no quadro desejado.'; return; }
      const folder = this.file.parent?.path || '', path = normalizePath(`${folder ? folder + '/' : ''}${title}.imageboard`);
      const existing = this.app.vault.getAbstractFileByPath(path);
      if (existing && existing !== this.file) { status.textContent = 'Já existe um arquivo com esse nome nesta pasta.'; return; }
      button.disabled = true;
      try {
        if (path !== this.file.path) await this.app.fileManager.renameFile(this.file, path);
        this.board.title = title;
        if (view.board === this.board && view.file === this.file) { view.changed(false, false); view.render(); }
        this.close();
      } catch (error) { status.textContent = `Não foi possível renomear: ${error.message}`; button.disabled = false; }
    };
    button.onclick = commit; input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }; input.focus(); input.select();
  }
  onClose() { this.contentEl.empty(); }
}
class AtlasGroupModal extends Modal {
  constructor(view, group, save) { super(view.app); this.view = view; this.board = view.board; this.group = group; this.save = save; }
  onOpen() {
    this.setTitle(this.group ? 'Editar grupo' : 'Criar grupo');
    this.contentEl.createEl('label', { text: 'Nome do grupo' });
    const name = this.contentEl.createEl('input', { type: 'text', value: this.group?.title || 'Anatomia' });
    this.contentEl.createEl('label', { text: 'Cor' });
    const color = this.contentEl.createEl('input', { type: 'color', value: this.group?.color || COLORS[0] });
    const commit = () => { if (this.view.board !== this.board || !name.value.trim()) return; this.save(name.value.trim(), color.value); this.close(); };
    this.contentEl.createEl('button', { text: 'Salvar', cls: 'mod-cta' }).onclick = commit;
    name.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }; name.focus(); name.select();
  }
  onClose() { this.contentEl.empty(); }
}
class MindTextModal extends Modal {
  constructor(view, title, body, save, linked = false) { super(view.app); this.view = view; this.board = view.board; this.initialTitle = title; this.initialBody = body; this.save = save; this.linked = linked; }
  onOpen() {
    this.setTitle('Mapa mental'); this.contentEl.addClass('ia-pin-modal');
    this.contentEl.createEl('label', { text: 'Título do nó' });
    const title = this.contentEl.createEl('input', { type: 'text', value: this.initialTitle, attr: { placeholder: 'Ex.: Riñón' } });
    this.contentEl.createEl('label', { text: this.linked ? 'Edite o conteúdo na nota vinculada, pelo editor.' : 'Texto (opcional)' });
    const body = this.contentEl.createEl('textarea', { attr: { rows: '4' } }); body.value = this.initialBody; body.hidden = this.linked;
    const save = this.contentEl.createEl('button', { text: 'Salvar', cls: 'mod-cta' });
    save.onclick = () => { if (this.view.board !== this.board || !this.view.file) { new Notice('Reabra esta ação no quadro atual.'); this.close(); return; } if (!title.value.trim()) { title.focus(); return; } this.save(title.value.trim(), body.value.trim()); this.close(); };
    title.focus(); title.select();
  }
}

class PinActionModal extends Modal {
  constructor(view, image, pin) { super(view.app); this.view = view; this.image = image; this.pin = pin; }
  onOpen() {
    this.setTitle(this.pin.label); this.contentEl.addClass('ia-pin-modal');
    this.contentEl.createEl('p', { text: 'O que você quer abrir ou criar neste alfinete?' });
    const act = kind => { if (this.view.board.nodes.includes(this.image) && this.image.pins.includes(this.pin)) { this.close(); if (kind === 'mind') this.view.mindFromPin(this.image, this.pin); else this.view.noteFromPin(this.image, this.pin); } };
    this.view.button(this.contentEl, 'Nota Markdown', 'file-text', () => act('note'));
    this.view.button(this.contentEl, 'Mapa mental', 'git-fork', () => act('mind'));
  }
}

class MapStartModal extends Modal {
  constructor(view, title, save) { super(view.app); this.view = view; this.board = view.board; this.initialTitle = title; this.save = save; }
  onOpen() {
    this.setTitle('Adicionar mapa mental'); this.contentEl.addClass('ia-pin-modal');
    this.contentEl.createEl('p', { text: 'Como você quer começar o nó central?' });
    const apply = (title, body, path = '') => { if (this.view.board !== this.board || !this.view.file) { new Notice('O quadro mudou. Reabra esta ação.'); return; } this.save(title, body, path); };
    this.view.button(this.contentEl, 'Criar do zero', 'plus', () => { this.close(); new MindTextModal(this.view, this.initialTitle, '', (title, body) => apply(title, body)).open(); });
    this.view.button(this.contentEl, 'Usar nota existente da biblioteca', 'file-text', () => { this.close(); new FilePicker(this.app, this.app.vault.getMarkdownFiles(), async file => {
      try { if (this.view.board !== this.board) return; if (await this.view.plugin.visualSource(file)) { if (this.view.board === this.board) await this.view.addVisualNote(file); } else apply(this.initialTitle || file.basename, '', file.path); }
      catch (error) { new Notice(`Não foi possível abrir a nota: ${error.message}`); }
    }, 'Escolher a nota central do mapa…').open(); });
  }
}

class VisualNoteModal extends Modal {
  constructor(view, image) { super(view.app); this.view = view; this.image = image; this.board = view.board; }
  onOpen() {
    this.setTitle('Vincular imagem à nota Markdown'); this.contentEl.addClass('ia-pin-modal');
    this.contentEl.createEl('p', { text: 'Escolha a nota original. Seu texto será preservado; a imagem, marcações e mapas passarão a acompanhar essa nota nos whiteboards.' });
    const link = file => { if (this.view.board !== this.board || !this.board.nodes.includes(this.image)) return; this.close(); this.view.saveVisualNote(this.image, file); };
    const roots = this.image.pins.map(p => this.board.nodes.find(n => n.id === p.mapRoot));
    const existing = roots.map(n => n?.path).find(Boolean), file = existing && this.app.vault.getFileByPath(existing);
    if (file) this.view.button(this.contentEl, `Usar nota vinculada: ${file.basename}`, 'file-text', () => link(file));
    this.view.button(this.contentEl, 'Escolher nota Markdown original', 'link', () => { this.close(); new FilePicker(this.app, this.app.vault.getMarkdownFiles(), link, 'Escolher a nota original…').open(); });
    this.view.button(this.contentEl, 'Criar nova nota Markdown', 'file-plus', () => link(null));
  }
}

class ImageNameModal extends Modal {
  constructor(view, image) { super(view.app); this.view = view; this.image = image; this.board = view.board; }
  onOpen() {
    this.setTitle('Renomear imagem no quadro'); this.contentEl.addClass('ia-pin-modal');
    const input = this.contentEl.createEl('input', { type: 'text', value: this.image.title || '', attr: { placeholder: 'Nome da imagem', maxlength: '500' } });
    const save = () => { const title = input.value.trim(); if (!title) { input.focus(); return; } if (this.view.board !== this.board || !this.board.nodes.includes(this.image)) { this.close(); return; } this.view.checkpoint(); this.image.title = title; this.view.changed(true); this.view.render(); this.close(); };
    this.view.button(this.contentEl, 'Salvar nome', 'check', save);
    input.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); save(); } }; input.focus(); input.select();
  }
}

class MapImageModal extends Modal {
  constructor(view, node, imageAsNode = false) { super(view.app); this.view = view; this.board = view.board; this.imageAsNode = imageAsNode; this.root = imageAsNode ? node : this.board.nodes.find(n => n.id === node.mapId && n.type === 'mind'); }
  onOpen() {
    if (!this.root) { this.close(); return; }
    this.closed = false;
    this.setTitle(this.imageAsNode ? 'Imagem deste nó' : 'Transformar mapa em alfinete'); this.contentEl.addClass('ia-pin-modal');
    this.contentEl.createEl('p', { text: this.imageAsNode ? `Cole uma imagem para substituir o cartão “${this.root.title}” no mapa mental, mantendo sua nota.` : `Escolha a imagem para vincular “${this.root.title}”. Depois clique no ponto desejado da imagem.` });
    const choose = image => { if (this.view.board !== this.board || !this.board.nodes.includes(this.root)) return; this.close(); if (this.imageAsNode) this.view.attachImageToMindNode(this.root, image).catch(error => new Notice(error.message)); else this.view.beginMapPin(this.root, image); };
    const hint = this.contentEl.createDiv({ cls: 'ia-muted', text: 'Copie a imagem na internet e pressione Ctrl+V aqui.', attr: { tabindex: '0', role: 'region', 'aria-label': 'Colar imagem com Ctrl+V' } });
    const insert = async files => {
      if (this.busy || this.closed || this.view.board !== this.board || !this.board.nodes.includes(this.root)) return;
      if (!files.length) { hint.textContent = 'Copie a própria imagem (Copiar imagem) e pressione Ctrl+V aqui.'; hint.focus(); return; }
      this.busy = true; hint.textContent = 'Adicionando imagem…';
      try {
        const images = await this.view.importFiles(files.slice(0, 1), { x: this.root.x - 780, y: this.root.y });
        if (!this.closed && images?.[0] && this.view.board === this.board && this.board.nodes.includes(this.root)) choose(images[0]);
        else if (!this.closed) hint.textContent = 'Não foi possível adicionar a imagem. Tente copiar e colar novamente.';
      } catch (error) { if (!this.closed) hint.textContent = error.message; }
      finally { this.busy = false; }
    };
    this.contentEl.onpaste = event => {
      const data = event.clipboardData; if (!data) return;
      const files = Array.from(data.items || []).filter(item => item.kind === 'file' && /^image\//i.test(item.type)).map(item => item.getAsFile()).filter(Boolean);
      if (!files.length) files.push(...Array.from(data.files || []).filter(file => /^image\//i.test(file.type)));
      event.preventDefault(); event.stopPropagation(); insert(files);
    };
    this.view.button(this.contentEl, 'Colar imagem · Ctrl+V', 'clipboard-paste', async () => {
      hint.focus();
      try {
        const clipboard = this.contentEl.ownerDocument.defaultView.navigator.clipboard;
        if (!clipboard?.read) throw new Error('Use Ctrl+V');
        const items = await clipboard.read(), files = [];
        for (const item of items) { const type = item.types.find(type => /^image\//i.test(type)); if (type) { files.push(await item.getType(type)); break; } }
        await insert(files);
      } catch { if (!this.closed) hint.textContent = 'Pressione Ctrl+V nesta janela para colar a imagem copiada.'; }
    });
    if (!this.imageAsNode) for (const image of this.board.nodes.filter(n => n.type === 'image')) this.view.button(this.contentEl, image.title || image.path, 'image', () => choose(image));
    this.view.button(this.contentEl, 'Adicionar imagem da biblioteca', 'image-plus', () => {
      this.close(); new FilePicker(this.app, this.app.vault.getFiles().filter(f => /^(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(f.extension)), async file => {
        if (this.view.board !== this.board || !this.board.nodes.includes(this.root)) return;
        const image = await this.view.addImage(file, { x: this.root.x - 780, y: this.root.y });
        if (image) choose(image);
      }, 'Escolher imagem para o mapa…').open();
    });
    hint.focus();
  }
  onClose() { this.closed = true; this.contentEl.onpaste = null; this.contentEl.empty(); }
}

class EdgeLabelModal extends Modal {
  constructor(view, edge) { super(view.app); this.view = view; this.board = view.board; this.file = view.file; this.edge = edge; }
  onOpen() {
    this.setTitle('Nome da linha'); this.contentEl.addClass('ia-pin-modal');
    const input = this.contentEl.createEl('input', { type: 'text', value: this.edge.label || '', attr: { placeholder: 'Ex.: Indicações', maxlength: '500' } });
    const save = () => {
      if (this.view.file !== this.file) { new Notice('O quadro mudou. Reabra a edição da linha no quadro desejado.'); return; }
      const edge = this.view.board.edges.find(e => e.id === this.edge.id);
      if (!edge) { new Notice('Essa linha foi removida.'); this.close(); return; }
      this.view.checkpoint(); edge.label = input.value.trim(); this.view.changed(); this.view.drawEdges(); this.close();
    };
    this.view.button(this.contentEl, 'Salvar', 'check', save); input.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); save(); } }; input.focus(); input.select();
  }
}

/** Existing node/relation flashcards remain compatible with Markdown note decks. */
class FlashcardModal extends Modal {
  constructor(view, node, initialAnswer, card) { super(view.app); this.view = view; this.node = node; this.board = view.board; this.initialAnswer = initialAnswer; this.card = card; }
  onOpen() {
    this.setTitle(this.card ? 'Editar flashcard' : 'Criar flashcard'); this.contentEl.addClass('ia-pin-modal');
    this.contentEl.createEl('label', { text: 'Pergunta' });
    const question = this.contentEl.createEl('textarea', { attr: { rows: '2', placeholder: 'O que você quer recordar?' } }); question.value = this.card?.question || (this.node.relation ? this.view.relationQuestion(this.node) : `Explique: ${this.node.title || this.node.path.split('/').pop().replace(/\.md$/, '')}`);
    this.contentEl.createEl('label', { text: 'Resposta · Markdown' });
    const answer = this.contentEl.createEl('textarea', { attr: { rows: '6' } }); answer.value = this.card?.answer ?? this.initialAnswer;
    let followChildren;
    if (this.node.relation) {
      const row = this.contentEl.createEl('label', { cls: 'ia-form-color' });
      followChildren = row.createEl('input', { type: 'checkbox' }); followChildren.checked = this.card ? this.card.answerSource === 'children' : true;
      row.createSpan({ text: 'Resposta automática com os títulos dos filhos desta relação' });
      const update = () => { answer.readOnly = followChildren.checked; if (followChildren.checked) answer.value = this.view.relationAnswer(this.node); };
      followChildren.onchange = update; update();
    }
    this.contentEl.createEl('p', { cls: 'ia-muted', text: this.node.relation ? 'A sequência segue a ordem de criação. Com a resposta automática marcada, novos filhos e alterações em seus títulos entram na próxima revisão.' : 'A sequência segue a ordem em que os flashcards são criados. Pergunta e resposta ficam salvas no quadro; editar a nota depois não altera este cartão automaticamente.' });
    const actions = this.contentEl.createDiv({ cls: 'ia-modal-actions' });
    const current = () => this.view.board === this.board && this.board.nodes.includes(this.node) && (!this.card || this.node.flashcards?.includes(this.card));
    if (this.card) this.view.button(actions, 'Remover flashcard', 'trash-2', () => { if (!current()) return; this.view.checkpoint(); this.node.flashcards = this.node.flashcards.filter(c => c.id !== this.card.id); this.view.changed(); this.view.render(); this.close(); });
    this.view.button(actions, 'Salvar flashcard', 'check', () => {
      if (!current()) { new Notice('O quadro mudou. Reabra esta ação.'); this.close(); return; }
      if (followChildren?.checked) answer.value = this.view.relationAnswer(this.node);
      if (!question.value.trim() || !answer.value.trim()) { new Notice(this.node.relation ? 'Adicione filhos à relação e preencha a pergunta.' : 'Preencha a pergunta e a resposta.'); return; }
      this.view.checkpoint();
      let saved = this.card;
      if (saved) { saved.question = question.value.trim(); saved.answer = answer.value.trim(); }
      else {
        const order = this.board.nodes.reduce((max, n) => (n.flashcards || []).reduce((value, c) => Math.max(value, c.order), max), 0) + 1;
        if (!this.node.flashcards) this.node.flashcards = [];
        saved = { id: uid(), question: question.value.trim(), answer: answer.value.trim(), order }; this.node.flashcards.push(saved);
      }
      if (followChildren?.checked) saved.answerSource = 'children'; else delete saved.answerSource;
      this.view.changed(); this.view.render(); this.close();
    }); question.focus(); question.select();
  }
}

/** A sequential self-review session, separate from the editing surface. */
class FlashcardReviewModal extends Modal {
  constructor(view, cards, title, note = null) { super(view.app); this.view = view; this.cards = cards; this.title = title; this.note = note; this.index = 0; this.correct = 0; this.review = 0; this.revealed = false; this.drafts = new Map(); this.again = []; }
  onOpen() { this.modalEl.addClass('ia-flash-review'); this.setTitle(this.title); this.draw(); }
  draw() {
    this.contentEl.onkeydown = null; this.preview?.unload(); this.preview = new Component(); this.preview.load(); this.contentEl.empty();
    const navigation = this.contentEl.createDiv({ cls: 'ia-review-navigation' });
    this.view.button(navigation, 'Voltar ao estudo', 'arrow-left', () => this.close());
    if (this.note) this.view.button(navigation, 'Editar flashcards', 'square-pen', () => { this.close(); new NoteFlashcardEditor(this.view, this.note).open(); });
    const progress = this.contentEl.createDiv({ cls: 'ia-review-progress', attr: { role: 'progressbar', 'aria-label': 'Progresso da revisão', 'aria-valuemin': '0', 'aria-valuemax': String(this.cards.length), 'aria-valuenow': String(this.index) } });
    progress.createDiv({ attr: { style: `width:${this.cards.length ? this.index / this.cards.length * 100 : 0}%` } });
    if (this.index >= this.cards.length) {
      const done = this.contentEl.createDiv({ cls: 'ia-review-finished' });
      done.createDiv({ cls: 'ia-eyebrow', text: 'REVISÃO CONCLUÍDA' }); done.createEl('h2', { text: 'Você chegou ao fim.' });
      done.createEl('p', { text: `${this.cards.length} cartões respondidos` });
      const stats = done.createDiv({ cls: 'ia-review-stats' });
      stats.createDiv({ text: `${this.correct} acertos` }); stats.createDiv({ text: `${this.review} para rever` });
      const restart = cards => { this.cards = cards; this.index = 0; this.correct = this.review = 0; this.revealed = false; this.drafts.clear(); this.again = []; this.draw(); };
      if (this.again.length) this.view.button(done, 'Rever os que faltaram', 'rotate-ccw', () => restart([...this.again]));
      this.view.button(done, 'Responder novamente', 'refresh-cw', () => restart([...this.cards])); return;
    }
    const card = this.cards[this.index], study = this.contentEl.createDiv({ cls: 'ia-review-study' });
    study.createDiv({ cls: 'ia-eyebrow', text: `${this.index + 1} de ${this.cards.length} · ${card.nodeTitle || this.note?.basename || 'Flashcards'}` });
    const question = study.createDiv({ cls: 'ia-flash-question' });
    MarkdownRenderer.render(this.app, card.question, question, card.sourcePath || '', this.preview).catch(() => { if (question.isConnected) question.textContent = card.question; });
    study.createEl('label', { text: 'Sua resposta (opcional)', cls: 'ia-response-label' });
    const input = study.createEl('textarea', { cls: 'ia-flash-response', attr: { rows: '3', placeholder: 'Tente recordar antes de revelar…', 'aria-label': 'Sua resposta' } });
    input.value = this.drafts.get(card.id) || ''; input.oninput = () => this.drafts.set(card.id, input.value);
    const reveal = () => { this.revealed = true; this.draw(); };
    if (!this.revealed) {
      const show = this.view.button(study, 'Mostrar resposta', 'eye', reveal); show.addClass('mod-cta'); show.addClass('ia-review-reveal');
      study.createDiv({ cls: 'ia-muted ia-review-hint', text: 'Ctrl+Enter para revelar a resposta' }); input.focus();
    } else {
      study.createDiv({ cls: 'ia-eyebrow', text: 'RESPOSTA' }); const answer = study.createDiv({ cls: 'ia-summary ia-flash-answer' });
      MarkdownRenderer.render(this.app, card.answer, answer, card.sourcePath || '', this.preview).catch(() => { if (answer.isConnected) answer.textContent = card.answer; });
      const actions = study.createDiv({ cls: 'ia-review-grades' });
      const next = correct => { if (correct) this.correct++; else { this.review++; this.again.push(card); } this.index++; this.revealed = false; this.draw(); };
      const again = this.view.button(actions, 'Rever · 1', 'rotate-ccw', () => next(false)); again.addClass('ia-grade-again');
      const good = this.view.button(actions, 'Acertei · 2', 'check', () => next(true)); good.addClass('ia-grade-good'); good.focus();
      this.contentEl.onkeydown = event => { if (event.target.closest('input,textarea,[contenteditable=true]') || event.ctrlKey || event.metaKey || event.altKey) return; if (event.key === '1' || event.key === '2') { event.preventDefault(); next(event.key === '2'); } };
    }
    if (!this.revealed) this.contentEl.onkeydown = event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); reveal(); } };
  }
  onClose() { this.contentEl.onkeydown = null; this.preview?.unload(); this.contentEl.empty(); if (this.view.reviewModal === this) this.view.reviewModal = null; if (this.view.viewport?.isConnected) this.view.viewport.focus(); }
}

/** Runs only in the isolated page guest. Exchanges bounded data, never host capabilities. */
function installPagePins(config) {
  const previous = window.__imageAtlasPins;
  if (previous?.dispose) previous.dispose();
  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:2147483646';
  document.documentElement.appendChild(root);
  const state = { events: [], marking: Boolean(config.marking), pins: config.pins, root, frame: 0 };
  window.__imageAtlasPins = state;
  const queue = event => { state.events.push(event); if (state.events.length > 20) state.events.shift(); };
  const samePage = url => { try { const a = new URL(url), b = new URL(location.href); return a.origin === b.origin && a.pathname === b.pathname && a.search === b.search; } catch { return false; } };
  const find = anchor => {
    let element = null;
    try { element = document.querySelector(anchor.selector); } catch { return null; }
    if (element && (!anchor.text || (element.innerText || element.alt || '').trim().slice(0, 160) === anchor.text)) return element;
    if (!anchor.text) return null;
    // A bounded repair handles common Wikipedia layout changes without scanning every DOM node.
    const candidates = document.querySelectorAll('p,h1,h2,h3,h4,li,td,img');
    let match = null;
    for (let i = 0; i < Math.min(candidates.length, 2500); i++) {
      const text = (candidates[i].innerText || candidates[i].alt || '').trim().slice(0, 160);
      if (text === anchor.text) { if (match) return null; match = candidates[i]; }
    }
    return match;
  };
  const markers = [];
  for (const [i, pin] of state.pins.entries()) {
    if (!pin.anchor || !samePage(pin.anchor.url)) continue;
    const target = find(pin.anchor);
    if (!target) continue;
    const button = document.createElement('button');
    button.textContent = String(i + 1); button.setAttribute('aria-label', pin.label);
    const color = /^#[0-9a-f]{6}$/i.test(pin.color) ? pin.color : '#a78bfa';
    button.style.cssText = `position:absolute;transform:translate(-50%,-50%);width:29px;height:29px;min-width:29px;padding:0;border:3px solid white;border-radius:50%;background:${color};color:#111827;font:800 12px Arial;box-shadow:0 2px 9px #0006;cursor:pointer;pointer-events:auto`;
    button.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); queue({ kind: 'pin', id: pin.id }); });
    root.appendChild(button); markers.push({ button, target, anchor: pin.anchor });
  }
  const layout = () => {
    state.frame = 0;
    for (const marker of markers) {
      const r = marker.target.getBoundingClientRect();
      marker.button.style.display = r.width && r.height ? '' : 'none';
      marker.button.style.left = `${scrollX + r.left + marker.anchor.rx * r.width}px`;
      marker.button.style.top = `${scrollY + r.top + marker.anchor.ry * r.height}px`;
    }
  };
  const schedule = () => { if (!state.frame) state.frame = requestAnimationFrame(layout); };
  const selectorFor = element => {
    const parts = []; let cursor = element;
    for (let depth = 0; cursor && cursor.nodeType === 1 && depth < 14; depth++, cursor = cursor.parentElement) {
      if (cursor.id) { parts.unshift(`#${CSS.escape(cursor.id)}`); break; }
      let index = 1;
      for (let sibling = cursor.previousElementSibling; sibling; sibling = sibling.previousElementSibling) if (sibling.tagName === cursor.tagName) index++;
      parts.unshift(`${cursor.tagName.toLowerCase()}:nth-of-type(${index})`);
    }
    return parts.join(' > ');
  };
  const mark = event => {
    if (!state.marking || root.contains(event.target) || !(event.target instanceof Element)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const target = event.target.closest('img,p,h1,h2,h3,h4,li,td,figure') || event.target;
    const r = target.getBoundingClientRect(); if (!r.width || !r.height) return;
    const anchor = {
      url: location.href, selector: selectorFor(target), text: (target.innerText || target.alt || '').trim().slice(0, 160),
      rx: Math.max(0, Math.min(1, (event.clientX - r.left) / r.width)), ry: Math.max(0, Math.min(1, (event.clientY - r.top) / r.height)),
    };
    state.marking = false; queue({ kind: 'create', anchor });
  };
  document.addEventListener('click', mark, true);
  window.addEventListener('resize', schedule);
  document.addEventListener('scroll', schedule, { passive: true, capture: true });
  const resize = new ResizeObserver(schedule); if (document.body) resize.observe(document.body);
  state.go = id => { const marker = markers.find(m => state.pins.find(p => p.id === id)?.anchor === m.anchor); if (marker) marker.target.scrollIntoView({ block: 'center', behavior: 'smooth' }); return Boolean(marker); };
  state.dispose = () => {
    document.removeEventListener('click', mark, true); window.removeEventListener('resize', schedule);
    document.removeEventListener('scroll', schedule, true); resize.disconnect();
    if (state.frame) cancelAnimationFrame(state.frame); root.remove();
  };
  layout(); return true;
}

/** Validated URL form; the page loads automatically when its card is visible. */
class WebPageModal extends Modal {
  constructor(view) { super(view.app); this.view = view; }
  onOpen() {
    this.setTitle('Adicionar uma página externa'); this.contentEl.addClass('ia-pin-modal');
    this.contentEl.createEl('label', { text: 'Endereço da página' });
    const url = this.contentEl.createEl('input', { type: 'url', attr: { placeholder: 'https://es.wikipedia.org/wiki/Riñón' } });
    this.contentEl.createEl('label', { text: 'Título no quadro (opcional)' });
    const title = this.contentEl.createEl('input', { type: 'text', attr: { placeholder: 'Ex.: Riñón · Wikipedia' } });
    this.contentEl.createEl('p', { text: 'A página aparecerá aberta dentro do cartão, diretamente no whiteboard.', cls: 'ia-muted' });
    const add = this.contentEl.createEl('button', { text: 'Adicionar ao quadro', cls: 'mod-cta' });
    add.onclick = () => {
      const path = safeUrl(url.value.trim());
      if (!path) { new Notice('Use um endereço completo http:// ou https://.'); return; }
      if (!this.view.file) return;
      const r = this.view.viewport.getBoundingClientRect(), pos = this.view.toWorld(r.left + 100, r.top + 100);
      this.view.checkpoint(); this.view.board.nodes.push({ id: uid(), type: 'web', path, title: title.value.trim() || new URL(path).hostname, x: pos.x, y: pos.y, w: 600, h: 540, pins: [] });
      this.view.changed(true); this.view.render(); this.close();
    }; url.focus();
  }
}

/** One on-demand desktop guest; closing it retires the page, polling and preview component. */
class WebReaderModal extends Modal {
  constructor(view, node, pin) { super(view.app); this.view = view; this.node = node; this.startPin = pin; this.marking = view.mode === 'pin'; this.alive = false; this.busy = false; this.generation = 0; }
  onOpen() {
    this.setTitle(this.node.title || new URL(this.node.path).hostname);
    this.mountReader(this.contentEl, this.modalEl, false);
  }
  mountReader(container, host, inline) {
    this.inline = inline; this.readerHost = host; this.contentEl = container;
    this.alive = true; host.addClass(inline ? 'ia-inline-reader' : 'ia-reader-modal');
    const toolbar = this.contentEl.createDiv({ cls: 'ia-reader-toolbar' });
    this.markButton = this.view.button(toolbar, 'Marcar região da página', 'map-pin-plus', () => this.setMarking(!this.marking));
    this.view.button(toolbar, 'Recarregar', 'rotate-cw', () => { if (typeof this.frame?.reload === 'function') this.frame.reload(); });
    this.view.button(toolbar, 'Abrir no navegador', 'external-link', () => {
      const url = safeUrl(this.currentUrl || this.node.path); if (url) this.app.workspace.openLinkText(url, '');
    });
    if (inline) this.view.button(toolbar, 'Ampliar', 'maximize', () => this.view.openWeb(this.node));
    this.status = toolbar.createSpan({ text: 'Carregando página…', cls: 'ia-muted' });
    const body = this.contentEl.createDiv({ cls: 'ia-reader-body' });
    const mount = body.createDiv({ cls: 'ia-reader-mount' });
    this.sidebar = body.createDiv({ cls: 'ia-reader-sidebar' });
    this.sidebar.onclick = event => {
      const link = event.target.closest('a.internal-link');
      if (!link) return;
      event.preventDefault();
      this.app.workspace.openLinkText(link.getAttribute('data-href') || link.getAttribute('href'), this.selectedNotePath || '', event.ctrlKey || event.metaKey);
    };
    this.preview = new Component(); this.preview.load();
    this.frame = mount.createEl('webview');
    this.frame.setAttribute('webpreferences', 'contextIsolation=yes,nodeIntegration=no,sandbox=yes');
    this.frame.setAttribute('partition', `image-atlas-reader-${uid()}`);
    this.frame.setAttribute('aria-label', this.node.title || 'Página externa');
    this.frame.addEventListener('will-navigate', event => { if (!safeUrl(event.url)) event.preventDefault(); });
    this.frame.addEventListener('dom-ready', () => {
      if (!this.alive) return;
      this.ready = true; this.currentUrl = safeUrl(this.frame.getURL());
      this.applyPageZoom();
      if (!this.currentUrl) { this.status.textContent = 'Endereço não suportado.'; return; }
      this.refresh().then(() => {
        if (this.alive && this.startPin) { this.goToPin(this.startPin); this.startPin = null; }
      });
    });
    this.frame.addEventListener('did-start-loading', () => { this.ready = false; this.generation++; });
    this.frame.addEventListener('did-fail-load', event => { if (event.errorCode !== -3 && event.isMainFrame) { this.ready = false; this.status.textContent = 'Não foi possível carregar. Tente recarregar ou abrir no navegador.'; } });
    this.frame.setAttribute('src', safeUrl(this.startPin?.anchor?.url || this.node.path));
    this.showSummary(this.startPin);
    const win = this.readerHost.ownerDocument.defaultView;
    this.timer = win.setInterval(() => this.pullEvents(), 250);
    this.loadTimeout = win.setTimeout(() => { if (this.alive && !this.ready) this.status.textContent = 'A página está demorando ou o leitor não está disponível. Tente recarregar ou abrir no navegador.'; }, 12000);
    this.updateMarkLabel(); this.app.mediaUI?.wireReader(this);
  }
  async refresh() {
    if (!this.alive || !this.ready) return;
    const config = { marking: this.marking, pins: this.node.pins.filter(p => p.anchor).map(p => ({ id: p.id, label: p.label, color: p.color, anchor: p.anchor })) };
    const generation = this.generation;
    try {
      await this.frame.executeJavaScript(`(${installPagePins.toString()})(${JSON.stringify(config)})`);
      if (this.alive && generation === this.generation) this.status.textContent = this.marking ? 'Clique no ponto da página que deseja marcar.' : 'Role a página normalmente · Clique em um alfinete para fixar/desafixar.';
    } catch { if (this.alive) this.status.textContent = 'Esta página não permite marcações. Você pode abri-la no navegador.'; }
  }
  updateMarkLabel() { this.markButton?.toggleClass('is-active', this.marking); }
  applyPageZoom() {
    if (!this.ready || !this.alive) return;
    const factor = this.node.mediaPageZoom || 1;
    if (this.pageZoom === factor) return;
    try { this.frame.setZoomFactor(factor); this.pageZoom = factor; } catch { /* Retry after the guest is ready. */ }
  }
  async setMarking(value) {
    this.marking = value; this.updateMarkLabel();
    if (!this.ready) return;
    try { await this.frame.executeJavaScript(`if(window.__imageAtlasPins) window.__imageAtlasPins.marking=${value ? 'true' : 'false'}`); this.status.textContent = value ? 'Clique no ponto da página que deseja marcar.' : 'Role e leia a página normalmente.'; }
    catch { this.status.textContent = 'Aguarde a página terminar de carregar.'; }
  }
  async pullEvents() {
    if (!this.alive || !this.ready || this.busy || !this.readerHost.isConnected || this.readerHost.ownerDocument.visibilityState === 'hidden') return;
    if (this.inline && !this.view.visibleWeb?.has(this.node.id)) return;
    this.busy = true; const generation = this.generation;
    try {
      const events = await this.frame.executeJavaScript('window.__imageAtlasPins?.events.splice(0,20) || []');
      if (!this.alive || generation !== this.generation || !Array.isArray(events)) return;
      for (const event of events.slice(0, 20)) {
        if (!this.view.file || !this.view.board.nodes.includes(this.node)) { this.close(); return; }
        if (event?.kind === 'pin' && typeof event.id === 'string') {
          const pin = this.node.pins.find(p => p.id === event.id); if (!pin) continue;
          if (this.view.mode === 'connect') this.view.connect({ node: this.node.id, pin: pin.id });
          else { this.view.activatePin(this.node, pin); this.showSummary(pin); }
        } else if (event?.kind === 'create') {
          const a = event.anchor;
          if (!a || !safeUrl(a.url) || typeof a.selector !== 'string' || !a.selector || a.selector.length > 2000 || typeof a.text !== 'string' || a.text.length > 240 || ![a.rx, a.ry].every(finite) || a.rx < 0 || a.rx > 1 || a.ry < 0 || a.ry > 1) continue;
          const anchor = { url: safeUrl(a.url), selector: a.selector, text: a.text, rx: a.rx, ry: a.ry };
          this.marking = false; this.updateMarkLabel();
          new PinModal(this.view, this.node, .5, .5, anchor, pin => { if (this.alive) { this.refresh(); if (!pin.mapRoot) this.showSummary(pin); } }).open();
        }
      }
    } catch { /* The guest may be navigating; dom-ready re-establishes the bounded bridge. */ }
    finally { this.busy = false; }
  }
  async goToPin(pin) {
    const url = safeUrl(pin.anchor?.url); if (!this.ready || !url) return;
    const a = new URL(url), b = new URL(this.currentUrl || this.node.path);
    if (a.origin !== b.origin || a.pathname !== b.pathname || a.search !== b.search) { this.startPin = pin; this.frame.loadURL(url).catch(() => {}); return; }
    try {
      const found = await this.frame.executeJavaScript(`window.__imageAtlasPins?.go(${JSON.stringify(pin.id)}) || false`);
      if (!found && this.alive) this.status.textContent = 'O trecho mudou ou não foi encontrado nesta página.';
    } catch { /* A navigation invalidates the current DOM without changing saved anchors. */ }
  }
  showSummary(pin) {
    if (this.inline) { if (pin) { this.view.selected = { node: this.node.id, pin: pin.id }; this.view.highlight(); this.view.showPin(this.node, pin); } return; }
    this.selectedNotePath = pin?.notePath || '';
    this.preview.unload(); this.preview = new Component(); this.preview.load(); this.sidebar.empty();
    if (!pin) {
      this.sidebar.createEl('h3', { text: 'Alfinetes da página' });
      this.sidebar.createEl('p', { text: 'Ative “Marcar região da página” e clique em um trecho ou uma imagem.', cls: 'ia-muted' });
      for (const p of this.node.pins) this.view.button(this.sidebar, p.label, 'map-pin', () => { this.showSummary(p); this.goToPin(p); });
      return;
    }
    this.sidebar.createEl('h3', { text: pin.label });
    this.view.button(this.sidebar, pin.mapRoot ? 'Abrir mapa mental no quadro' : 'Criar mapa mental no quadro', 'git-fork', () => this.view.mindFromPin(this.node, pin));
    if (!pin.notePath) { this.view.button(this.sidebar, 'Criar nota Markdown', 'file-text', () => this.view.noteFromPin(this.node, pin)); this.view.button(this.sidebar, 'Todos os alfinetes', 'list', () => this.showSummary(null)); return; }
    this.view.button(this.sidebar, this.view.pinnedSummary(this.node, pin) ? 'Desafixar do quadro' : 'Fixar no quadro', 'pin', () => {
      this.view.selected = { node: this.node.id, pin: pin.id }; this.view.toggleSummaryCard(this.node, pin); this.showSummary(pin);
    });
    this.view.button(this.sidebar, 'Ir para este ponto', 'locate', () => this.goToPin(pin));
    this.view.button(this.sidebar, 'Editar nota', 'square-pen', () => this.view.openNote(pin.notePath));
    const target = this.sidebar.createDiv({ cls: 'ia-summary' }), child = this.preview;
    const file = this.app.vault.getFileByPath(pin.notePath);
    if (file) this.app.vault.cachedRead(file).then(raw => { if (this.alive && target.isConnected) return MarkdownRenderer.render(this.app, raw, target, file.path, child); }).catch(() => {});
    this.view.button(this.sidebar, 'Todos os alfinetes', 'list', () => this.showSummary(null));
  }
  onClose() {
    this.alive = false; this.generation++;
    if (this.timer) this.readerHost.ownerDocument.defaultView.clearInterval(this.timer);
    if (this.loadTimeout) this.readerHost.ownerDocument.defaultView.clearTimeout(this.loadTimeout);
    this.preview?.unload(); this.frame?.remove(); this.contentEl.empty();
    if (this.view.plugin.activeReader === this) this.view.plugin.activeReader = null;
  }
}

/** Owns the scene, normalized pin geometry, undo history and native board-file save lifecycle. */
class AtlasView extends TextFileView {
  constructor(leaf, plugin) { super(leaf); this.plugin = plugin; this.board = emptyBoard('Novo quadro'); this.mode = 'select'; this.selected = null; this.source = null; this.undoStack = []; this.redoStack = []; this.drag = null; this.previews = new Map(); this.previewCache = new Map(); this.pendingPreviewReads = new Map(); this.visibleNotes = new Set(); this.invalidData = null; this.motionFrame = null; }
  getViewType() { return VIEW; }
  getIcon() { return 'map-pinned'; }
  getDisplayText() { return this.file?.basename || 'ROMUS'; }
  getViewData() { return this.invalidData !== null ? this.invalidData : JSON.stringify(this.board, null, 2); }
  setViewData(data, clear) {
    this.pendingMindMove = null;
    if (clear) this.clear();
    try { this.board = parseBoard(data); this.visualHashes = new Map(); this.visualContentHashes = new Map(); this.invalidData = null; this.render(); this.refreshVisualNotes(); }
    catch (error) { this.releaseWeb(); this.invalidData = data; this.contentEl.empty(); this.contentEl.createEl('p', { text: `${error.message} O arquivo original foi preservado.` }); }
  }
  clear() { this.flushCameraFrame(); this.visualInputHashes?.clear(); this.resetTouchGestures(); this.subboardObserver?.disconnect(); this.cancelAreaDrag?.(); this.cancelAreaDrag = null; this.pendingAreaPin = null; this.pendingMapPin = null; this.inlineRename?.cancel(); this.reviewModal?.close(); this.releaseWeb(); this.releasePreviews(); this.board = emptyBoard('Novo quadro'); this.undoStack = []; this.redoStack = []; this.selected = null; this.selectedGroup = null; this.multiSelection?.clear(); this.source = null; this.drag = null; this.invalidData = null; }
  releaseWeb() { this.webObserver?.disconnect(); for (const session of this.webSessions?.values() || []) session.reader?.onClose(); this.webSessions?.clear(); }
  releasePreviews() { this.previewGeneration = (this.previewGeneration || 0) + 1; this.noteObserver?.disconnect(); this.noteObserver = null; this.visibleNotes.clear(); this.previewJobs?.clear(); const win = this.contentEl.ownerDocument.defaultView; if (this.previewQueueFrame != null) win.cancelAnimationFrame(this.previewQueueFrame); this.previewQueueFrame = null; win.clearTimeout(this.noteDetailTimer); for (const child of this.previews.values()) this.removeChild(child); this.previews.clear(); }
  clearPanel() { for (const [el, child] of this.previews) if (this.panel.contains(el)) { this.removeChild(child); this.previews.delete(el); } this.panel.empty(); }
  async onOpen() {
    const win = this.contentEl.ownerDocument.defaultView;
    this.register(() => this.resetTouchGestures());
    this.register(() => this.flushCameraFrame());
    this.registerDomEvent(win, 'blur', () => this.resetTouchGestures());
    if (Platform.isMobile) {
      // Native workspace swipes must not see touches that belong to the whiteboard.
      const isolateTouch = event => this.isolateWorkspaceTouch(event);
      for (const type of ['touchstart', 'touchend', 'touchcancel']) this.registerDomEvent(win, type, isolateTouch, { capture: true, passive: true });
      this.registerDomEvent(win, 'touchmove', isolateTouch, { capture: true, passive: false });
    }
    this.register(() => this.subboardObserver?.disconnect());
    this.multiSelection = new Set();
    this.registerDomEvent(this.contentEl, 'pointerdown', event => {
      const card = event.target.closest?.('.ia-card'); if (!card || event.button !== 0) return;
      const id = card.dataset.atlasNodeId; if (!id) return;
      if (this.pendingMindMove) { event.preventDefault(); event.stopImmediatePropagation(); return; }
      this.selectedGroup = null;
      if (event.shiftKey && !event.target.closest('input,textarea,select,[contenteditable=true],.romus-card-editor')) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (!this.multiSelection.size && this.selected?.node) this.multiSelection.add(this.selected.node);
        if (this.multiSelection.has(id)) this.multiSelection.delete(id); else this.multiSelection.add(id);
        const last = [...this.multiSelection].pop(); this.selected = last ? { node: last } : null; this.highlight(); this.showSelection();
      } else if (!this.multiSelection.has(id)) { this.multiSelection.clear(); this.highlight(); }
    }, { capture: true });
    this.registerDomEvent(this.contentEl, 'click', event => {
      const card = event.target.closest?.('.ia-card');
      if (this.pendingMindMove && card) {
        event.preventDefault(); event.stopImmediatePropagation();
        const raw = this.board.nodes.find(n => n.id === card.dataset.atlasNodeId);
        const parent = raw?.type === 'mind' ? raw : this.board.nodes.find(n => n.id === raw?.visualChildOf);
        const node = this.board.nodes.find(n => n.id === this.pendingMindMove);
        if (this.reparentMindNode(node, parent)) this.pendingMindMove = null;
        return;
      }
      if (event.shiftKey && card && !event.target.closest('input,textarea,select,[contenteditable=true],.romus-card-editor')) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, { capture: true });
    this.hoverPopover = null;
    this.registerDomEvent(this.contentEl, 'pointerover', event => this.previewImageNote(event));
    this.registerDomEvent(this.contentEl, 'pointermove', event => this.previewImageNote(event));
    this.registerDomEvent(this.contentEl, 'pointerleave', () => { this.imageHover = null; this.imageHoverShown = null; });
    this.registerDomEvent(win, 'keyup', event => { if (event.key === 'Control' || event.key === 'Meta') this.imageHoverShown = null; });
    this.registerDomEvent(win, 'keydown', event => {
      if ((event.key === 'Control' || event.key === 'Meta') && !event.repeat && this.imageHover?.target.isConnected) {
        const point = this.imageHover;
        this.previewImageNote(new win.MouseEvent('mouseover', { ctrlKey: event.ctrlKey, metaKey: event.metaKey, clientX: point.x, clientY: point.y }), point.target);
      }
    });
    this.registerDomEvent(this.contentEl, 'paste', event => this.pasteImages(event));
    this.registerDomEvent(win, 'pointermove', event => this.scheduleMove(event));
    this.registerDomEvent(win, 'pointerup', () => this.endDrag());
    this.registerDomEvent(win, 'pointercancel', () => this.endDrag());
    this.registerDomEvent(win, 'blur', () => this.endDrag());
    this.register(() => { this.reviewModal?.close(); if (this.motionFrame !== null) win.cancelAnimationFrame(this.motionFrame); this.releaseWeb(); this.releasePreviews(); this.previewCache.clear(); if (this.plugin.activeReader?.view === this) this.plugin.activeReader.close(); });
    this.registerEvent(this.app.vault.on('modify', file => {
      if (file.extension === 'imageboard') {
        this.subboardCache?.delete(file.path);
        for (const node of this.board.nodes.filter(n => n.type === 'whiteboard' && n.path === file.path)) { const el = this.nodeElements?.get(node.id)?.querySelector('.ia-board-preview'); if (el?._atlasBoardVisible) this.renderSubboardPreview(node, el); }
      }
      this.previewCache.delete(file.path);
      if (file.extension === 'md' && this.board.nodes.some(n => n.path === file.path || n.pins?.some(p => p.notePath === file.path))) {
        const selected = this.board.nodes.find(n => n.id === this.selected?.node);
        if (selected?.path === file.path || selected?.pins?.find(p => p.id === this.selected?.pin)?.notePath === file.path) this.showSelection();
        this.renderNotes(file.path);
      }
    }));
    this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
      const history = this.plugin.whiteboardHistory?.get(this.leaf.id);
      if (history) this.plugin.whiteboardHistory.set(this.leaf.id, history.map(path => path === oldPath ? file.path : path));
      if (!this.file || this.invalidData !== null) return;
      let changed = false;
      for (const n of this.board.nodes) {
        if (n.path === oldPath) { n.path = file.path; if (n.type === 'whiteboard') n.title = file.basename; changed = true; }
        if (n.visualNote === oldPath) { n.visualNote = file.path; changed = true; }
        if (n.visualSource === oldPath) { n.visualSource = file.path; const hash = this.visualHashes?.get(oldPath); this.visualHashes?.delete(oldPath); this.visualHashes?.set(file.path, hash || ''); changed = true; const note = this.app.vault.getFileByPath(n.visualNote); if (note && oldPath.endsWith('.imageboard')) this.app.fileManager.processFrontMatter(note, fm => { fm['image-atlas-source'] = file.path; }).catch(error => new Notice(error.message)); }
        for (const p of n.pins || []) if (p.notePath === oldPath) { p.notePath = file.path; changed = true; }
      }
      if (this.board.indexPath === oldPath) { this.board.indexPath = file.path; changed = true; }
      if (file.extension === 'md') changed = reconcileAtlasNoteNames(this.board, this.app.vault, { ...this.plugin.noteRenames, [oldPath]: file.path }, { file, oldPath }) || changed;
      if (changed) { this.changed(true); this.render(); }
    }));
  }
  checkpoint(scope = 'content') {
    if (!this.undoScopes || this.undoScopes.length !== this.undoStack.length) this.undoScopes = this.undoStack.map(() => 'content');
    const snapshot = JSON.stringify(this.board); this.undoStack.push(snapshot); this.undoScopes.push(scope);
    let size = this.undoStack.reduce((sum, value) => sum + value.length * 2, 0);
    while (this.undoStack.length > 1 && (size > 8 * 1024 * 1024 || this.undoStack.length > 30)) { size -= this.undoStack.shift().length * 2; this.undoScopes.shift(); }
    this.redoStack = []; this.redoScopes = [];
  }
  undo(redo = false) {
    const from = redo ? this.redoStack : this.undoStack, to = redo ? this.undoStack : this.redoStack;
    if (!from.length) return;
    const scopes = redo ? this.redoScopes : this.undoScopes, scope = scopes?.pop() || 'content';
    const targetScopes = redo ? (this.undoScopes ||= []) : (this.redoScopes ||= []);
    to.push(JSON.stringify(this.board)); targetScopes.push(scope); this.board = JSON.parse(from.pop()); this.pendingAreaPin = null; this.pendingMapPin = null; this.selected = null; this.selectedGroup = null; this.multiSelection?.clear(); this.source = null;
    if (scope === 'board') this.rememberVisualLayout();
    this.changed(scope !== 'board', scope !== 'board'); this.render();
  }
  changed(index = false, visual = true) {
    if (this.invalidData !== null || !this.file) return;
    this.requestSave();
    if (visual) this.syncVisualNotes();
    if (index) this.plugin.syncIndex(this.board).catch(error => new Notice(`Quadro salvo; índice pendente: ${error.message}`));
  }
  button(parent, label, icon, action, active = false) {
    const b = parent.createEl('button', { cls: `ia-tool${active ? ' is-active' : ''}`, attr: { 'aria-label': label } });
    if (icon) { const span = b.createSpan(); setIcon(span, icon); }
    b.createSpan({ text: label }); b.onclick = action; return b;
  }
  render() {
    const edit = this.inlineRename?.snapshot();
    if (edit) this.inlineRename.suspend();
    this.renderBoard();
    if (!edit || edit.board !== this.board || this.selected?.node !== edit.id || this.invalidData !== null) return;
    const node = this.board.nodes.find(n => n.id === edit.id && n.type === 'mind');
    if (!node) return;
    this.renameMindInline(node, edit.fresh);
    const input = this.inlineRename?.input; if (!input) return;
    input.value = edit.value;
    input.setSelectionRange(edit.start, edit.end, edit.direction);
  }
  renderBoard() {
    if (this.invalidData !== null) return;
    if (reconcileAtlasNoteNames(this.board, this.app?.vault, this.plugin?.noteRenames) && this.file) this.requestSave();
    this.areaDraft?.remove(); this.areaDraft = null; this.cancelAreaDrag?.(); this.cancelAreaDrag = null;
    if (this.pendingAreaPin && (this.pendingAreaPin.board !== this.board || !this.board.nodes.includes(this.pendingAreaPin.image) || !this.pendingAreaPin.image.pins.includes(this.pendingAreaPin.pin))) this.pendingAreaPin = null;
    if (this.pendingMapPin && (this.pendingMapPin.board !== this.board || !this.board.nodes.includes(this.pendingMapPin.root) || !this.board.nodes.includes(this.pendingMapPin.image))) { this.pendingMapPin = null; this.mode = 'select'; }
    this.inlineRename?.finish();
    if (this.viewport?.isConnected && this.contentEl.contains(this.viewport)) {
      if (this.backBoardButton) this.backBoardButton.disabled = !this.plugin.whiteboardHistory?.get(this.leaf.id)?.length;
      this.viewport.className = `ia-viewport mode-${this.mode}`;
      if (this.hint) this.hint.textContent = this.mode === 'area' ? 'Arraste sobre a imagem para marcar uma área · Escape cancela.' : this.mode === 'pin' ? 'Clique na imagem para colocar um alfinete.' : this.mode === 'connect' ? 'Clique na origem e depois no destino.' : 'Arraste os cartões pelo título · Arraste o fundo para mover · Use a roda para ampliar';
      for (const button of this.contentEl.querySelectorAll('.ia-toolbar .ia-tool')) {
        const label = button.getAttribute('aria-label');
        if (['Alfinete', 'Área', 'Conectar', 'Mover'].includes(label)) button.toggleClass('is-active', label === ({ pin: 'Alfinete', area: 'Área', connect: 'Conectar', select: 'Mover' })[this.mode]);
      }
      this.viewport.querySelector('.ia-empty')?.remove();
      this.drawNodes(); this.drawEdges(); this.camera(); this.showSelection(); return;
    }
    this.releasePreviews(); this.contentEl.empty(); this.contentEl.addClass('ia-view'); this.contentEl.toggleClass('ia-mobile', Platform.isMobile);
    this.contentEl.onclick = e => {
      const link = e.target.closest('a.internal-link');
      if (!link) return;
      const href = link.getAttribute('data-href') || link.getAttribute('href');
      if (!href) return;
      e.preventDefault(); e.stopPropagation();
      this.app.workspace.openLinkText(href, link.closest('[data-ia-source]')?.getAttribute('data-ia-source') || this.file?.path || '', e.ctrlKey || e.metaKey);
    };
    const toolbar = this.contentEl.createDiv({ cls: 'ia-toolbar' });
    toolbar.createSpan({ cls: 'ia-brand', text: 'ROMUS' });
    this.button(toolbar, 'Buscar notas e mapas', 'search', () => new AtlasBoardSearchModal(this.plugin).open());
    this.button(toolbar, 'Renomear whiteboard', 'square-pen', () => { if (this.file) new BoardRenameModal(this).open(); });
    this.button(toolbar, 'Subwhiteboard', 'panels-top-left', () => new SubboardModal(this).open());
    const back = this.backBoardButton = this.button(toolbar, 'Voltar ao quadro anterior', 'arrow-left', () => this.navigateWhiteboard(null));
    back.disabled = !this.plugin.whiteboardHistory?.get(this.leaf.id)?.length;
    this.button(toolbar, 'Imagem', 'image-plus', () => this.pickImage());
    this.button(toolbar, 'Adicionar nota existente', 'notebook', () => this.pickVisualNote());
    this.button(toolbar, 'Importar', 'upload', () => this.importDialog());
    this.button(toolbar, 'Página', 'globe', () => new WebPageModal(this).open());
    this.button(toolbar, 'Mapa mental', 'git-fork', () => this.addMindMap());
    this.button(toolbar, 'Criar grupo', 'group', () => this.createGroup());
    this.button(toolbar, 'Colocar / retirar do grupo', 'folder-input', () => this.editGroupMembership());
    this.button(toolbar, 'Mostrar mapas existentes', 'unfold-vertical', () => this.revealExistingMaps());
    this.button(toolbar, 'Estudar todos os flashcards', 'layers', () => this.reviewBoardFlashcards());
    this.button(toolbar, 'Alfinete', 'map-pin-plus', () => this.setMode('pin'), this.mode === 'pin');
    this.button(toolbar, 'Área', 'scan', () => this.setMode('area'), this.mode === 'area');
    this.button(toolbar, 'Conectar', 'waypoints', () => this.setMode('connect'), this.mode === 'connect');
    this.button(toolbar, 'Mover', 'mouse-pointer-2', () => this.setMode('select'), this.mode === 'select');
    this.button(toolbar, 'Enquadrar', 'scan', () => this.fit());
    this.button(toolbar, 'Desfazer', 'undo-2', () => this.undo());
    this.button(toolbar, 'Refazer', 'redo-2', () => this.undo(true));
    this.sidebarToggle = this.button(toolbar, 'Detalhes', 'panel-right', () => this.setSidebarOpen(!this.sidebarOpen), Boolean(this.sidebarOpen));
    this.sidebarToggle.setAttribute('aria-expanded', String(Boolean(this.sidebarOpen)));
    this.configureMobileToolbar(toolbar);
    const body = this.contentEl.createDiv({ cls: 'ia-body' });
    this.viewport = body.createDiv({ cls: `ia-viewport mode-${this.mode}`, attr: { tabindex: '0' } });
    if (Platform.isMobile) this.bindTouchGestures(this.viewport);
    this.world = this.viewport.createDiv({ cls: 'ia-world' });
    this.groupsEl = this.world.createDiv({ cls: 'ia-groups' });
    this.edgesEl = this.world.createDiv({ cls: 'ia-edges' });
    this.nodesEl = this.world.createDiv({ cls: 'ia-nodes' });
    this.webLayer = this.viewport.createDiv({ cls: 'ia-web-layer' });
    this.sidebar = body.createDiv({ cls: 'ia-sidebar' }); this.sidebar.hidden = !this.sidebarOpen;
    const sidebarHead = this.sidebar.createDiv({ cls: 'ia-sidebar-head' });
    sidebarHead.createSpan({ text: 'Detalhes do quadro' });
    const closeSidebar = sidebarHead.createEl('button', { cls: 'ia-node-menu ia-quick-icon', attr: { 'aria-label': 'Fechar painel de detalhes', title: 'Fechar painel' } });
    setIcon(closeSidebar, 'x'); closeSidebar.onclick = () => this.setSidebarOpen(false);
    this.panel = this.sidebar.createDiv({ cls: 'ia-panel' });
    const footer = this.contentEl.createDiv({ cls: 'ia-footer' });
    this.hint = footer.createSpan({ text: this.mode === 'pin' ? 'Clique na região de uma imagem para criar um resumo.' : this.mode === 'connect' ? 'Clique na origem (imagem ou alfinete) e depois no destino.' : 'Arraste os cartões pelo título · Arraste o fundo para mover · Use a roda para ampliar' });
    this.zoomLabel = footer.createSpan();
    this.hint.addClass('ia-mobile-hint');
    this.viewport.onpointerdown = e => {
      if (e.target !== this.viewport && e.target !== this.world && e.target !== this.nodesEl && e.target !== this.edgesEl) return;
      if (e.button !== 0 && e.button !== 1) return;
      e.preventDefault(); this.viewport.focus();
      this.multiSelection?.clear(); this.selectedGroup = null; this.selected = null; this.highlight(); this.showSelection();
      this.drag = { type: 'pan', cx: e.clientX, cy: e.clientY, x: this.board.camera.x, y: this.board.camera.y, pointerId: e.pointerId };
    };
    this.viewport.onwheel = e => {
      if (e.target.closest('.ia-note-content,.ia-mind-text')) return;
      e.preventDefault(); const r = this.viewport.getBoundingClientRect();
      this.zoom(Math.exp(-e.deltaY * .0015), e.clientX - r.left, e.clientY - r.top, true);
    };
    this.viewport.onkeydown = e => {
      const selected = this.board.nodes.find(n => n.id === this.selected?.node);
      const ownMap = selected?.type === 'note' ? this.board.nodes.find(n => selected.noteMaps?.includes(n.id) && n.type === 'mind') : null;
      const mind = ownMap || (selected?.type === 'mind' || selected?.type === 'note' || selected?.type === 'image' && selected.visualNote ? selected : this.board.nodes.find(n => n.id === selected?.visualChildOf && n.type === 'mind'));
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter' && !e.target.closest('input,textarea,select,[contenteditable=true]')) {
        if (this.multiSelection?.size > 1) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) this.convertSelectedMindNotes(); return; }
        const target = selected?.type === 'mind' ? selected : this.board.nodes.find(n => n.id === selected?.visualChildOf && n.type === 'mind');
        if (target) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) this.convertMindNote(target, { open: false }); return; }
      }
      if (mind && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target.closest('input,textarea,select,[contenteditable=true]')) {
        if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); if (ownMap) ownMap.pinHidden = false; if (e.shiftKey) this.addMindNoteChild(mind); else this.addMindNode(mind); return; }
        if (e.key === 'Enter') { e.preventDefault(); this.addMindNode(mind, true); return; }
        if (e.key === 'F2') { e.preventDefault(); this.renameMindInline(mind); return; }
      }
      if (e.key === 'Escape') { this.pendingMindMove = null; this.pendingAreaPin = null; this.pendingMapPin = null; this.multiSelection?.clear(); this.selectedGroup = null; this.mode = 'select'; this.source = null; this.render(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g' && !e.target.closest('input,textarea,select,[contenteditable=true]')) { e.preventDefault(); this.createGroup(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); this.undo(e.shiftKey); }
    };
    this.viewport.ondragover = e => { e.preventDefault(); };
    this.viewport.ondrop = e => {
      e.preventDefault(); const pos = this.toWorld(e.clientX, e.clientY);
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length) this.importFiles(files, pos);
      else { const path = e.dataTransfer?.getData('text/plain')?.replace(/^!?\[\[|\]\]$/g, '').split('|')[0]; const file = path && (this.app.vault.getFileByPath(path) || this.app.metadataCache.getFirstLinkpathDest(path, this.file?.path || '')); if (file && /^(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(file.extension)) this.addImage(file, pos); else if (file?.extension === 'md') this.addVisualNote(file, pos); else if (file?.extension === 'imageboard') this.addSubboard(file, pos); }
    };
    this.drawNodes(); this.drawEdges(); this.camera(); this.showSelection();
    if (!this.board.nodes.length) {
      const empty = this.viewport.createDiv({ cls: 'ia-empty' });
      empty.createEl('h2', { text: 'Uma imagem. Várias ideias.' });
      empty.createEl('p', { text: 'Adicione uma imagem, marque uma região com um alfinete e comece seu resumo.' });
      this.button(empty, 'Adicionar imagem do vault', 'image-plus', () => this.pickImage());
      this.button(empty, 'Importar do computador', 'upload', () => this.importDialog());
    }
  }
  setMode(mode) { this.pendingAreaPin = null; this.pendingMapPin = null; this.mode = this.mode === mode && mode !== 'select' ? 'select' : mode; this.source = null; this.render(); for (const session of this.webSessions?.values() || []) session.reader?.setMarking(this.mode === 'pin'); }
  previewImageNote(event, target = event.target) {
    const card = target?.closest?.('.ia-image');
    if (!card || !this.contentEl.contains(card) || target.closest('button,.ia-resize')) { this.imageHover = null; this.imageHoverShown = null; return false; }
    this.imageHover = { target, x: event.clientX, y: event.clientY };
    if (!event.ctrlKey && !event.metaKey) { this.imageHoverShown = null; return false; }
    if (this.drag) return false;
    const node = this.board.nodes.find(n => n.id === card.dataset.atlasNodeId);
    const proxy = node && this.board.nodes.find(n => n.id === node.visualChildOf);
    const path = node?.visualNote || proxy?.path || (node?.visualSource?.endsWith('.md') ? node.visualSource : '');
    if (!path || !this.app.vault.getFileByPath(path)) return false;
    if (this.imageHoverShown === card) return true;
    this.imageHoverShown = card;
    this.app.workspace.trigger('hover-link', { event, source: 'image-atlas', hoverParent: this, targetEl: card, linktext: path, sourcePath: this.file?.path || '' });
    return true;
  }
  bindImageArea(element, image) {
    let drag = null;
    const point = event => { const r = element.getBoundingClientRect(); return { u: Math.max(0, Math.min(1, (event.clientX - r.left) / r.width)), v: Math.max(0, Math.min(1, (event.clientY - r.top) / r.height)) }; };
    const cancel = () => { const active = drag; drag = null; if (active && element.hasPointerCapture(active.id)) element.releasePointerCapture(active.id); this.areaDraft?.remove(); this.areaDraft = null; };
    element.onpointerdown = event => {
      if (this.previewImageNote(event)) return;
      if (this.mode !== 'area' || event.button !== 0 || event.target.closest('button')) return;
      if (this.pendingAreaPin && this.pendingAreaPin.image !== image || this.pendingMapPin && this.pendingMapPin.image !== image) { new Notice('Marque a área na imagem escolhida.'); return; }
      event.preventDefault(); event.stopPropagation(); this.viewport.focus();
      drag = { id: event.pointerId, start: point(event), board: this.board }; element.setPointerCapture(event.pointerId);
      this.areaDraft = element.createDiv({ cls: 'ia-area-draft' }); this.cancelAreaDrag = cancel;
    };
    element.onpointermove = event => {
      if (!drag || drag.id !== event.pointerId) return;
      const end = point(event), start = drag.start, rect = this.areaDraft; if (!rect) return;
      rect.style.left = `${Math.min(start.u, end.u) * 100}%`; rect.style.top = `${Math.min(start.v, end.v) * 100}%`;
      rect.style.width = `${Math.abs(start.u - end.u) * 100}%`; rect.style.height = `${Math.abs(start.v - end.v) * 100}%`;
    };
    element.onpointerup = event => {
      if (!drag || drag.id !== event.pointerId) return;
      event.preventDefault(); event.stopPropagation();
      const end = point(event), start = drag.start, board = drag.board, r = element.getBoundingClientRect(); cancel(); this.cancelAreaDrag = null;
      const area = { w: Math.abs(start.u - end.u), h: Math.abs(start.v - end.v) }, u = (start.u + end.u) / 2, v = (start.v + end.v) / 2;
      if (board !== this.board || !board.nodes.includes(image)) return;
      if (area.w * r.width < 6 || area.h * r.height < 6) { new Notice('Arraste para desenhar uma área maior.'); return; }
      if (this.pendingMapPin) { this.attachMapPin(image, u, v, area); return; }
      const pending = this.pendingAreaPin;
      if (pending) {
        if (pending.board !== board || pending.image !== image || !image.pins.includes(pending.pin)) return;
        this.checkpoint(); Object.assign(pending.pin, { u, v, area }); this.pendingAreaPin = null; this.mode = 'select'; this.selected = { node: image.id, pin: pending.pin.id }; this.changed(); this.render(); return;
      }
      const modal = new PinModal(this, image, u, v); modal.area = area; modal.open();
    };
    element.onpointercancel = cancel; element.onlostpointercapture = () => { if (drag) cancel(); };
  }
  toWorld(x, y) { const r = this.viewport.getBoundingClientRect(), c = this.board.camera; return { x: (x - r.left - c.x) / c.z, y: (y - r.top - c.y) / c.z }; }
  configureMobileToolbar(toolbar) {
    if (!Platform.isMobile) return;
    for (const button of toolbar.querySelectorAll('.ia-tool')) {
      if (['Voltar ao quadro anterior', 'Enquadrar'].includes(button.getAttribute('aria-label'))) button.addClass('ia-mobile-primary', 'ia-mobile-icon-only');
    }
    const menu = this.button(toolbar, 'Menu', 'menu', () => {
      const actions = new Menu();
      for (const button of toolbar.querySelectorAll('.ia-tool:not(.ia-mobile-extra)')) {
        const title = button.getAttribute('aria-label');
        actions.addItem(item => item.setTitle(title).setDisabled(button.disabled).onClick(() => button.click()));
      }
      const r = menu.getBoundingClientRect(); actions.showAtPosition({ x: r.left, y: r.bottom + 4 });
    });
    menu.addClass('ia-mobile-primary', 'ia-mobile-extra'); toolbar.insertBefore(menu, toolbar.firstChild);
    const zoomAtCenter = factor => { const r = this.viewport.getBoundingClientRect(); this.zoom(factor, r.width / 2, r.height / 2); };
    const minus = this.button(toolbar, 'Diminuir zoom', 'minus', () => zoomAtCenter(1 / 1.25));
    const plus = this.button(toolbar, 'Aumentar zoom', 'plus', () => zoomAtCenter(1.25));
    for (const button of [minus, plus]) button.addClass('ia-mobile-primary', 'ia-mobile-extra', 'ia-mobile-icon-only');
  }
  resetTouchGestures() {
    if (this.touchCameraFrame != null) this.contentEl.ownerDocument.defaultView.cancelAnimationFrame(this.touchCameraFrame);
    this.touchCameraFrame = null; this.touchPoints = new Map(); this.pinchGesture = null; this.touchBlocked = false;
  }
  isolateWorkspaceTouch(event) {
    if (!this.viewport?.isConnected) return;
    const inside = event.composedPath?.().includes(this.viewport) || this.viewport.contains(event.target);
    if (!inside || event.target?.closest?.('input,textarea,select,[contenteditable="true"]')) return;
    if (event.type === 'touchmove' && event.cancelable) event.preventDefault();
    event.stopImmediatePropagation();
  }
  bindTouchGestures(viewport) {
    this.resetTouchGestures();
    const block = event => { event.preventDefault(); event.stopImmediatePropagation(); };
    const startPinch = () => {
      const [a, b] = [...this.touchPoints.values()], r = viewport.getBoundingClientRect(), c = this.board.camera;
      this.pinchGesture = { camera: { ...c }, distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)), left: r.left, top: r.top, anchor: { x: ((a.x + b.x) / 2 - r.left - c.x) / c.z, y: ((a.y + b.y) / 2 - r.top - c.y) / c.z } };
    };
    viewport.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') return;
      this.touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (this.touchPoints.size >= 2) {
        this.endDrag(); this.cancelAreaDrag?.(); this.touchBlocked = true; this.suppressTouchClickUntil = Date.now() + 500;
        if (this.touchPoints.size === 2) startPinch();
        for (const id of this.touchPoints.keys()) { try { viewport.setPointerCapture(id); } catch {} }
        block(event);
      } else if (this.touchBlocked) block(event);
    }, { capture: true, passive: false });
    viewport.addEventListener('pointermove', event => {
      if (event.pointerType !== 'touch' || !this.touchPoints.has(event.pointerId)) return;
      this.touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (this.pinchGesture && this.touchPoints.size >= 2) {
        this.board.camera = pinchCamera(this.pinchGesture, [...this.touchPoints.values()]);
        if (this.touchCameraFrame == null) this.touchCameraFrame = viewport.ownerDocument.defaultView.requestAnimationFrame(() => { this.touchCameraFrame = null; if (viewport.isConnected) this.camera(); });
        block(event);
      } else if (this.touchBlocked) block(event);
    }, { capture: true, passive: false });
    const finish = event => {
      if (event.pointerType !== 'touch') return;
      const blocked = this.touchBlocked;
      this.touchPoints.delete(event.pointerId);
      if (blocked) {
        this.suppressTouchClickUntil = Date.now() + 500;
        if (this.touchPoints.size >= 2) startPinch();
        else { this.pinchGesture = null; if (this.touchCameraFrame != null) viewport.ownerDocument.defaultView.cancelAnimationFrame(this.touchCameraFrame); this.touchCameraFrame = null; this.camera(); this.changed(false, false); }
        this.touchBlocked = this.touchPoints.size > 0; block(event);
      }
    };
    viewport.addEventListener('pointerup', finish, { capture: true, passive: false });
    viewport.addEventListener('pointercancel', finish, { capture: true, passive: false });
    viewport.addEventListener('click', event => { if (this.touchBlocked || Date.now() < (this.suppressTouchClickUntil || 0)) block(event); }, { capture: true });
    // Forward local drags ourselves before stopping their propagation to the workspace.
    viewport.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') event.stopPropagation(); });
    viewport.addEventListener('pointermove', event => { if (event.pointerType === 'touch') { this.scheduleMove(event); event.stopPropagation(); } });
    const endLocalDrag = event => { if (event.pointerType === 'touch') { this.endDrag(); event.stopPropagation(); } };
    viewport.addEventListener('pointerup', endLocalDrag);
    viewport.addEventListener('pointercancel', endLocalDrag);
  }
  camera() {
    if (!this.world) return;
    const c = this.board.camera; this.world.style.transform = `translate(${c.x}px, ${c.y}px) scale(${c.z})`;
    for (const n of this.webNodes || []) { const el = this.nodeElements?.get(n.id); if (el) this.place(el, n); }
    if (this.zoomLabel) this.zoomLabel.textContent = `${Math.round(c.z * 100)}%`;
    const detail = c.z >= .35;
    if (this.notePreviewDetail !== detail) {
      this.notePreviewDetail = detail;
      const win = this.contentEl.ownerDocument.defaultView, board = this.board;
      win.clearTimeout(this.noteDetailTimer);
      this.noteDetailTimer = win.setTimeout(() => {
        if (this.board !== board || !this.viewport?.isConnected) return;
        for (const id of this.visibleNotes) {
          const node = this.nodeById?.get(id), el = this.nodeElements?.get(id)?.querySelector('.ia-note-content');
          if (node && el) this.queueNotePreview(node.path, el);
        }
      }, 80);
    }
  }
  scheduleCameraFrame() {
    if (this.cameraFrame != null) return;
    const win = this.contentEl.ownerDocument.defaultView; this.cameraPendingBoard = this.board;
    this.cameraFrame = win.requestAnimationFrame(() => { this.cameraFrame = null; this.flushCameraFrame(); });
  }
  flushCameraFrame() {
    if (this.cameraFrame != null) this.contentEl.ownerDocument.defaultView.cancelAnimationFrame(this.cameraFrame);
    this.cameraFrame = null; const board = this.cameraPendingBoard; this.cameraPendingBoard = null;
    if (board && board === this.board && this.invalidData === null) { this.camera(); this.changed(false, false); }
  }
  zoom(factor, x, y, deferred = false) {
    const c = this.board.camera, z = Math.max(.15, Math.min(3, c.z * factor));
    c.x = x - (x - c.x) * z / c.z; c.y = y - (y - c.y) * z / c.z; c.z = z;
    if (deferred) this.scheduleCameraFrame(); else { this.camera(); this.changed(false, false); }
  }
  fit() {
    if (!this.board.nodes.length || !this.viewport?.clientWidth) return;
    this.prepareMind(); const nodes = this.board.nodes.filter(n => !this.hiddenVisualNodes.has(n.id) && (n.type !== 'mind' || this.visibleMind.has(n.id)));
    if (!nodes.length) return;
    const minX = Math.min(...nodes.map(n => n.x)), minY = Math.min(...nodes.map(n => n.y));
    const maxX = Math.max(...nodes.map(n => n.x + n.w)), maxY = Math.max(...nodes.map(n => n.y + n.h + 42));
    const z = Math.min(1.25, Math.max(.15, Math.min((this.viewport.clientWidth - 100) / (maxX - minX), (this.viewport.clientHeight - 100) / (maxY - minY))));
    this.board.camera = { x: (this.viewport.clientWidth - (maxX - minX) * z) / 2 - minX * z, y: (this.viewport.clientHeight - (maxY - minY) * z) / 2 - minY * z, z };
    this.camera(); this.changed(false, false);
  }
  focusNode(node) { const c = this.board.camera; c.x = this.viewport.clientWidth / 2 - (node.x + node.w / 2) * c.z; c.y = this.viewport.clientHeight / 2 - (node.y + (node.h + 42) / 2) * c.z; this.camera(); this.changed(false, false); }
  nodeRenderKey(node) {
    const byId = this.nodeById;
    const owned = (node.noteMaps || []).map(id => [id, byId.get(id)?.pinHidden]);
    const pins = (node.pins || []).map(pin => [pin, pin.mapRoot && byId.get(pin.mapRoot)?.pinHidden, this.pinnedSummary(node, pin)?.id]);
    return JSON.stringify([node.type, node.title, node.path, node.mediaNote, node.visualNote, node.visualSource, node.visualChildOf, node.linkedVisualRoot, node.color, node.relation, node.body, node.collapsed, node.visualExpanded, node.visualAsChild, node.flashcards?.length, Boolean(this.mindChildren.get(node.id)?.length), owned, pins, byId.get(node.visualChildOf)?.title]);
  }
  drawNodes() {
    this.subboardObserver?.disconnect();
    const subboardWindow = this.contentEl.ownerDocument.defaultView;
    this.subboardObserver = subboardWindow.IntersectionObserver ? new subboardWindow.IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        const node = this.board.nodes.find(n => n.id === entry.target.dataset.boardNode);
        if (node) { entry.target._atlasBoardVisible = true; this.renderSubboardPreview(node, entry.target); }
        this.subboardObserver.unobserve(entry.target);
      }
    }, { root: this.viewport, rootMargin: '250px' }) : null;
    const resizedMaps = this.sizeRelationLabels();
    this.prepareMind();
    for (const [id, owner] of this.noteMapOwners) {
      const root = this.board.nodes.find(n => n.id === id);
      if (root && (root.x !== owner.x || root.y !== owner.y || root.w !== owner.w || root.h !== owner.h)) resizedMaps.add(id);
    }
    for (const node of this.board.nodes) if (this.directVisualNodes.has(node.id)) {
      const target = this.board.nodes.find(n => n.id === node.linkedVisualRoot);
      if (target && (node.w !== target.w || node.h !== target.h)) { node.w = target.w; node.h = target.h; resizedMaps.add(node.mapId); }
    }
    for (const mapId of resizedMaps) this.layoutMind(mapId);
    this.alignVisualChildren();
    this.webObserver?.disconnect(); this.visibleWeb = new Set();
    if (!this.webSessions) this.webSessions = new Map();
    for (const [id, session] of this.webSessions) if (!this.board.nodes.some(n => n.id === id && n.type === 'web' && n.path === session.path)) { session.reader?.onClose(); this.webSessions.delete(id); }
    const previousElements = this.nodeElements || new Map();
    this.nodeById = new Map(this.board.nodes.map(n => [n.id, n]));
    const retained = new Map(), renderKeys = new Map();
    for (const node of this.board.nodes) {
      if (node.type === 'web' || this.hiddenVisualNodes.has(node.id) || this.directVisualNodes.has(node.id) || this.noteMapOwners.has(node.id) || node.type === 'mind' && !this.visibleMind.has(node.id)) continue;
      const key = this.nodeRenderKey(node); renderKeys.set(node.id, key);
      const el = previousElements.get(node.id);
      // Event handlers close over node references: replaced scene objects must
      // receive new handlers, even when their displayed text is unchanged.
      if (el?.parentElement === this.nodesEl && el._atlasNode === node && el._atlasRenderKey === key) retained.set(node.id, el);
    }
    const preserved = new Map();
    for (const node of this.board.nodes) if (node.type === 'web' && this.webSessions.has(node.id)) { const element = this.nodeElements?.get(node.id); if (element?.parentElement === this.webLayer) preserved.set(node.id, element); }
    const preservedElements = new Set([...preserved.values(), ...retained.values()]);
    for (const element of Array.from(this.nodesEl.children)) if (!preservedElements.has(element)) { this.noteObserver?.unobserve(element); this.visibleNotes.delete(element.dataset.atlasNodeId); element.remove(); }
    for (const element of Array.from(this.webLayer.children)) if (!preservedElements.has(element)) element.remove();
    for (const [el, child] of this.previews) if (!el.isConnected || !this.contentEl.contains(el)) { this.removeChild(child); this.previews.delete(el); }
    this.nodeElements = new Map(); this.nodeById = new Map(this.board.nodes.map(n => [n.id, n])); this.webNodes = this.board.nodes.filter(n => n.type === 'web');
    const win = this.contentEl.ownerDocument.defaultView;
    const activate = node => {
      const session = this.webSessions.get(node.id); if (!session || session.reader) return;
      if (Platform.isDesktopApp) {
        session.host.empty(); session.reader = new WebReaderModal(this, node);
        session.reader.mountReader(session.host, session.host, true);
      } else {
        session.host.empty(); session.host.createEl('iframe', { attr: { src: node.path, title: node.title || 'Página externa', loading: 'lazy', sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups' } });
      }
    };
    if (win.IntersectionObserver) this.webObserver = new win.IntersectionObserver(entries => {
      for (const entry of entries) { const id = entry.target.getAttribute('data-ia-web'), node = this.nodeById.get(id); if (entry.isIntersecting && node) { this.visibleWeb.add(id); activate(node); } else this.visibleWeb.delete(id); }
    }, { root: this.viewport, rootMargin: '150px' });
    if (win.IntersectionObserver && !this.noteObserver) this.noteObserver = new win.IntersectionObserver(entries => {
      for (const entry of entries) {
        const id = entry.target.getAttribute('data-ia-node'), node = this.nodeById.get(id);
        if (entry.isIntersecting && node) { this.visibleNotes.add(id); const content = entry.target.querySelector('.ia-note-content'); if (content && !content._atlasRequested) this.queueNotePreview(node.path, content); }
        else {
          this.visibleNotes.delete(id); const content = entry.target.querySelector('.ia-note-content');
          if (this.deferNoteRelease?.(id, content)) continue; if (content?._atlasRequested) { const child = this.previews.get(content); if (child) { this.removeChild(child); this.previews.delete(content); } content._atlasToken = uid(); content._atlasRequested = false; content.empty(); content.createSpan({ text: 'Resumo · aparece ao aproximar', cls: 'ia-muted' }); }
        }
      }
    }, { root: this.viewport, rootMargin: '250px' });
    for (const n of this.board.nodes) {
      if (this.hiddenVisualNodes.has(n.id) || this.directVisualNodes.has(n.id) || this.noteMapOwners.has(n.id) || (n.type === 'mind' && !this.visibleMind.has(n.id))) continue;
      const kept = retained.get(n.id);
      if (kept) {
        this.nodeElements.set(n.id, kept); this.place(kept, n);
        if (n.type === 'image') { const area = kept.querySelector('.ia-image-area'); if (area) area.style.height = `${n.h}px`; }
        if (kept.hasAttribute('data-ia-node')) { if (this.noteObserver) this.noteObserver.observe(kept); else this.visibleNotes.add(n.id); }
        const boardPreview = n.type === 'whiteboard' && kept.querySelector('.ia-board-preview');
        if (boardPreview && this.subboardObserver && !boardPreview._atlasBoardVisible) this.subboardObserver.observe(boardPreview);
        continue;
      }
      const el = preserved.get(n.id) || (n.type === 'web' ? this.webLayer : this.nodesEl).createDiv();
      el._atlasNode = n; el._atlasRenderKey = renderKeys.get(n.id);
      el.className = `ia-card ia-${n.type}${n.relation ? ' ia-relation' : ''}${this.selected?.node === n.id ? ' is-selected' : ''}`;
      el.dataset.atlasNodeId = n.id;
      el.querySelector('.ia-card-head')?.remove(); el.querySelector('.ia-resize')?.remove();
      this.nodeElements.set(n.id, el); this.place(el, n);
      const head = el.createDiv({ cls: 'ia-card-head' });
      if (el.firstChild !== head) el.insertBefore(head, el.firstChild);
      const cardTitle = head.createSpan({ text: n.title || n.path.split('/').pop().replace(/\.md$/, ''), cls: 'ia-card-title' });
      if (n.type === 'image') {
        cardTitle.style.cursor = 'pointer'; cardTitle.tabIndex = 0; cardTitle.setAttribute('role', 'button');
        cardTitle.title = 'Criar, expandir ou ocultar o mapa mental desta nota · Ctrl: prévia da nota';
        cardTitle.onpointerdown = e => e.stopPropagation();
        cardTitle.onclick = e => { e.stopPropagation(); if (!this.previewImageNote(e)) this.toggleImageMindMap(n); };
        cardTitle.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); this.toggleImageMindMap(n); } };
      }
      if (n.flashcards?.length) head.createSpan({ cls: 'ia-flash-badge', text: `${n.flashcards.length} FC`, attr: { title: 'Flashcards deste nó' } });
      if (n.pins) head.createSpan({ text: `${n.pins.filter(p => !p.imageMap).length} pontos`, cls: 'ia-count' });
      if (n.visualChildOf) {
        const parent = this.board.nodes.find(node => node.id === n.visualChildOf);
        if (parent) {
          const add = head.createEl('button', { cls: 'ia-card-remove', attr: { title: 'Filho de nota existente · Shift+Tab', 'aria-label': 'Filho de nota existente' } }); setIcon(add, 'file-input');
          add.onpointerdown = e => e.stopPropagation(); add.onclick = e => { e.stopPropagation(); this.addMindNoteChild(parent); };
        }
      }
      if (n.type === 'image') {
        const mapPin = n.pins.find(p => p.imageMap && this.board.nodes.some(node => node.id === p.mapRoot && node.type === 'mind')) || n.pins.find(p => p.mapRoot && this.board.nodes.some(node => node.id === p.mapRoot && node.type === 'mind'));
        const mapRoot = mapPin && this.board.nodes.find(node => node.id === mapPin.mapRoot);
        if (mapRoot) {
          const label = mapRoot.pinHidden ? 'Expandir mapa' : 'Recolher mapa';
          const toggle = this.button(head, label, mapRoot.pinHidden ? 'chevron-right' : 'chevron-down', () => this.activatePin(n, mapPin));
          toggle.addClass('ia-image-map-toggle'); toggle.setAttribute('aria-expanded', String(!mapRoot.pinHidden));
          toggle.onpointerdown = e => e.stopPropagation();
        }
      }
      if (noteFlashcardPath(n) && !n.relation) {
        const studyNote = this.button(head, 'Estudar nota', 'play', () => this.reviewNoteFlashcards(n));
        studyNote.addClass('ia-note-study'); studyNote.title = 'Responder flashcards desta nota'; studyNote.onpointerdown = event => event.stopPropagation(); studyNote.onclick = event => { event.stopPropagation(); this.reviewNoteFlashcards(n); };
      }
      const remove = head.createEl('button', { cls: 'ia-card-remove', attr: { 'aria-label': 'Remover cartão do quadro', title: 'Remover cartão do quadro' } }); setIcon(remove, 'trash-2');
      if (n.type === 'mind') remove.remove();
      remove.onpointerdown = event => event.stopPropagation();
      remove.onclick = event => { event.stopPropagation(); this.removeNode(n); };
      head.onpointerdown = e => {
        if (e.button !== 0) return;
        if (n.type === 'image' && this.previewImageNote(e)) { e.preventDefault(); e.stopPropagation(); return; }
        e.preventDefault(); e.stopPropagation(); this.viewport.focus();
        if (this.mode === 'connect') { this.connect({ node: n.id }); return; }
        this.selected = { node: n.id }; this.source = null;
        this.drag = { type: 'node', node: n, cx: e.clientX, cy: e.clientY, x: n.x, y: n.y, pointerId: e.pointerId, pendingCheckpoint: true };
        if (n.type === 'mind') this.drag.branch = this.mindBranch(n).filter(child => child !== n).map(child => ({ node: child, x: child.x, y: child.y }));
        else if (n.visualChildOf || n.type === 'note' && n.noteMaps?.length) this.drag.branch = reusableNodes(this.board, n).filter(node => node !== n).map(node => ({ node, x: node.x, y: node.y }));
        if (this.multiSelection?.size > 1 && this.multiSelection.has(n.id)) this.drag.branch = this.groupNodes([...this.multiSelection]).filter(node => node !== n).map(node => ({ node, x: node.x, y: node.y }));
        this.highlight(); this.showSelection();
      };
      if (n.type === 'image') {
        const imageArea = el.createDiv({ cls: 'ia-image-area' }); imageArea.style.height = `${n.h}px`;
        const image = imageArea.createEl('img', { attr: { draggable: 'false', alt: n.title || n.path, loading: 'lazy', decoding: 'async' } });
        const file = this.app.vault.getFileByPath(n.path);
        if (file) image.src = this.app.vault.getResourcePath(file);
        else imageArea.createSpan({ text: 'Imagem não encontrada', cls: 'ia-missing' });
        imageArea.onclick = e => {
          if (e.target.closest('button')) return;
          if (this.previewImageNote(e)) { e.preventDefault(); e.stopPropagation(); return; }
          if (this.mode === 'area') return;
          if (this.mode === 'pin') { const r = imageArea.getBoundingClientRect(), u = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), v = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)); if (this.pendingMapPin) this.attachMapPin(n, u, v); else new PinModal(this, n, u, v).open(); }
          else if (this.mode === 'connect') this.connect({ node: n.id });
          else { this.selected = { node: n.id }; this.highlight(); this.showSelection(); }
        };
        this.bindImageArea(imageArea, n);
        for (const [i, p] of n.pins.entries()) {
          if (p.imageMap) continue;
          const map = p.mapRoot && this.board.nodes.find(item => item.id === p.mapRoot);
          const fixed = Boolean(this.pinnedSummary(n, p) || (map && !map.pinHidden));
          const pin = imageArea.createEl('button', { cls: `ia-pin${fixed ? ' is-pinned' : ''}`, text: String(i + 1), attr: { 'aria-label': map ? `${fixed ? 'Ocultar' : 'Mostrar'} mapa: ${p.label}` : `Escolher nota Markdown ou mapa mental: ${p.label}`, 'aria-pressed': String(fixed) } });
          pin.style.left = `${p.u * 100}%`; pin.style.top = `${p.v * 100}%`; pin.style.setProperty('--pin-color', /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : COLORS[0]);
          if (p.area) { pin.addClass('ia-region'); pin.style.width = `${p.area.w * 100}%`; pin.style.height = `${p.area.h * 100}%`; pin.title = p.label; }
          pin.onpointerdown = e => {
            if (e.button !== 0 || this.mode !== 'select') return;
            e.stopPropagation(); this.drag = { type: 'pin', node: n, pin: p, el: pin, cx: e.clientX, cy: e.clientY, u: p.u, v: p.v, pointerId: e.pointerId, moved: false, pendingCheckpoint: true };
          };
          pin.onclick = e => { e.stopPropagation(); if (this.skipPinClick === p.id) { this.skipPinClick = null; return; } if (this.mode === 'connect') this.connect({ node: n.id, pin: p.id }); else this.activatePin(n, p); };
        }
      } else if (n.type === 'web') {
        let session = this.webSessions.get(n.id);
        if (!session) { session = { path: n.path, host: el.createDiv({ cls: 'ia-web-card' }) }; session.host.createDiv({ text: 'Carregando página…', cls: 'ia-muted' }); this.webSessions.set(n.id, session); }
        if (session.host.parentElement !== el) el.appendChild(session.host);
        el.setAttribute('data-ia-web', n.id); this.place(el, n);
        if (session.reader) { session.reader.node = n; session.reader.refresh(); }
        if (this.webObserver) this.webObserver.observe(el); else { this.visibleWeb.add(n.id); activate(n); }
      } else if (n.type === 'mind') {
        el.style.setProperty('--ia-mind-color', /^#[0-9a-f]{6}$/i.test(n.color) ? n.color : COLORS[0]);
        const quick = n.relation ? head : el.createDiv({ cls: 'ia-node-quick-actions' });
        const quickAction = (label, icon, run) => {
          const b = n.relation ? quick.createEl('button', { cls: 'ia-node-menu ia-quick-icon', attr: { title: label, 'aria-label': label } }) : this.button(quick, label, icon, run);
          if (n.relation) { setIcon(b, icon); b.onclick = e => { e.stopPropagation(); run(); }; }
          b.onpointerdown = e => e.stopPropagation(); return b;
        };
        quickAction('Criar flashcard', 'layers', () => this.createFlashcard(n));
        if (this.mindChildren.get(n.id)?.length) {
          const toggle = quickAction(n.collapsed ? 'Expandir' : 'Recolher', n.collapsed ? 'chevron-right' : 'chevron-down', () => this.collapseMind(n));
          toggle.setAttribute('aria-expanded', String(!n.collapsed));
        }
        const options = head.createEl('button', { cls: 'ia-node-menu', attr: { 'aria-label': `Opções de ${n.title}`, title: 'Opções do nó · Botão direito também abre', 'aria-haspopup': 'menu' } });
        setIcon(options, 'ellipsis'); options.onpointerdown = e => e.stopPropagation();
        options.onclick = e => { e.preventDefault(); e.stopPropagation(); this.showMindMenu(n, e, options); };
        el.oncontextmenu = e => { if (e.target.closest('input,textarea,a,[contenteditable=true]')) return; e.preventDefault(); e.stopPropagation(); this.showMindMenu(n, e); };
        if (n.relation) { /* The compact junction is the relation's visible label. */ }
        else if (n.visualAsChild && !n.visualExpanded) el.createDiv({ cls: 'ia-mind-text', text: 'Nota visual recolhida · Expanda para mostrar o conteúdo.' });
        else if (n.path) {
          const note = el.createDiv({ cls: 'ia-note-content ia-mind-content' }); el.setAttribute('data-ia-node', n.id);
          if (this.noteObserver) { note.createSpan({ text: 'Carregando nota…', cls: 'ia-muted' }); this.noteObserver.observe(el); }
          else { this.visibleNotes.add(n.id); this.queueNotePreview(n.path, note); }
        } else el.createDiv({ cls: 'ia-mind-text', text: n.body || 'Adicione filhos ou transforme este nó em uma nota.' });
        el.ondblclick = event => { if (!event.target.closest('button,a,input')) { event.stopPropagation(); if (n.relation) this.renameMindInline(n); else n.path ? this.openLinkedVisualOrNote(n) : this.editMind(n); } };
        el.onclick = event => { if (event.target.closest('button,a')) return; this.viewport.focus(); if (this.mode === 'connect') this.connect({ node: n.id }); else { this.selected = { node: n.id }; this.highlight(); this.showSelection(); } };
      } else if (n.type === 'whiteboard') {
        const icon = head.createSpan({ cls: 'ia-board-icon' }); setIcon(icon, 'panels-top-left'); head.insertBefore(icon, cardTitle);
        const preview = el.createDiv({ cls: 'ia-board-preview', attr: { 'data-board-node': n.id } });
        preview.createDiv({ cls: 'ia-muted', text: 'Whiteboard vinculado' });
        if (this.subboardObserver) this.subboardObserver.observe(preview); else { preview._atlasBoardVisible = true; this.renderSubboardPreview(n, preview); }
        const open = this.button(el, 'Abrir whiteboard', 'arrow-up-right', () => this.navigateWhiteboard(n.path)); open.addClass('ia-board-open'); open.onpointerdown = e => e.stopPropagation();
        el.onclick = e => { if (e.target.closest('button,a')) return; this.selected = { node: n.id }; this.highlight(); this.showSelection(); };
        el.ondblclick = e => { if (e.target.closest('button,input')) return; e.preventDefault(); e.stopPropagation(); this.navigateWhiteboard(n.path); };
      } else {
        const quick = el.createDiv({ cls: 'ia-node-quick-actions' });
        const mapRoot = this.board.nodes.find(node => n.noteMaps?.includes(node.id) && node.type === 'mind');
        const flashcard = this.button(quick, 'Flashcard', 'layers', () => this.createFlashcard(n)); flashcard.title = 'Criar flashcard desta nota'; flashcard.onpointerdown = e => e.stopPropagation();
        if (mapRoot) {
          const child = this.button(quick, 'Filho', 'plus', () => { mapRoot.pinHidden = false; this.addMindNode(mapRoot); });
          child.title = 'Adicionar filho ao mapa desta nota · Tab'; child.onpointerdown = e => e.stopPropagation();
        }
        const toggle = this.button(quick, mapRoot ? (mapRoot.pinHidden ? 'Expandir mapa' : 'Recolher mapa') : 'Criar mapa mental', mapRoot ? (mapRoot.pinHidden ? 'chevron-right' : 'chevron-down') : 'git-fork', () => this.toggleNoteMindMap(n));
        toggle.onpointerdown = e => e.stopPropagation();
        if (mapRoot) toggle.setAttribute('aria-expanded', String(!mapRoot.pinHidden));
        const note = el.createDiv({ cls: 'ia-note-content' }); el.setAttribute('data-ia-node', n.id);
        if (this.noteObserver) { note.createSpan({ text: 'Carregando resumo…', cls: 'ia-muted' }); this.noteObserver.observe(el); }
        else { this.visibleNotes.add(n.id); this.queueNotePreview(n.path, note); }
        note.onclick = e => { if (e.target.closest('a')) return; if (this.mode === 'connect') this.connect({ node: n.id }); else { this.selected = { node: n.id }; this.highlight(); this.showSelection(); } };
      }
      const resize = el.createEl('button', { cls: 'ia-resize', attr: { 'aria-label': 'Redimensionar cartão' } }); setIcon(resize, 'grip');
      if (n.relation) resize.style.display = 'none';
      resize.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); this.drag = { type: 'resize', node: n, cx: e.clientX, cy: e.clientY, w: n.w, h: n.h, pointerId: e.pointerId, pendingCheckpoint: true }; };
      if (n.type === 'web') this.place(el, n);
    }
    this.highlight(); this.drawGroups();
  }
  place(el, n) {
    if (n.type === 'web') {
      const c = this.board.camera, dpr = el.ownerDocument.defaultView.devicePixelRatio || 1;
      const pixel = value => Math.round(value * dpr) / dpr;
      el.style.left = `${pixel(c.x + n.x * c.z)}px`; el.style.top = `${pixel(c.y + n.y * c.z)}px`;
      el.style.width = `${pixel(n.w * c.z)}px`; el.style.setProperty('--ia-card-zoom', String(c.z));
      const head = el.querySelector('.ia-card-head'); if (head) head.style.zoom = String(c.z);
      const body = el.querySelector('.ia-web-card'); if (body) body.style.height = `${pixel(n.h * c.z)}px`;
      const toolbar = el.querySelector('.ia-reader-toolbar'); if (toolbar) toolbar.style.zoom = String(c.z);
      const resize = el.querySelector('.ia-resize'); if (resize) resize.style.zoom = String(c.z);
      this.webSessions?.get(n.id)?.reader?.applyPageZoom();
      return;
    }
    const placement = `${n.type}:${n.x}:${n.y}:${n.w}:${n.h}`;
    if (el._atlasPlacement === placement) return;
    el._atlasPlacement = placement;
    el.style.left = `${n.x}px`; el.style.top = `${n.y}px`; el.style.width = `${n.w}px`; if (n.type === 'note' || n.type === 'mind' || n.type === 'whiteboard') el.style.height = `${n.h + 42}px`;
  }
  scheduleMove(e) {
    if (!this.drag || e.pointerId !== this.drag.pointerId) return;
    this.pendingMotion = { clientX: e.clientX, clientY: e.clientY, pointerId: e.pointerId };
    if (this.motionFrame !== null) return;
    const win = this.contentEl.ownerDocument.defaultView;
    this.motionFrame = win.requestAnimationFrame(() => { this.motionFrame = null; const next = this.pendingMotion; this.pendingMotion = null; if (next) this.move(next); });
  }
  move(e) {
    const d = this.drag; if (!d || e.pointerId !== d.pointerId || !this.viewport?.isConnected) return;
    const dx = e.clientX - d.cx, dy = e.clientY - d.cy, z = this.board.camera.z;
    if (d.pendingCheckpoint) {
      if (Math.hypot(dx, dy) <= 4) return;
      const grouped = d.node && this.board.groups?.some(g => this.groupContents(g).some(n => n.id === d.node.id));
      this.checkpoint(d.type === 'group' || grouped ? 'board' : 'content'); d.pendingCheckpoint = false;
    }
    if (d.type === 'pan') { this.board.camera.x = d.x + dx; this.board.camera.y = d.y + dy; this.camera(); return; }
    const dirtyEdges = new Set();
    if (d.type === 'group') {
      d.group.x = d.x + dx / z; d.group.y = d.y + dy / z;
      for (const item of d.branch) { item.node.x = item.x + dx / z; item.node.y = item.y + dy / z; const el = this.nodeElements.get(item.node.id); if (el) this.place(el, item.node); }
      this.drawEdges(new Set(d.branch.map(item => item.node.id))); this.drawGroups(true); return;
    }
    if (d.type === 'node') { d.node.x = d.x + dx / z; d.node.y = d.y + dy / z; this.place(this.nodeElements.get(d.node.id), d.node); dirtyEdges.add(d.node.id); for (const item of d.branch || []) { item.node.x = item.x + dx / z; item.node.y = item.y + dy / z; const el = this.nodeElements.get(item.node.id); if (el) this.place(el, item.node); dirtyEdges.add(item.node.id); } }
    if (d.type === 'pin' && (d.moved || Math.hypot(dx, dy) > 4)) {
      const halfW = (d.pin.area?.w || 0) / 2, halfH = (d.pin.area?.h || 0) / 2;
      d.moved = true; d.pin.u = Math.max(halfW, Math.min(1 - halfW, d.u + dx / (z * d.node.w))); d.pin.v = Math.max(halfH, Math.min(1 - halfH, d.v + dy / (z * d.node.h)));
      d.el.style.left = `${d.pin.u * 100}%`; d.el.style.top = `${d.pin.v * 100}%`; dirtyEdges.add(d.node.id);
    }
    if (d.type === 'resize') {
      d.node.w = Math.max(180, d.w + dx / z); d.node.h = d.node.type === 'image' ? d.h * d.node.w / d.w : Math.max(120, d.h + dy / z);
      const el = this.nodeElements.get(d.node.id); this.place(el, d.node); if (d.node.type === 'image') el.querySelector('.ia-image-area').style.height = `${d.node.h}px`; dirtyEdges.add(d.node.id);
    }
    if (d.type === 'node' || d.type === 'resize') {
      const proxy = this.board.nodes.find(n => n.id === d.node.visualChildOf);
      if (proxy) { proxy.x = d.node.x; proxy.y = d.node.y; proxy.w = d.node.w; proxy.h = d.node.h; dirtyEdges.add(proxy.id); }
      this.alignVisualChildren(true, dirtyEdges);
      if (this.board.groups?.length) this.drawGroups(true);
    }
    if (dirtyEdges.size) this.drawEdges(dirtyEdges);
  }
  endDrag() {
    if (this.motionFrame !== null) { this.contentEl.ownerDocument.defaultView.cancelAnimationFrame(this.motionFrame); this.motionFrame = null; }
    if (this.pendingMotion) { const event = this.pendingMotion; this.pendingMotion = null; this.move(event); }
    if (this.drag) {
      if (this.drag.type === 'pin' && this.drag.moved) this.skipPinClick = this.drag.pin.id;
      const groupMove = this.drag.type === 'group';
      const movedNode = this.drag.node;
      const groupedMove = movedNode && (this.drag.type === 'node' || this.drag.type === 'resize') && this.board.groups?.some(g => this.groupContents(g).some(n => n.id === movedNode.id));
      // Position and size are board-local; only moving a pin edits note content.
      const visual = this.drag.type === 'pin';
      const proxy = this.drag.type === 'resize' && this.board.nodes.find(n => n.id === this.drag.node.visualChildOf);
      this.drag = null; if (proxy) { this.layoutMind(proxy.mapId); this.render(); }
      if (groupedMove) { this.drawEdges(); this.drawGroups(); }
      if (groupMove || groupedMove) this.rememberVisualLayout();
      this.changed(false, visual);
    }
  }
  highlight() { for (const [id, el] of this.nodeElements || []) el.toggleClass('is-selected', id === this.selected?.node || id === this.source?.node || this.multiSelection?.has(id)); }
  endpoint(point, other) {
    let n = this.nodeById?.get(point.node); if (!n) return null;
    if (!point.pin && this.noteMapOwners?.has(n.id)) n = this.noteMapOwners.get(n.id);
    if (!point.pin && n.visualAsChild && n.visualExpanded && n.linkedVisualRoot) n = this.nodeById.get(n.linkedVisualRoot) || n;
    const p = point.pin && n.pins?.find(item => item.id === point.pin);
    if (p) return n.type === 'web' ? { x: n.x + n.w, y: n.y + 42 + Math.min(n.h - 20, 155 + n.pins.indexOf(p) * 36) } : { x: n.x + p.u * n.w, y: n.y + 42 + p.v * n.h };
    const right = !other || other.x >= n.x + n.w / 2;
    return { x: n.x + (right ? n.w : 0), y: n.y + (n.type === 'mind' ? (n.h + 42) / 2 : 42 + n.h / 2) };
  }
  /** Reuse SVG elements; dragging touches only the moved node's adjacent connectors. */
  drawEdges(nodeId) {
    if (!this.edgesEl) return;
    const doc = this.contentEl.ownerDocument, ns = 'http://www.w3.org/2000/svg';
    if (!this.edgeSvg?.isConnected || this.edgeSvg.parentElement !== this.edgesEl) {
      this.edgesEl.empty(); this.edgeElements = new Map(); this.edgeAdjacency = new Map();
      this.edgeSvg = doc.createElementNS(ns, 'svg'); this.edgeSvg.setAttribute('class', 'ia-lines'); this.edgesEl.appendChild(this.edgeSvg);
      nodeId = null;
    }
    if (!nodeId) {
      const live = new Set(this.board.edges.map(e => e.id));
      for (const [id, pair] of this.edgeElements) if (!live.has(id)) { pair.path.remove(); pair.dot.remove(); pair.label?.remove(); this.edgeElements.delete(id); }
      this.edgeAdjacency = new Map();
      for (const e of this.board.edges) for (const id of new Set([e.from.node, e.to.node])) {
        if (!this.edgeAdjacency.has(id)) this.edgeAdjacency.set(id, []); this.edgeAdjacency.get(id).push(e);
      }
    }
    const edges = nodeId instanceof Set ? affectedEdges(this.edgeAdjacency, nodeId) : nodeId ? this.edgeAdjacency.get(nodeId) || [] : this.board.edges;
    for (const e of edges) {
      const hidden = [e.from.node, e.to.node].some(id => this.hiddenVisualNodes.has(id) || (this.nodeById.get(id)?.type === 'mind' && !this.visibleMind.has(id))) || (e.visualLink && (!this.nodeById.get(e.from.node)?.visualExpanded || this.nodeById.get(e.from.node)?.visualAsChild)) || (e.noteMap && this.noteMapOwners?.has(e.to.node));
      const existing = this.edgeElements.get(e.id); if (existing && existing.hidden !== hidden) { existing.path.style.display = hidden ? 'none' : ''; existing.dot.style.display = hidden ? 'none' : ''; if (existing.label) existing.label.style.display = hidden ? 'none' : ''; existing.hidden = hidden; } if (hidden) continue;
      const targetNode = this.nodeById.get(e.to.node), sourceNode = this.nodeById.get(e.from.node);
      const a = this.endpoint(e.from, targetNode), b = this.endpoint(e.to, sourceNode); if (!a || !b) continue;
      const geometry = `${a.x}:${a.y}:${b.x}:${b.y}:${e.color}:${e.label || ''}`;
      if (existing?.geometry === geometry) continue;
      let pair = this.edgeElements.get(e.id);
      if (!pair) {
        const path = doc.createElementNS(ns, 'path'), dot = doc.createElementNS(ns, 'circle');
        path.setAttribute('class', 'ia-line'); path.setAttribute('vector-effect', 'non-scaling-stroke'); dot.setAttribute('r', '4');
        this.bindEdgeActions(path, e.id);
        this.edgeSvg.appendChild(path); this.edgeSvg.appendChild(dot); pair = { path, dot }; this.edgeElements.set(e.id, pair);
      }
      pair.geometry = geometry; pair.hidden = false;
      const bend = Math.max(65, Math.abs(b.x - a.x) * .45), direction = b.x >= a.x ? 1 : -1;
      pair.path.setAttribute('d', 'M ' + a.x + ' ' + a.y + ' C ' + (a.x + bend * direction) + ' ' + a.y + ', ' + (b.x - bend * direction) + ' ' + b.y + ', ' + b.x + ' ' + b.y);
      const color = /^#[0-9a-f]{6}$/i.test(e.color) ? e.color : COLORS[0];
      pair.path.setAttribute('stroke', color); pair.dot.setAttribute('cx', b.x); pair.dot.setAttribute('cy', b.y); pair.dot.setAttribute('fill', color);
      if (e.label) {
        if (!pair.label) {
          const label = doc.createElementNS(ns, 'g'), rect = doc.createElementNS(ns, 'rect'), text = doc.createElementNS(ns, 'text');
          label.setAttribute('class', 'ia-edge-label'); rect.setAttribute('rx', '6'); text.setAttribute('text-anchor', 'middle'); text.setAttribute('dominant-baseline', 'central'); label.append(rect, text);
          this.bindEdgeActions(label, e.id);
          this.edgeSvg.appendChild(label); pair.label = label;
        }
        const title = e.label.length > 44 ? e.label.slice(0, 43) + '…' : e.label, width = Math.min(360, title.length * 8 + 24);
        pair.label.setAttribute('transform', `translate(${(a.x + b.x) / 2},${(a.y + b.y) / 2})`);
        const rect = pair.label.querySelector('rect'); rect.setAttribute('x', String(-width / 2)); rect.setAttribute('y', '-14'); rect.setAttribute('width', String(width)); rect.setAttribute('height', '28'); pair.label.querySelector('text').textContent = title;
      } else if (pair.label) { pair.label.remove(); pair.label = null; }
    }
  }

  bindEdgeActions(element, edgeId) {
    element.onclick = event => { event.stopPropagation(); const edge = this.board.edges.find(e => e.id === edgeId); if (edge) this.showEdge(edge); };
    const rename = event => { event.preventDefault(); event.stopPropagation(); const edge = this.board.edges.find(e => e.id === edgeId); if (edge) this.editEdgeLabel(edge); };
    element.ondblclick = rename;
    element.oncontextmenu = rename;
  }
  connect(point) {
    if (!this.source) { this.source = point; this.selected = point; this.highlight(); this.hint.textContent = 'Agora clique na imagem, no cartão ou no alfinete de destino.'; return; }
    if (this.source.node === point.node && this.source.pin === point.pin) { this.source = null; this.highlight(); return; }
    if (!this.board.edges.some(e => JSON.stringify(e.from) === JSON.stringify(this.source) && JSON.stringify(e.to) === JSON.stringify(point))) {
      this.checkpoint(); this.board.edges.push({ id: uid(), from: this.source, to: point, color: COLORS[this.board.edges.length % COLORS.length] }); this.changed();
    }
    this.source = null; this.mode = 'select'; this.render();
  }
  queueNotePreview(path, el) {
    if (this.board.camera.z < .35) { this.notePreview(path, el); return; }
    el._atlasRequested = true; this.previewJobs ||= new Map();
    this.previewJobs.set(el, { path, board: this.board });
    if (this.previewQueueFrame != null) return;
    const win = this.contentEl.ownerDocument.defaultView;
    const drain = () => {
      this.previewQueueFrame = null; let count = 0;
      for (const [target, job] of this.previewJobs) {
        this.previewJobs.delete(target);
        if (!target.isConnected || job.board !== this.board || !target._atlasRequested) continue;
        this.notePreview(job.path, target);
        if (++count === 2) break;
      }
      if (this.previewJobs.size) this.previewQueueFrame = win.requestAnimationFrame(drain);
    };
    this.previewQueueFrame = win.requestAnimationFrame(drain);
  }
  async notePreview(path, el) {
    const previous = this.previews.get(el); if (previous) { this.removeChild(previous); this.previews.delete(el); }
    const token = uid(), generation = this.previewGeneration; el._atlasToken = token; el.setAttribute('data-ia-source', path);
    if (el.classList.contains('ia-note-content') && this.board.camera.z < .35) {
      el._atlasRequested = false; el.empty(); el.createSpan({ text: 'Resumo · amplie para ler', cls: 'ia-muted' }); return;
    }
    const file = this.app.vault.getFileByPath(path); el.empty();
    if (!file) { el.createEl('p', { text: 'Nota não encontrada.' }); return; }
    try {
      const raw = await this.readNote(file);
      if (!el.isConnected || el._atlasToken !== token || this.previewGeneration !== generation) return;
      const child = new Component(); this.addChild(child); this.previews.set(el, child);
      const compact = el.classList.contains('ia-note-content');
      const body = atlasNotePreviewText(raw, compact ? 8000 : 32000);
      await MarkdownRenderer.render(this.app, compact ? this.app.noteMedia?.cardMarkdown(raw) || body.text : body.text, el, file.path, child);
      if (body.truncated && el.isConnected && el._atlasToken === token) {
        const link = el.createEl('a', { cls: 'internal-link ia-muted', text: 'Abrir nota completa', attr: { 'data-href': file.path, href: file.path } });
      }
    }
    catch { if (el.isConnected) el.createEl('p', { text: 'Não foi possível carregar a nota.' }); }
  }
  /** Share concurrent reads and bound retained text; offscreen Markdown is not rendered. */
  async readNote(file) {
    const key = `${file.stat.mtime}:${file.stat.size}`, cached = this.previewCache.get(file.path);
    if (cached?.key === key) return cached.raw;
    const pendingKey = `${file.path}:${key}`;
    if (this.pendingPreviewReads.has(pendingKey)) return this.pendingPreviewReads.get(pendingKey);
    const path = file.path;
    const pending = this.app.vault.cachedRead(file).then(raw => {
      if (raw.length < 200000 && key === `${file.stat.mtime}:${file.stat.size}` && file.path === path) {
        this.previewCache.set(path, { key, raw }); let size = 0;
        for (const item of this.previewCache.values()) size += item.raw.length * 2;
        while (this.previewCache.size > 50 || size > 4 * 1024 * 1024) { const oldest = this.previewCache.keys().next().value; size -= this.previewCache.get(oldest).raw.length * 2; this.previewCache.delete(oldest); }
      }
      return raw;
    }).finally(() => this.pendingPreviewReads.delete(pendingKey));
    this.pendingPreviewReads.set(pendingKey, pending); return pending;
  }
  renderNotes(path) { for (const n of this.board.nodes) if ((n.type === 'note' || n.type === 'mind') && n.path && (!path || n.path === path) && this.visibleNotes.has(n.id)) { const el = this.nodeElements?.get(n.id)?.querySelector('.ia-note-content'); if (el) this.queueNotePreview(n.path, el); } }
  rememberVisualLayout() {
    this.visualHashes ||= new Map(); this.visualContentHashes ||= new Map(); this.visualInputHashes ||= new Map(); const index = atlasSceneIndex(this.board);
    for (const root of this.board.nodes) if (root.visualSource) {
      const bundle = reusableBundle(this.board, root, index);
      this.visualHashes.set(root.visualSource, JSON.stringify(bundle)); this.visualContentHashes.set(root.id, visualContentHash(bundle));
      this.visualInputHashes.set(root.id, visualInputHash(this.board, root, index));
    }
  }
  revealExistingMaps() {
    this.checkpoint('board');
    for (const node of this.board.nodes) {
      if (node.type === 'mind') { node.collapsed = false; if (!node.parentId) node.pinHidden = false; }
      if (node.linkedVisualRoot) { node.visualExpanded = true; delete node.visualCollapsed; }
    }
    this.selected = null; this.selectedGroup = null; this.multiSelection?.clear();
    this.changed(false, false); this.render(); this.fit(); this.restoreDirectVisualChildren();
  }
  groupNodes(ids) {
    const byId = new Map(this.board.nodes.map(n => [n.id, n])), children = new Map();
    for (const node of this.board.nodes) if (node.parentId) { if (!children.has(node.parentId)) children.set(node.parentId, []); children.get(node.parentId).push(node); }
    const result = [], seen = new Set(), queue = ids.map(id => byId.get(id)).filter(Boolean);
    while (queue.length) {
      const node = queue.pop(); if (!node || seen.has(node.id)) continue; seen.add(node.id); result.push(node);
      queue.push(...(children.get(node.id) || []));
      if (node.type === 'image' || node.type === 'note' && node.noteMaps?.length) queue.push(...reusableNodes(this.board, node));
      if (node.linkedVisualRoot) queue.push(byId.get(node.linkedVisualRoot));
      if (node.visualChildOf) queue.push(byId.get(node.visualChildOf));
    }
    return result;
  }
  groupContents(group) {
    const excluded = new Set(this.groupNodes(group.excluded || []).map(n => n.id));
    return this.groupNodes(group.members).filter(n => !excluded.has(n.id));
  }
  restorePreviousMapLayout() {
    if (!this.board.groups?.length || this.board.groupSpacingRepair === 1) return false;
    // Repair positions once; sections never arrange individual mind-map nodes again.
    for (const root of this.board.nodes.filter(n => n.type === 'mind' && !n.parentId)) {
      const image = this.board.nodes.find(n => n.type === 'image' && n.pins.some(p => p.mapRoot === root.id));
      if (image) {
        const pin = image.pins.find(p => p.mapRoot === root.id);
        root.x = image.x + image.w + 100; root.y = image.y + 42 + pin.v * image.h - (root.h + 42) / 2;
      }
      this.layoutMind(root.id);
    }
    this.board.groupSpacingRepair = 1; this.rememberVisualLayout(); this.requestSave(); return true;
  }
  removeGroupItems(group, ids) {
    this.checkpoint('board'); const removed = new Set(ids);
    group.members = group.members.filter(id => !removed.has(id));
    group.excluded = [...new Set([...(group.excluded || []), ...ids])];
    this.changed(false, false); this.drawGroups(); this.showSelection();
  }
  async addGroupNote(group, file) {
    const board = this.board; if (!board.groups?.includes(group)) return;
    const frame = this.groupElements?.get(group.id);
    const x = frame ? parseFloat(frame.style.left) + 40 : group.x + 40, y = frame ? parseFloat(frame.style.top) + 70 : group.y + 70;
    await this.addVisualNote(file, { x, y });
    if (this.board !== board || !board.groups.includes(group)) return;
    const root = board.nodes.find(n => n.visualNote === file.path) || board.nodes.find(n => n.path === file.path);
    if (!root) return;
    this.assignGroup(group, [root.id]); this.drawEdges(); this.drawGroups();
  }
  editGroupMembership() {
    const ids = this.multiSelection?.size ? [...this.multiSelection] : this.selected?.node ? [this.selected.node] : [];
    if (!ids.length) { new Notice('Selecione um ou mais cartões primeiro.'); return; }
    const board = this.board, modal = new Modal(this.app); modal.setTitle('Organizar na seção');
    const select = modal.contentEl.createEl('select'); select.createEl('option', { value: '', text: 'Fora de todos os grupos' });
    for (const group of board.groups || []) select.createEl('option', { value: group.id, text: group.title });
    modal.contentEl.createEl('button', { text: 'Aplicar', cls: 'mod-cta' }).onclick = () => {
      if (this.board !== board) { modal.close(); return; }
      const group = board.groups?.find(g => g.id === select.value);
      if (group) this.assignGroup(group, ids);
      else { this.checkpoint('board'); for (const g of board.groups || []) { g.members = g.members.filter(id => !ids.includes(id)); g.excluded = [...new Set([...(g.excluded || []), ...ids])]; } this.changed(false, false); this.drawGroups(); this.showSelection(); }
      modal.close();
    }; modal.open();
  }
  createGroup() {
    const board = this.board, members = this.multiSelection?.size ? [...this.multiSelection] : this.selected?.node ? [this.selected.node] : [];
    new AtlasGroupModal(this, null, (title, color) => {
      if (this.board !== board) return; this.checkpoint('board');
      const group = { id: uid(), title, color, members: [], x: -board.camera.x / board.camera.z + 70, y: -board.camera.y / board.camera.z + 70 };
      board.groups ||= []; board.groups.push(group); this.assignGroup(group, members, false);
    }).open();
  }
  assignGroup(group, ids, checkpoint = true) {
    if (!this.board.groups?.includes(group)) return;
    if (checkpoint) this.checkpoint('board');
    const members = new Set(ids.filter(id => this.board.nodes.some(n => n.id === id)));
    for (const other of this.board.groups) if (other !== group) other.members = other.members.filter(id => !members.has(id));
    group.members = [...new Set([...group.members, ...members])];
    const added = new Set(this.groupNodes([...members]).map(n => n.id)); group.excluded = (group.excluded || []).filter(id => !added.has(id));
    this.selectedGroup = group.id; this.multiSelection?.clear(); this.selected = null;
    this.changed(false, false); this.drawGroups(); this.highlight(); this.showSelection();
  }
  showGroup(group) {
    this.clearPanel(); this.panel.createEl('h2', { text: group.title });
    this.panel.createEl('p', { text: `${group.members.filter(id => this.board.nodes.some(n => n.id === id)).length} itens principais · Arraste o título para mover o grupo.` });
    const board = this.board;
    this.button(this.panel, 'Adicionar nota da biblioteca à seção', 'notebook', () => new FilePicker(this.app, this.app.vault.getMarkdownFiles(), file => { if (this.board === board && board.groups.includes(group)) this.addGroupNote(group, file).catch(error => new Notice(error.message)); }, 'Escolher nota para esta seção…').open());
    this.button(this.panel, 'Criar nota nesta seção', 'file-plus', () => new MindTextModal(this, 'Nova nota', '', async (title, body) => {
      if (this.board !== board || !board.groups.includes(group)) return;
      try { const file = await this.createAtlasNote(title, body); if (this.board === board && board.groups.includes(group)) await this.addGroupNote(group, file); }
      catch (error) { new Notice(`Não foi possível adicionar a nota: ${error.message}`); }
    }).open());
    this.button(this.panel, 'Renomear / escolher cor', 'palette', () => new AtlasGroupModal(this, group, (title, color) => {
      if (!this.board.groups?.includes(group)) return; this.checkpoint('board'); group.title = title; group.color = color; this.changed(false, false); this.drawGroups(); this.showSelection();
    }).open());
    const selected = this.multiSelection?.size ? [...this.multiSelection] : this.selected?.node ? [this.selected.node] : [];
    if (selected.length) this.button(this.panel, 'Adicionar seleção a este grupo', 'plus', () => this.assignGroup(group, selected));
    if (selected.length) this.button(this.panel, 'Retirar seleção deste grupo (manter no quadro)', 'folder-output', () => this.removeGroupItems(group, selected));
    this.panel.createEl('h3', { text: 'Itens da seção' });
    for (const id of group.members) { const node = this.board.nodes.find(n => n.id === id); if (node) this.button(this.panel, `Retirar: ${node.title || node.path}`, 'minus', () => this.removeGroupItems(group, [id])); }
    this.button(this.panel, 'Desfazer grupo (manter os cartões)', 'ungroup', () => {
      this.checkpoint('board'); this.board.groups = this.board.groups.filter(g => g !== group); this.selectedGroup = null;
      this.changed(false, false); this.drawGroups(); this.showSelection();
    });
    this.panel.createEl('p', { text: 'Para adicionar outros cartões, selecione com Shift+clique e escolha este grupo no painel. Também pode selecionar um cartão e clicar no título do grupo.' });
  }
  drawGroups(geometryOnly = false) {
    if (!this.groupsEl) return;
    if (!geometryOnly) {
      this.groupsEl.empty(); this.groupElements = new Map(); this.groupGeometry = new Map();
      for (const group of this.board.groups || []) {
        const frame = this.groupsEl.createDiv({ cls: 'ia-group-frame' }); frame.style.setProperty('--ia-group-color', group.color);
        const title = frame.createEl('button', { cls: 'ia-group-title', text: group.title, attr: { title: 'Arraste para mover · Dois cliques para renomear' } });
        title.onpointerdown = e => {
          if (e.button !== 0) return; e.preventDefault(); e.stopPropagation(); this.viewport.focus(); this.selectedGroup = group.id;
          this.drag = { type: 'group', group, branch: this.groupContents(group).map(node => ({ node, x: node.x, y: node.y })), x: group.x, y: group.y, cx: e.clientX, cy: e.clientY, pointerId: e.pointerId, pendingCheckpoint: true };
          this.showSelection();
        };
        title.onclick = e => { e.stopPropagation(); this.selectedGroup = group.id; this.drawGroups(true); this.showSelection(); };
        title.ondblclick = e => { e.stopPropagation(); new AtlasGroupModal(this, group, (name, color) => { if (!this.board.groups?.includes(group)) return; this.checkpoint('board'); group.title = name; group.color = color; this.changed(false, false); this.drawGroups(); this.showSelection(); }).open(); };
        this.groupElements.set(group.id, frame);
        this.groupGeometry.set(group.id, this.groupContents(group).filter(n => this.nodeElements?.has(n.id)));
      }
    }
    for (const group of this.board.groups || []) {
      const frame = this.groupElements?.get(group.id); if (!frame) continue;
      const nodes = this.groupGeometry.get(group.id) || [];
      let left = group.x, top = group.y, right = left + 440, bottom = top + 280;
      if (nodes.length) {
        left = Infinity; top = Infinity; right = -Infinity; bottom = -Infinity;
        for (const node of nodes) { left = Math.min(left, node.x - 24); top = Math.min(top, node.y - 62); right = Math.max(right, node.x + node.w + 24); bottom = Math.max(bottom, node.y + node.h + 66); }
      }
      frame.style.left = `${left}px`; frame.style.top = `${top}px`; frame.style.width = `${right - left}px`; frame.style.height = `${bottom - top}px`;
      frame.toggleClass('is-selected', this.selectedGroup === group.id);
    }
  }
  setSidebarOpen(open) {
    this.sidebarOpen = Boolean(open);
    if (this.sidebar) this.sidebar.hidden = !this.sidebarOpen;
    if (this.sidebarToggle) { this.sidebarToggle.toggleClass('is-active', this.sidebarOpen); this.sidebarToggle.setAttribute('aria-expanded', String(this.sidebarOpen)); }
    if (this.sidebarOpen) this.showSelection();
    else { this.clearPanel(); this.viewport?.focus(); }
    this.camera();
  }
  showSelection() {
    if (!this.panel || !this.sidebarOpen) return;
    for (const id of this.multiSelection || []) if (!this.board.nodes.some(n => n.id === id)) this.multiSelection.delete(id);
    const group = this.board.groups?.find(g => g.id === this.selectedGroup);
    if (group) { this.showGroup(group); return; }
    if (this.multiSelection?.size > 1) {
      this.clearPanel(); this.panel.createEl('h2', { text: `${this.multiSelection.size} cartões selecionados` });
      this.button(this.panel, 'Criar notas selecionadas · Ctrl+Shift+Enter', 'files', () => this.convertSelectedMindNotes());
      this.button(this.panel, 'Criar grupo com a seleção', 'group', () => this.createGroup());
      if (this.board.groups?.length) {
        this.panel.createEl('label', { text: 'Adicionar a um grupo existente' });
        const select = this.panel.createEl('select');
        for (const g of this.board.groups) select.createEl('option', { value: g.id, text: g.title });
        this.button(this.panel, 'Adicionar ao grupo', 'plus', () => { const g = this.board.groups.find(g => g.id === select.value); if (g) this.assignGroup(g, [...this.multiSelection]); });
      }
      this.panel.createEl('p', { text: 'Shift+clique adiciona ou remove cartões da seleção. Ctrl+Shift+Enter cria as notas dos nós selecionados. Ctrl+G cria um grupo.' }); return;
    }
    if (this.pendingMapPin) {
      this.clearPanel(); this.panel.createEl('h2', { text: 'Posicionar alfinete do mapa' });
      this.panel.createEl('p', { text: `Clique em um ponto da imagem para vincular “${this.pendingMapPin.root.title}”. O mapa será preservado.` });
      this.button(this.panel, this.mode === 'area' ? 'Marcar como ponto' : 'Marcar como área', 'scan', () => { this.mode = this.mode === 'area' ? 'pin' : 'area'; this.render(); });
      this.button(this.panel, 'Cancelar · Esc', 'x', () => this.setMode('select')); return;
    }
    const n = this.board.nodes.find(item => item.id === this.selected?.node);
    const p = n?.pins?.find(item => item.id === this.selected?.pin);
    if (p) { this.showPin(n, p); return; }
    if (n?.type === 'mind') { this.showMind(n); return; }
    this.clearPanel();
    if (!n) {
      this.panel.createDiv({ text: 'SEU ATLAS VISUAL', cls: 'ia-eyebrow' });
      this.panel.createEl('h2', { text: 'Do detalhe à ideia' });
      this.panel.createEl('p', { text: '1. Adicione uma imagem.\n2. Ative Alfinete e marque uma região.\n3. Crie ou vincule seu resumo.\n4. Conecte imagens para aprofundar o assunto.', cls: 'ia-instructions' });
      this.panel.createEl('p', { text: 'Os resumos são notas Markdown normais, com links e backlinks do Obsidian.', cls: 'ia-muted' });
      const index = this.app.vault.getFileByPath(this.board.indexPath);
      if (index) this.button(this.panel, 'Abrir índice do quadro', 'list-tree', () => this.openNote(index.path));
      return;
    }
    this.panel.createDiv({ text: n.type === 'image' ? 'IMAGEM SELECIONADA' : n.type === 'web' ? 'PÁGINA EXTERNA' : 'RESUMO', cls: 'ia-eyebrow' });
    this.panel.createEl('h2', { text: n.title || n.path.split('/').pop().replace(/\.md$/, '') });
    if (n.type === 'whiteboard') {
      this.button(this.panel, 'Abrir whiteboard', 'arrow-up-right', () => this.navigateWhiteboard(n.path));
      this.panel.createEl('p', { text: 'Este cartão é um vínculo. Removê-lo daqui mantém o whiteboard original e todo o seu conteúdo.' });
    } else if (n.type === 'note') {
      this.button(this.panel, 'Colar imagem nesta nota', 'clipboard-paste', () => new MapImageModal(this, n, true).open());
      this.button(this.panel, 'Colar link nesta nota', 'link', () => this.app.noteMedia.pickForNode(this, n));
      this.button(this.panel, 'Editar nota', 'square-pen', () => this.openNote(n.path));
      this.flashcardActions(n, this.panel);
      this.button(this.panel, 'Estudar todos os flashcards', 'play', () => this.reviewBoardFlashcards());
      this.notePreview(n.path, this.panel.createDiv({ cls: 'ia-summary' }));
    } else if (n.type === 'web') {
      this.button(this.panel, 'Abrir página e marcar', 'globe', () => this.openWeb(n));
      this.panel.createEl('p', { text: this.app.metadataCache.getFirstLinkpathDest(n.path)?.basename || n.path.split('/').pop().replace(/\.md$/i,''), cls: 'ia-muted' });
      n.pins.forEach((pin, i) => this.button(this.panel, `${i + 1}. ${pin.label}`, 'map-pin', () => { this.selected = { node: n.id, pin: pin.id }; this.showPin(n, pin); }));
    } else {
      this.button(this.panel, 'Renomear imagem', 'square-pen', () => new ImageNameModal(this, n).open());
      const imageMap = this.board.nodes.find(node => node.type === 'mind' && n.pins.some(p => p.imageMap && p.mapRoot === node.id));
      this.button(this.panel, imageMap ? (imageMap.pinHidden ? 'Expandir mapa mental desta nota' : 'Ocultar mapa mental desta nota') : 'Criar mapa mental desta nota', 'git-fork', () => this.toggleImageMindMap(n));
      const parent = this.board.nodes.find(node => node.id === n.visualChildOf);
      if (parent) {
        this.button(this.panel, 'Mover ramo para outro pai', 'git-pull-request-arrow', () => this.beginMindReparent(parent));
        this.button(this.panel, '+ Filho · Tab', 'plus', () => this.addMindNode(parent));
        this.button(this.panel, '+ Filho de nota existente · Shift+Tab', 'file-input', () => this.addMindNoteChild(parent));
        this.button(this.panel, 'Recolher para título', 'fold-vertical', () => this.toggleLinkedVisual(parent));
      }
      if (n.flashcards?.length || noteFlashcardPath(n)) this.flashcardActions(n, this.panel);
      if (n.visualNote) {
        this.button(this.panel, 'Abrir nota Markdown original', 'file-text', () => this.openNote(n.visualNote));
        this.button(this.panel, 'Desvincular imagem da nota', 'unlink', () => this.unlinkVisualImage(n));
      }
      else this.button(this.panel, 'Vincular à nota Markdown original', 'notebook', () => new VisualNoteModal(this, n).open());
      this.button(this.panel, 'Marcar uma área · arrastar', 'scan', () => this.setMode('area'));
      this.button(this.panel, 'Marcar uma região', 'map-pin-plus', () => { this.mode = 'pin'; this.render(); });
      if (!n.pins.length) this.panel.createEl('p', { text: 'Ative Alfinete e clique no ponto da imagem que deseja estudar.', cls: 'ia-muted' });
      n.pins.forEach((pin, i) => { if (!pin.imageMap) this.button(this.panel, `${i + 1}. ${pin.label}`, 'map-pin', () => { this.selected = { node: n.id, pin: pin.id }; this.showPin(n, pin); }); });
    }
    this.button(this.panel, 'Remover cartão do quadro', 'trash-2', () => this.removeNode(n));
  }
  prepareMind() {
    this.noteMapOwners = new Map();
    for (const card of this.board.nodes) if (card.type === 'note') for (const id of card.noteMaps || []) this.noteMapOwners.set(id, card);
    this.mindChildren = new Map(); this.visibleMind = new Set();
    const roots = [];
    for (const n of this.board.nodes) if (n.type === 'mind') {
      if (!n.parentId) roots.push(n);
      else { if (!this.mindChildren.has(n.parentId)) this.mindChildren.set(n.parentId, []); this.mindChildren.get(n.parentId).push(n); }
    }
    const pinnedMaps = new Set(this.board.nodes.flatMap(n => [...(n.pins || []).map(p => p.mapRoot), ...(n.noteMaps || [])].filter(Boolean)));
    for (const root of roots) if (!pinnedMaps.has(root.id)) root.pinHidden = false;
    const stack = roots.filter(n => !n.pinHidden);
    while (stack.length) { const n = stack.pop(); if (this.visibleMind.has(n.id)) continue; this.visibleMind.add(n.id); if (!n.collapsed) stack.push(...(this.mindChildren.get(n.id) || [])); }
    this.hiddenVisualNodes = new Set();
    const byId = new Map(this.board.nodes.map(n => [n.id, n]));
    const sceneIndex = atlasSceneIndex(this.board);
    const nested = this.board.nodes.filter(n => n.nestedOnly && n.visualParents?.length).map(root => ({ root, members: reusableNodes(this.board, root, sceneIndex).map(n => n.id) }));
    for (let pass = 0; pass <= nested.length; pass++) {
      let added = false;
      for (const { root, members } of nested) {
        const visible = root.visualParents.some(id => { const parent = byId.get(id); return parent?.visualExpanded && parent.linkedVisualRoot === root.id && !this.hiddenVisualNodes.has(id) && (parent.type !== 'mind' || this.visibleMind.has(id)); });
        if (!visible) for (const id of members) if (!this.hiddenVisualNodes.has(id)) { this.hiddenVisualNodes.add(id); added = true; }
      }
      if (!added) break;
    }
    for (const id of this.hiddenVisualNodes) this.visibleMind.delete(id);
    this.directVisualNodes = new Set();
    for (const node of this.board.nodes) if (node.type === 'mind' && node.parentId && node.linkedVisualRoot && node.visualExpanded) {
      const target = byId.get(node.linkedVisualRoot); if (!target || !this.visibleMind.has(node.id) || this.hiddenVisualNodes.has(target.id)) continue;
      node.visualAsChild = true; this.directVisualNodes.add(node.id);
      if (!target.visualChildOf || target.visualChildOf === node.id || !byId.has(target.visualChildOf)) target.visualChildOf = node.id;
    }
  }
  mindBranch(node) {
    this.prepareMind(); const result = [], stack = [node], seen = new Set();
    while (stack.length) { const n = stack.pop(); if (seen.has(n.id)) continue; seen.add(n.id); result.push(n); stack.push(...(this.mindChildren.get(n.id) || [])); }
    return result;
  }
  makeMindMap(title, body, position) {
    const id = uid(); const root = { id, type: 'mind', mapId: id, parentId: '', path: '', title, body, color: COLORS[0], collapsed: false, x: position.x, y: position.y, w: 260, h: 150 };
    this.board.nodes.push(root); return root;
  }
  addMindMap() {
    new MapStartModal(this, '', (title, body, path) => {
      const r = this.viewport.getBoundingClientRect(), pos = this.toWorld(r.left + 100, r.top + 100);
      this.checkpoint(); const root = this.makeMindMap(title, body, pos); root.path = path; this.selected = { node: root.id }; this.mode = 'select'; this.changed(true); this.render(); this.focusNode(root); if (path) this.persistMindRoot(root).catch(error => new Notice(error.message));
    }).open();
  }
  sizeRelationLabels(mapId) {
    const resized = new Set(), doc = this.contentEl?.ownerDocument;
    if (!this.relationMeasure && doc) this.relationMeasure = doc.createElement('canvas').getContext('2d');
    const font = doc?.defaultView?.getComputedStyle(this.contentEl).fontFamily || 'sans-serif';
    if (this.relationMeasure) this.relationMeasure.font = `750 13px ${font}`;
    this.relationWidths ||= new Map();
    for (const node of this.board.nodes) if (node.relation && (!mapId || node.mapId === mapId)) {
      const key = `${font}:${node.title}`;
      let textWidth = this.relationWidths.get(key);
      if (textWidth === undefined) {
        textWidth = this.relationMeasure ? this.relationMeasure.measureText(node.title).width : node.title.length * 8;
        this.relationWidths.set(key, textWidth);
        if (this.relationWidths.size > 200) this.relationWidths.delete(this.relationWidths.keys().next().value);
      }
      const width = Math.max(260, Math.ceil(textWidth) + 172);
      if (node.w !== width) { node.w = width; resized.add(node.mapId); }
    }
    return resized;
  }
  layoutMind(mapId) {
    this.sizeRelationLabels(mapId);
    this.prepareMind(); const root = this.board.nodes.find(n => n.id === mapId && n.type === 'mind'); if (!root) return;
    const owner = this.noteMapOwners.get(mapId);
    if (owner) { root.x = owner.x; root.y = owner.y; root.w = owner.w; root.h = owner.h; }
    for (const node of this.board.nodes) if (node.mapId === mapId && node.visualAsChild && node.visualExpanded) { const target = this.board.nodes.find(n => n.id === node.linkedVisualRoot); if (target) { node.w = target.w; node.h = target.h; } }
    const order = [], stack = [root], seen = new Set();
    while (stack.length) { const n = stack.pop(); if (seen.has(n.id)) continue; seen.add(n.id); order.push(n); if (!n.collapsed) stack.push(...(this.mindChildren.get(n.id) || [])); }
    const spans = new Map(), gap = 28, column = Math.max(...order.map(n => n.w)) + 90;
    for (let i = order.length - 1; i >= 0; i--) {
      const n = order[i], children = n.collapsed ? [] : this.mindChildren.get(n.id) || [];
      const total = children.reduce((sum, child) => sum + (spans.get(child.id) || child.h + 42), 0) + Math.max(0, children.length - 1) * gap;
      spans.set(n.id, Math.max(n.h + 42, total));
    }
    const positions = [{ node: root, depth: 0, top: root.y + (root.h + 42) / 2 - spans.get(root.id) / 2 }];
    while (positions.length) {
      const { node: n, depth, top } = positions.pop();
      if (depth) { n.x = root.x + depth * column; n.y = top + (spans.get(n.id) - n.h - 42) / 2; }
      const children = n.collapsed ? [] : this.mindChildren.get(n.id) || [];
      const total = children.reduce((sum, child) => sum + spans.get(child.id), 0) + Math.max(0, children.length - 1) * gap;
      let y = top + (spans.get(n.id) - total) / 2;
      for (const child of children) { positions.push({ node: child, depth: depth + 1, top: y }); y += spans.get(child.id) + gap; }
    }
    const image = this.board.nodes.find(n => n.type === 'image' && n.pins.some(p => p.mapRoot === root.id));
    if (image && !root.pinHidden) this.placePinMap(image, root);
    this.alignVisualChildren();
  }
  addMindNoteChild(node) {
    const board = this.board;
    new FilePicker(this.app, this.app.vault.getMarkdownFiles(), file => { if (this.board === board && board.nodes.includes(node)) this.addMindNode(node, false, false, file); }, 'Escolher nota existente para criar um filho…').open();
  }
  async ensureNoteChildParent(node) {
    if (node.type === 'mind' && (!node.path || !node.parentId)) return node;
    const path = node.type === 'image' ? node.visualNote : node.path;
    if (!path || !this.app.vault.getFileByPath(path)) return node;
    const card = node.type === 'note' || node.type === 'image' ? node : this.board.nodes.find(n => n.id === node.linkedVisualRoot);
    const root = card?.type === 'image' ? this.board.nodes.find(n => card.pins.some(p => p.imageMap && p.mapRoot === n.id) && n.type === 'mind') : this.board.nodes.find(n => card?.noteMaps?.includes(n.id) && n.type === 'mind');
    if (root && (node === card || node.visualExpanded)) {
      if (adoptMindChildren(this.board, node, root)) {
        const bundle = reusableBundle(this.board, card);
        await this.plugin.saveVisualSource(card.visualSource || path, path, bundle, this);
        this.visualHashes ||= new Map(); this.visualHashes.set(card.visualSource || path, JSON.stringify(bundle));
      }
      root.pinHidden = false; root.collapsed = false; return root;
    }
    this.noteParentJobs ||= new Map();
    if (this.noteParentJobs.has(node.id)) return this.noteParentJobs.get(node.id);
    const job = (async () => {
      const result = node.type === 'image' ? await this.toggleImageMindMap(node, { ensure: true }) : await this.toggleNoteMindMap(node, { ensure: true });
      if (!result?.root) throw new Error('Não foi possível preparar o mapa da nota. Nenhum ramo foi apagado.');
      return result.root;
    })();
    this.noteParentJobs.set(node.id, job);
    try { return await job; } finally { this.noteParentJobs.delete(node.id); }
  }
  async addMindNode(node, sibling = false, relation = false, noteFile = null) {
    try {
    this.inlineRename?.finish();
    if (!this.board.nodes.includes(node)) return;
    const board = this.board;
    let parent = sibling ? this.board.nodes.find(n => n.id === node.parentId) : node;
    if (sibling && node.relation) relation = true;
    if (!parent) { new Notice('O nó central não possui irmãos. Use + Filho.'); return; }
    if (parent.path || parent.visualNote) parent = await this.ensureNoteChildParent(parent);
    if (this.board !== board || !board.nodes.includes(node) || !board.nodes.includes(parent)) return;
    if (parent.type !== 'mind') throw new Error('A nota vinculada não foi encontrada. Vincule uma nota existente antes de adicionar filhos a esse cartão.');
    this.checkpoint(); parent.collapsed = false;
    const color = parent.parentId ? parent.color : COLORS[(this.board.nodes.filter(n => n.parentId === parent.id).length + 1) % COLORS.length];
    const child = { id: uid(), type: 'mind', mapId: parent.mapId, parentId: parent.id, path: '', title: relation ? 'Nova relação' : 'Novo tópico', body: '', color, collapsed: false, x: parent.x + 350, y: parent.y, w: relation ? 180 : 240, h: relation ? 4 : 130 };
    if (noteFile) { child.path = noteFile.path; child.title = noteFile.basename; }
    if (relation) child.relation = true;
    if (sibling) this.board.nodes.splice(this.board.nodes.indexOf(node) + 1, 0, child); else this.board.nodes.push(child);
    this.board.edges.push({ id: uid(), from: { node: parent.id }, to: { node: child.id }, color, mindTree: true });
    this.layoutMind(parent.mapId); this.selected = { node: child.id }; this.changed(true); this.render(); this.focusNode(child);
    if (noteFile) this.plugin.visualSource(noteFile).then(source => { if (source && this.board.nodes.includes(child)) { child.visualAsChild = true; this.toggleLinkedVisual(child); } }).catch(error => new Notice(error.message));
    else this.renameMindInline(child, true);
    return child;
    } catch (error) { new Notice(`Não foi possível adicionar o filho: ${error.message}`); }
  }
  renameMindInline(node, fresh = false) {
    this.inlineRename?.finish();
    const head = this.nodeElements.get(node.id)?.querySelector('.ia-card-head'), label = head?.querySelector('.ia-card-title');
    if (!head || !label) return;
    const board = this.board, original = node.title; label.style.display = 'none';
    const input = head.createEl('input', { cls: 'ia-mind-rename', type: 'text', value: original, attr: { 'aria-label': 'Título do nó' } });
    let done = false;
    const finish = (cancel = false, silent = false) => {
      if (done) return; done = true;
      const current = this.board === board ? board.nodes.find(n => n.id === node.id && n.type === 'mind') : null;
      if (!cancel && current) {
        const title = input.value.trim() || original;
        if (title !== current.title) { if (!fresh) this.checkpoint(); current.title = title; this.changed(); }
      }
      label.textContent = current?.title || node.title; label.style.display = ''; input.remove(); this.inlineRename = null;
      if (!silent && this.panel?.isConnected && this.selected?.node === node.id) this.showSelection();
    };
    this.inlineRename = {
      input,
      snapshot: () => ({ board, id: node.id, fresh, value: input.value, start: input.selectionStart, end: input.selectionEnd, direction: input.selectionDirection || 'none' }),
      suspend: () => finish(true, true),
      finish: () => finish(), cancel: () => finish(true)
    };
    input.onpointerdown = event => event.stopPropagation();
    input.onclick = event => event.stopPropagation();
    input.onkeydown = event => {
      event.stopPropagation();
      if (event.isComposing) return;
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Enter') {
        event.preventDefault(); finish(); const current = this.board === board && board.nodes.find(n => n.id === node.id);
        if (current) this.convertMindNote(current, { open: false }); return;
      }
      if (event.key === 'Tab') { event.preventDefault(); finish(); if (event.shiftKey) this.addMindNoteChild(node); else this.addMindNode(node); }
      else if (event.key === 'Enter') { event.preventDefault(); finish(); if (node.parentId) this.addMindNode(node, true); else this.viewport.focus(); }
      else if (event.key === 'Escape') { event.preventDefault(); finish(true); this.viewport.focus(); }
    };
    input.onblur = () => finish(); input.focus(); input.select();
  }
  editMind(node) {
    new MindTextModal(this, node.title, node.body, (title, body) => { if (!this.board.nodes.includes(node)) return; this.checkpoint(); node.title = title; if (!node.path) node.body = body; this.changed(); this.render(); }, Boolean(node.path)).open();
  }
  collapseMind(node) { this.checkpoint(); node.collapsed = !node.collapsed; this.layoutMind(node.mapId); this.selected = { node: node.id }; this.changed(false, false); this.render(); this.focusNode(node); }
  async createAtlasNote(title, body) {
    await this.plugin.folder(this.app.preferences.notesFolder || 'Notas');
    const path = this.plugin.unique(`${this.app.preferences.notesFolder || 'Notas'}/${namePart(title)}.md`), index = this.app.vault.getFileByPath(this.board.indexPath);
    const link = index ? `\n\n---\nQuadro: ${this.app.fileManager.generateMarkdownLink(index, path)}\n` : '\n';
    return this.app.vault.create(path, `# ${title}\n\n${body}${link}`);
  }
  async convertMindNote(node, options = {}) {
    if (!this.board.nodes.includes(node)) return;
    if (node.path) { if (options.open !== false) this.openNote(node.path); else if (!options.quiet) { this.viewport?.focus(); new Notice('Este nó já está vinculado a uma nota.'); } return { existing: true, node }; }
    if (!this.pendingMindNotes) this.pendingMindNotes = new Set();
    if (this.pendingMindNotes.has(node.id)) return;
    this.pendingMindNotes.add(node.id); const board = this.board;
    try {
      const file = await this.createAtlasNote(node.title, node.body);
      if (this.board !== board || !this.board.nodes.includes(node)) { if (!options.quiet) new Notice(`Nota salva: ${file.basename}. O quadro mudou antes de vinculá-la.`); return { file, unlinked: true }; }
      if (options.deferVisual) { options.beforeLink?.(); node.path = file.path; this.changed(false, false); return { file, node }; }
      this.checkpoint(); node.path = file.path; this.changed(true); this.render();
      if (!node.parentId) await this.persistMindRoot(node);
      else if (board.nodes.some(n => n.parentId === node.id)) await this.ensureNoteChildParent(node);
      if (options.open !== false) this.openNote(file.path); else if (!options.quiet) { this.viewport?.focus(); new Notice(`Nota criada e vinculada: ${file.basename}`); }
      return { file, node };
    } catch (error) { if (!options.quiet) new Notice(`Não foi possível criar a nota: ${error.message}`); return { error }; }
    finally { this.pendingMindNotes.delete(node.id); }
  }
  async convertSelectedMindNotes() {
    if (this.creatingSelectedNotes) return;
    this.inlineRename?.finish();
    const board = this.board, originalSelection = this.selected && { ...this.selected }, selected = [...(this.multiSelection?.size ? this.multiSelection : this.selected?.node ? [this.selected.node] : [])];
    const nodes = new Map();
    for (const id of selected) {
      const card = board.nodes.find(n => n.id === id);
      const node = card?.type === 'mind' ? card : board.nodes.find(n => n.id === card?.visualChildOf && n.type === 'mind');
      if (node) nodes.set(node.id, node);
    }
    const pending = [...nodes.values()].filter(n => !n.path);
    if (!pending.length) { new Notice(nodes.size ? 'Os nós selecionados já estão vinculados a notas.' : 'Selecione os nós do mapa mental para criar suas notas.'); return; }
    this.creatingSelectedNotes = true;
    const progress = new Notice(`Criando ${pending.length} notas…`, 0), linked = [], errors = [], unlinked = []; let checkpointed = false;
    try {
      // Assign every selected path first. A parent becoming a visual note must
      // not cause a selected descendant to be recreated or lose its own link.
      for (const original of pending) {
        if (this.board !== board) break;
        const node = board.nodes.find(n => n.id === original.id); if (!node) continue;
        const result = await this.convertMindNote(node, { open: false, quiet: true, deferVisual: true, beforeLink: () => { if (!checkpointed) { this.checkpoint(); checkpointed = true; } } });
        if (result?.error) errors.push(`${node.title}: ${result.error.message}`);
        else if (result?.unlinked) unlinked.push(result.file.path);
        else if (result?.file) linked.push(node.id);
        progress.setMessage?.(`${linked.length} de ${pending.length} notas criadas…`);
      }
      if (this.board === board && linked.length) {
        this.changed(true);
        // Descendants first preserve their own scenes when a selected parent
        // adopts its children into the note's map.
        const byId = new Map(board.nodes.map(n => [n.id, n]));
        const depth = id => { let node = byId.get(id), count = 0; const seen = new Set(); while (node?.parentId && !seen.has(node.id)) { seen.add(node.id); count++; node = byId.get(node.parentId); } return count; };
        for (const id of [...linked].sort((a, b) => depth(b) - depth(a))) {
          if (this.board !== board) break;
          const node = board.nodes.find(n => n.id === id); if (!node) continue;
          try {
            if (!node.parentId) await this.persistMindRoot(node);
            else if (board.nodes.some(n => n.parentId === node.id)) await this.ensureNoteChildParent(node);
          } catch (error) { errors.push(`${node.title} (mapa): ${error.message}`); }
        }
        if (this.board === board) {
          this.multiSelection = new Set(selected.filter(id => board.nodes.some(n => n.id === id)));
          if (originalSelection && board.nodes.some(n => n.id === originalSelection.node)) this.selected = originalSelection;
          this.changed(true); this.render(); this.highlight(); this.viewport?.focus({ preventScroll: true });
        }
      }
      const skipped = nodes.size - pending.length;
      new Notice(`${linked.length} notas criadas${skipped ? ` · ${skipped} já vinculadas` : ''}${unlinked.length ? ` · ${unlinked.length} salvas no cofre sem vínculo porque o quadro mudou` : ''}${errors.length ? ` · ${errors.length} pendências: ${errors.join('; ')}` : ''}.`, errors.length ? 12000 : 5000);
      return { created: linked.length, existing: skipped, unlinked, errors };
    } catch (error) { new Notice(`Não foi possível concluir a criação das notas: ${error.message}`); }
    finally { this.creatingSelectedNotes = false; progress.hide?.(); }
  }
  linkMindNote(node) {
    new FilePicker(this.app, this.app.vault.getMarkdownFiles(), async file => {
      try {
        if (!this.board.nodes.includes(node)) return;
        if (!node.parentId && await this.plugin.visualSource(file)) { await this.addVisualNote(file); return; }
        if (!this.board.nodes.includes(node)) return;
        this.checkpoint(); node.path = file.path; this.changed(true); this.render(); if (!node.parentId) await this.persistMindRoot(node);
      } catch (error) { new Notice(`Não foi possível vincular a nota: ${error.message}`); }
    }, 'Vincular este nó a uma nota…').open();
  }
  showMindMenu(node, event, anchor) {
    if (!this.board.nodes.includes(node)) return;
    this.selectedGroup = null; this.selected = { node: node.id }; this.highlight();
    const menu = new Menu();
    const action = (title, icon, run) => menu.addItem(item => item.setTitle(title).setIcon(icon).onClick(() => { if (this.board.nodes.includes(node)) run(); }));
    action('Adicionar filho · Tab', 'plus', () => this.addMindNode(node));
    action('Filho de nota existente · Shift+Tab', 'file-input', () => this.addMindNoteChild(node));
    if (node.parentId) action('Mover ramo para outro pai', 'git-pull-request-arrow', () => this.beginMindReparent(node));
    menu.addSeparator();
    if (!node.relation) {
      action(node.path ? 'Abrir nota' : 'Criar nota · Ctrl+Shift+Enter', 'file-text', () => node.path ? this.openNote(node.path) : this.convertMindNote(node, { open: false }));
      if (node.path && node.parentId) action('Criar mapa mental desta nota', 'git-fork', () => this.toggleNoteMindMap(node));
      if (!node.relation) { action('Colar imagem nesta nota ou nó', 'clipboard-paste', () => new MapImageModal(this, node, true).open()); if (node.path) action('Colar link nesta nota', 'link', () => this.app.noteMedia.pickForNode(this, node)); }
      if (node.path && node.parentId) action(node.visualExpanded ? 'Recolher nota visual' : 'Expandir nota visual', 'image-plus', () => this.toggleLinkedVisual(node));
    }
    action(noteFlashcardPath(node) && !node.relation ? 'Criar / editar flashcards desta nota' : 'Criar flashcard', 'layers', () => this.createFlashcard(node));
    if (noteFlashcardPath(node) && !node.relation) action('Responder flashcards desta nota', 'play', () => this.reviewNoteFlashcards(node));
    action('Renomear · F2', 'square-pen', () => this.renameMindInline(node));
    if (this.board.nodes.some(n => n.parentId === node.id)) action(node.collapsed ? 'Expandir filhos' : 'Recolher filhos', node.collapsed ? 'chevron-right' : 'chevron-down', () => this.collapseMind(node));
    action('Organizar este mapa', 'network', () => { this.checkpoint(); this.layoutMind(node.mapId); this.changed(); this.render(); });
    menu.addSeparator();
    action('Remover do quadro', 'trash-2', () => this.removeNode(node));
    if (anchor) { const r = anchor.getBoundingClientRect(); menu.showAtPosition({ x: r.left, y: r.bottom + 4 }); }
    else menu.showAtMouseEvent(event);
  }
  beginMindReparent(node) {
    if (!node?.parentId || !this.board.nodes.includes(node)) return;
    this.pendingMindMove = node.id; this.mode = 'select'; this.source = null;
    this.selectedGroup = null; this.selected = { node: node.id }; this.multiSelection?.clear(); this.viewport.focus(); this.highlight();
    if (this.hint) this.hint.textContent = `Mover “${node.title}”: clique na relação ou no nó que será o novo pai. Esc cancela.`;
    new Notice(`Clique no novo pai de “${node.title}”, por exemplo, Relação. Esc cancela.`);
  }
  reparentMindNode(node, parent, focus = true) {
    try {
      reparentMindBranch(this.board, node, parent, true);
      if (node.parentId === parent.id) return true;
      this.inlineRename?.finish(); this.checkpoint(); reparentMindBranch(this.board, node, parent);
      this.pendingMindMove = null; this.layoutMind(node.mapId);
      this.selectedGroup = null; this.selected = { node: node.visualExpanded && node.linkedVisualRoot ? node.linkedVisualRoot : node.id };
      this.changed(true); this.render();
      if (focus) this.focusNode(this.board.nodes.find(n => n.id === this.selected.node) || node);
      return true;
    } catch (error) { new Notice(error.message); return false; }
  }
  showMind(node) {
    if (node.relation) { this.showRelation(node); return; }
    this.clearPanel(); this.panel.createDiv({ cls: 'ia-eyebrow', text: node.parentId ? 'NÓ DO MAPA MENTAL' : 'MAPA MENTAL' });
    this.panel.createEl('h2', { text: node.title });
    if (node.path && node.parentId) this.button(this.panel, 'Criar mapa mental desta nota', 'git-fork', () => this.toggleNoteMindMap(node));
    if (node.parentId) this.button(this.panel, 'Mover ramo para outro pai', 'git-pull-request-arrow', () => this.beginMindReparent(node));
    if (!node.relation) { this.button(this.panel, 'Colar imagem nesta nota ou nó', 'clipboard-paste', () => new MapImageModal(this, node, true).open()); if (node.path) this.button(this.panel, 'Colar link nesta nota', 'link', () => this.app.noteMedia.pickForNode(this, node)); }
    if (node.path && node.parentId) this.button(this.panel, node.visualExpanded ? 'Recolher imagem e mapa da nota' : 'Expandir imagem e mapa da nota', 'image-plus', () => this.toggleLinkedVisual(node));
    if (!node.parentId) this.button(this.panel, 'Transformar mapa inteiro em alfinete', 'map-pin-plus', () => new MapImageModal(this, node).open());
    this.button(this.panel, '+ Filho', 'plus', () => this.addMindNode(node));
    this.button(this.panel, '+ Filho de nota existente · Shift+Tab', 'file-input', () => this.addMindNoteChild(node));
    this.button(this.panel, '+ Relação com vários filhos', 'git-branch', () => this.addMindNode(node, false, true));
    if (node.parentId) this.button(this.panel, '+ Irmão', 'git-fork', () => this.addMindNode(node, true));
    this.button(this.panel, node.path ? 'Renomear nó no mapa' : 'Editar título e texto do nó', 'square-pen', () => this.editMind(node));
    this.flashcardActions(node, this.panel);
    this.button(this.panel, 'Responder flashcards deste mapa', 'play', () => this.reviewFlashcards(node.mapId));
    if (node.path) { this.button(this.panel, 'Editar nota', 'file-text', () => this.openNote(node.path)); this.notePreview(node.path, this.panel.createDiv({ cls: 'ia-summary' })); }
    else { this.panel.createEl('p', { text: node.body || 'Este nó ainda não é uma nota da biblioteca.', cls: 'ia-mind-panel-text' }); this.button(this.panel, 'Criar nota Markdown deste nó', 'file-plus', () => this.convertMindNote(node)); }
    this.button(this.panel, node.path ? 'Trocar nota vinculada' : 'Vincular nota existente', 'link', () => this.linkMindNote(node));
    if (node.path) this.button(this.panel, 'Desvincular nota deste nó', 'unlink', () => { this.checkpoint(); node.path = ''; this.changed(true); this.render(); });
    if (this.mindChildren.get(node.id)?.length) this.button(this.panel, node.collapsed ? 'Expandir filhos' : 'Recolher filhos', node.collapsed ? 'chevron-right' : 'chevron-down', () => this.collapseMind(node));
    this.button(this.panel, 'Organizar este mapa', 'network', () => { this.checkpoint(); this.layoutMind(node.mapId); this.changed(); this.render(); this.focusNode(node); });
    this.button(this.panel, 'Conectar este nó', 'waypoints', () => { this.mode = 'connect'; this.source = { node: node.id }; this.render(); });
    this.button(this.panel, node.parentId ? 'Remover este ramo do quadro' : 'Remover mapa do quadro', 'trash-2', () => this.removeNode(node));
    this.panel.createEl('p', { text: 'Tab: filho vazio · Shift+Tab: filho de nota existente · Enter: novo irmão · F2: renomear. Flashcards são respondidos na ordem de criação. As notas continuam no cofre ao remover nós.', cls: 'ia-muted' });
  }
  flashcardActions(node, container) {
    this.button(container, noteFlashcardPath(node) && !node.relation ? 'Criar / editar flashcards desta nota' : 'Criar flashcard', 'layers', () => this.createFlashcard(node));
    if (noteFlashcardPath(node) && !node.relation) this.button(container, 'Responder flashcards desta nota', 'play', () => this.reviewNoteFlashcards(node));
    for (const card of node.flashcards || []) this.button(container, `Editar flashcard: ${card.question.slice(0, 65)}`, 'square-pen', () => new FlashcardModal(this, node, '', card).open());
  }
  editNoteFlashcards(node) {
    const file = this.app.vault.getFileByPath(noteFlashcardPath(node));
    if (file) new NoteFlashcardEditor(this, file).open();
  }
  reviewNoteFlashcards(node) {
    const file = this.app.vault.getFileByPath(noteFlashcardPath(node));
    if (file) this.plugin.openNoteFlashcardReview(file, this).catch(error => new Notice(error.message));
  }
  async createFlashcard(node) {
    if (!node.relation && noteFlashcardPath(node)) { this.inlineRename?.finish(); this.editNoteFlashcards(node); return; }
    if (node.type === 'mind') {
      const owner = this.board.nodes.find(n => n.type === 'note' && (n.noteMaps?.includes(node.id) || n.id === node.linkedVisualRoot));
      if (owner) node = owner;
    }
    this.inlineRename?.finish();
    if (!this.board.nodes.includes(node)) return;
    const board = this.board, selection = this.contentEl.ownerDocument.defaultView.getSelection();
    const inNode = selection?.anchorNode && (this.nodeElements.get(node.id)?.contains(selection.anchorNode) || (this.selected?.node === node.id && this.panel.contains(selection.anchorNode)));
    let answer = inNode ? selection.toString().trim() : '';
    try {
      if (node.relation) answer = this.relationAnswer(node);
      else if (!answer) { const file = node.path && this.app.vault.getFileByPath(node.path); answer = file ? await this.readNote(file) : node.body || ''; }
      if (this.board !== board || !this.board.nodes.includes(node)) return;
      new FlashcardModal(this, node, answer).open();
    } catch (error) { new Notice(`Não foi possível preparar o flashcard: ${error.message}`); }
  }
  reviewBoardFlashcards() {
    this.inlineRename?.finish(); this.prepareMind();
    if (!this.file || this.invalidData) return;
    new WhiteboardStudyPicker(this.plugin, this.file.path, this).open();
  }
  reviewFlashcards(mapId) {
    this.inlineRename?.finish();
    this.prepareMind();
    const selected = this.board.nodes.find(n => n.id === this.selected?.node);
    if (mapId === undefined && selected && noteFlashcardPath(selected)) { this.reviewNoteFlashcards(selected); return; }
    const roots = this.board.nodes.filter(n => n.type === 'mind' && !n.parentId);
    const context = mapId || (selected?.type === 'mind' ? selected.mapId : selected?.pins?.find(p => p.id === this.selected?.pin)?.mapRoot) || (roots.length === 1 && !selected ? roots[0].id : '');
    const nodes = this.board.nodes.filter(n => !context || (n.type === 'mind' && n.mapId === context));
    const cards = nodes.flatMap(n => (n.flashcards || []).map(card => ({ ...card, answer: card.answerSource === 'children' ? this.relationAnswer(n) || 'Esta relação não possui mais filhos.' : card.answer, nodeTitle: n.title || n.path.split('/').pop(), sourcePath: n.path || this.file?.path || '' }))).sort((a, b) => a.order - b.order);
    if (!cards.length && !nodes.some(n => noteFlashcardPath(n))) { new Notice(context ? 'Este mapa ainda não tem flashcards. Selecione um nó e clique em Criar flashcard.' : 'Crie um flashcard em um nó ou cartão de nota primeiro.'); return; }
    const title = context ? `Flashcards · ${this.board.nodes.find(n => n.id === context)?.title || 'Mapa mental'}` : 'Flashcards do quadro';
    this.plugin.openReviewPopup({ boardPath: this.file.path, mapId: context, title }, this).catch(error => new Notice(error.message));
  }
  activatePin(image, pin) {
    const root = this.board.nodes.find(n => n.id === pin.mapRoot && n.type === 'mind');
    if (root) {
      this.checkpoint(); root.pinHidden = !root.pinHidden; this.selected = { node: image.id, pin: pin.id };
      if (!root.pinHidden) this.placePinMap(image, root);
      this.changed(); this.render(); if (!root.pinHidden) { this.framePinMap(image, root); this.restoreDirectVisualChildren(); } return;
    }
    if (pin.notePath && this.app.vault.getFileByPath(pin.notePath)) {
      this.selected = { node: image.id, pin: pin.id }; this.toggleSummaryCard(image, pin); return;
    }
    this.selected = { node: image.id, pin: pin.id }; this.highlight(); this.showPin(image, pin); new PinActionModal(this, image, pin).open();
  }
  beginMapPin(root, image) {
    if (!this.board.nodes.includes(root) || !this.board.nodes.includes(image)) return;
    this.pendingMapPin = { board: this.board, root, image }; this.mode = 'pin'; this.source = null;
    this.selected = { node: image.id }; this.render(); this.focusNode(image);
  }
  attachMapPin(image, u, v, area) {
    const pending = this.pendingMapPin;
    if (!pending || pending.board !== this.board || !this.board.nodes.includes(pending.root)) return;
    if (pending.image !== image) { new Notice('Clique na imagem escolhida para este mapa.'); return; }
    const root = pending.root; this.checkpoint();
    const pin = { id: uid(), label: root.title, u, v, color: root.color || COLORS[0], notePath: '', mapRoot: root.id };
    if (area) pin.area = area;
    image.pins.push(pin); root.pinHidden = true;
    this.board.edges.push({ id: uid(), from: { node: image.id, pin: pin.id }, to: { node: root.id }, color: pin.color });
    this.pendingMapPin = null; this.mode = 'select'; this.selected = { node: image.id, pin: pin.id }; this.changed(true); this.render();
    if (root.path && !image.visualSource && !image.visualDetached) this.saveVisualNote(image, this.app.vault.getFileByPath(root.path));
    new Notice('Mapa vinculado. Clique no alfinete para mostrar ou ocultar.');
  }
  placePinMap(image, root) {
    if (image.type !== 'image') return false;
    const branch = this.mindBranch(root), ids = new Set(this.groupNodes([root.id]).map(n => n.id));
    const visible = branch.filter(n => this.visibleMind.has(n.id)); if (!visible.length) return false;
    const obstacles = this.board.nodes.filter(n => !ids.has(n.id) && !this.directVisualNodes.has(n.id) && !this.hiddenVisualNodes.has(n.id) && (n.type !== 'mind' || this.visibleMind.has(n.id)));
    const gap = 28, overlaps = (a, b, dx = 0, dy = 0) => a.x + dx < b.x + b.w + gap && a.x + dx + a.w + gap > b.x && a.y + dy < b.y + b.h + 42 + gap && a.y + dy + a.h + 42 + gap > b.y;
    if (!visible.some(n => obstacles.some(other => overlaps(n, other)))) return false;
    const pin = image.pins.find(p => p.mapRoot === root.id);
    const dx = image.x + image.w + 100 - Math.min(...visible.map(n => n.x));
    let dy = image.y + 42 + (pin?.v ?? .5) * image.h - (root.h + 42) / 2 - root.y;
    // Each interval is a vertical offset that would collide at the chosen column.
    const blocked = [];
    for (const node of visible) for (const other of obstacles) if (node.x + dx < other.x + other.w + gap && node.x + dx + node.w + gap > other.x) blocked.push({ low: other.y - node.y - node.h - 42 - gap, high: other.y + other.h + 42 + gap - node.y });
    blocked.sort((a, b) => a.low - b.low);
    for (const interval of blocked) if (dy > interval.low && dy < interval.high) dy = interval.high;
    // Move the whole branch; hidden descendants keep their offsets for later expansion.
    for (const node of branch) { node.x += dx; node.y += dy; }
    return true;
  }
  framePinMap(image, root) {
    this.prepareMind(); const nodes = [image, ...this.mindBranch(root).filter(n => this.visibleMind.has(n.id))];
    const left = Math.min(...nodes.map(n => n.x)), top = Math.min(...nodes.map(n => n.y));
    const right = Math.max(...nodes.map(n => n.x + n.w)), bottom = Math.max(...nodes.map(n => n.y + n.h + 42));
    const r = this.viewport.getBoundingClientRect(), z = Math.max(.15, Math.min(1, (r.width - 100) / (right - left), (r.height - 100) / (bottom - top)));
    this.board.camera = { x: (r.width - (right - left) * z) / 2 - left * z, y: (r.height - (bottom - top) * z) / 2 - top * z, z };
    this.camera(); this.changed();
  }
  async toggleNoteMindMap(node, options = {}) {
    if (!this.board.nodes.includes(node) || !['mind', 'note'].includes(node.type)) return;
    this.pendingNoteMaps ||= new Set(); if (this.pendingNoteMaps.has(node.id)) return;
    this.pendingNoteMaps.add(node.id); const board = this.board;
    try {
      let note = this.app.vault.getFileByPath(node.path);
      if (!note && options.ensure) return;
      if (!note) note = await this.createAtlasNote(node.title, node.body || '');
      if (this.board !== board || !board.nodes.includes(node)) return;
      const source = await this.plugin.visualSource(note);
      let card = node.type === 'note' ? node : board.nodes.find(n => n.id === node.linkedVisualRoot && n.type === 'note');
      let existingMap = null;
      if (source) {
        const bundle = await this.plugin.loadVisualNote(note), saved = bundle.nodes.find(n => n.id === bundle.visualRoot);
        if (this.board !== board || !board.nodes.includes(node)) return;
        if (saved.type === 'image') {
          if (node.type === 'mind' && !node.visualExpanded) await this.toggleLinkedVisual(node);
          const image = node.type === 'image' ? node : board.nodes.find(n => n.id === node.linkedVisualRoot);
          if (image) return await this.toggleImageMindMap(image, { ...options, adoptFrom: node });
          return;
        }
        const own = node.type === 'note' ? node : board.nodes.find(n => n.id === node.linkedVisualRoot);
        const installed = own || this.applyVisualBundle(source, note.path, bundle, { x: node.x, y: node.y }, { createNew: true });
        if (saved.type === 'note') card = installed;
        else existingMap = installed;
      }
      this.checkpoint(); let created = false;
      if (!card || card.type !== 'note') {
        card = { id: uid(), type: 'note', title: node.title, path: note.path, x: node.x, y: node.y, w: Math.max(280, node.w), h: Math.max(180, node.h), noteMaps: existingMap ? [existingMap.id] : [] };
        board.nodes.push(card); created = true;
      }
      card.noteMaps ||= [];
      let root = board.nodes.find(n => card.noteMaps.includes(n.id) && n.type === 'mind');
      if (!root) {
        root = this.makeMindMap(node.title, '', { x: card.x + card.w + 100, y: card.y }); root.path = note.path;
        card.noteMaps.push(root.id); created = true;
      }
      const adopted = adoptMindChildren(board, node, root);
      if (created || !card.visualSource || existingMap || adopted) {
        root.pinHidden = false;
        if (!board.edges.some(e => e.from.node === card.id && e.to.node === root.id)) board.edges.push({ id: uid(), from: { node: card.id }, to: { node: root.id }, color: root.color, noteMap: true });
        if (existingMap) { delete existingMap.visualSource; delete existingMap.visualNote; }
        const bundle = reusableBundle(board, card);
        await this.plugin.saveVisualSource(note.path, note.path, bundle, this);
        if (this.board !== board) return;
        card.visualSource = note.path; card.visualNote = note.path;
        this.visualHashes ||= new Map(); this.visualHashes.set(note.path, JSON.stringify(reusableBundle(board, card))); this.visualContentHashes ||= new Map(); this.visualContentHashes.set(card.id, visualContentHash(reusableBundle(board, card)));
      } else root.pinHidden = options.ensure ? false : !root.pinHidden;
      if (node.type === 'mind' && node !== root) {
        node.path = note.path; node.visualAsChild = true; node.visualExpanded = true; delete node.visualCollapsed; node.linkedVisualRoot = card.id;
        card.nestedOnly = true; card.visualChildOf = node.id; card.visualParents ||= []; if (!card.visualParents.includes(node.id)) card.visualParents.push(node.id);
        if (!board.edges.some(e => e.visualLink && e.from.node === node.id && e.to.node === card.id)) board.edges.push({ id: uid(), from: { node: node.id }, to: { node: card.id }, color: node.color || COLORS[0], visualLink: true });
        node.w = card.w; node.h = card.h; this.layoutMind(node.mapId);
      }
      this.selected = { node: card.id }; this.changed(true); this.render();
      if (!root.pinHidden && !options.ensure) { this.frameLinkedVisual(card, card); this.restoreDirectVisualChildren(); }
      return { root, card };
    } catch (error) { new Notice(`Não foi possível criar ou alternar o mapa desta nota: ${error.message}`); }
    finally { this.pendingNoteMaps.delete(node.id); }
  }
  async toggleImageMindMap(image, options = {}) {
    if (!this.board.nodes.includes(image) || image.type !== 'image') return;
    this.pendingImageMaps ||= new Set(); if (this.pendingImageMaps.has(image.id)) return;
    this.pendingImageMaps.add(image.id); const board = this.board;
    try {
      if (!image.visualNote && options.ensure) return;
      if (!image.visualNote && !await this.saveVisualNote(image)) return;
      if (this.board !== board || !board.nodes.includes(image)) return;
      let pin = image.pins.find(p => p.imageMap);
      let root = pin && board.nodes.find(n => n.id === pin.mapRoot && n.type === 'mind');
      if (root) {
        if (!options.ensure) { this.activatePin(image, pin); return { root, card: image }; }
        root.pinHidden = false; root.collapsed = false;
        if (options.adoptFrom && adoptMindChildren(board, options.adoptFrom, root)) {
          const bundle = reusableBundle(board, image);
          await this.plugin.saveVisualSource(image.visualSource || image.visualNote, image.visualNote, bundle, this);
          this.visualHashes ||= new Map(); this.visualHashes.set(image.visualSource || image.visualNote, JSON.stringify(bundle)); this.visualContentHashes ||= new Map(); this.visualContentHashes.set(image.id, visualContentHash(reusableBundle(board, image)));
        }
        return { root, card: image };
      }
      this.checkpoint();
      root = this.makeMindMap(image.title || 'Mapa mental', '', { x: image.x + image.w + 130, y: image.y + 42 + image.h / 2 - 96 });
      root.path = image.visualNote; root.pinHidden = false;
      if (!pin) { pin = { id: uid(), label: image.title || 'Mapa mental', u: 1, v: .5, color: COLORS[0], notePath: '', imageMap: true }; image.pins.push(pin); }
      pin.mapRoot = root.id;
      board.edges.push({ id: uid(), from: { node: image.id, pin: pin.id }, to: { node: root.id }, color: pin.color });
      if (options.adoptFrom) adoptMindChildren(board, options.adoptFrom, root);
      if (options.ensure) {
        const bundle = reusableBundle(board, image);
        await this.plugin.saveVisualSource(image.visualSource || image.visualNote, image.visualNote, bundle, this);
        this.visualHashes ||= new Map(); this.visualHashes.set(image.visualSource || image.visualNote, JSON.stringify(bundle)); this.visualContentHashes ||= new Map(); this.visualContentHashes.set(image.id, visualContentHash(reusableBundle(board, image)));
      }
      this.placePinMap(image, root); this.selected = { node: root.id }; this.mode = 'select';
      this.changed(true); this.render(); if (!options.ensure) { this.framePinMap(image, root); this.viewport.focus(); }
      return { root, card: image };
    } catch (error) { new Notice(`Não foi possível criar o mapa mental desta nota: ${error.message}`); }
    finally { this.pendingImageMaps.delete(image.id); }
  }
  mindFromPin(image, pin) {
    let root = this.board.nodes.find(n => n.id === pin.mapRoot && n.type === 'mind');
    if (root) { this.checkpoint(); root.pinHidden = false; this.placePinMap(image, root); this.changed(); this.render(); this.selected = { node: root.id }; this.highlight(); this.showSelection(); this.framePinMap(image, root); this.restoreDirectVisualChildren(); return; }
    new MapStartModal(this, pin.label, (title, body, path) => {
      if (!this.board.nodes.includes(image) || !image.pins.includes(pin)) return;
      this.checkpoint(); root = this.makeMindMap(title, body, { x: image.x + image.w + 130, y: image.y + pin.v * image.h }); root.path = path; pin.mapRoot = root.id;
      this.board.edges.push({ id: uid(), from: { node: image.id, pin: pin.id }, to: { node: root.id }, color: pin.color });
      this.placePinMap(image, root);
      this.selected = { node: root.id }; this.mode = 'select'; this.changed(true); this.render(); this.focusNode(root);
      if (path) this.persistMindRoot(root).catch(error => new Notice(error.message));
    }).open();
  }
  noteFromPin(image, pin) {
    if (pin.notePath) { this.selected = { node: image.id, pin: pin.id }; this.toggleSummaryCard(image, pin); return; }
    new MindTextModal(this, pin.label, '', async (title, body) => {
      const board = this.board;
      try { const file = await this.createAtlasNote(title, body); if (this.board !== board || !this.board.nodes.includes(image) || !image.pins.includes(pin)) { new Notice(`Nota salva: ${file.basename}.`); return; } this.checkpoint(); pin.notePath = file.path; this.changed(true); this.toggleSummaryCard(image, pin); }
      catch (error) { new Notice(`Não foi possível criar a nota: ${error.message}`); }
    }).open();
  }
  async removeNode(node) {
    if (!this.board.nodes.includes(node)) return;
    if (node.type === 'mind' && !node.parentId) node = this.board.nodes.find(n => n.type === 'image' && n.pins.some(p => p.mapRoot === node.id)) || node;
    const board = this.board;
    let detached = null;
    if (node.type === 'image' || (node.type === 'mind' && !node.parentId) || node.visualSource) {
      const notePath = node.visualNote || (node.path?.endsWith('.md') ? node.path : node.visualSource?.endsWith('.md') ? node.visualSource : null);
      const missingNote = () => Boolean(notePath && !this.app.vault.getFileByPath(notePath));
      if (missingNote()) {
        // A missing source cannot be saved. Detach this occurrence locally; undo
        // retains its scene and no Markdown file is created, changed or deleted.
        detached = reusableBundle(board, node);
      } else {
        try {
          if (!node.visualSource) {
            if (node.type === 'image') {
              const root = board.nodes.find(n => n.type === 'mind' && node.pins.some(p => p.mapRoot === n.id));
              const path = node.visualDetached ? null : root?.path || node.pins.find(p => p.notePath)?.notePath;
              if (!await this.saveVisualNote(node, path ? this.app.vault.getFileByPath(path) : null)) return;
            } else if (node.type === 'mind' && !await this.persistMindRoot(node)) return;
          }
          if (board !== this.board || !board.nodes.includes(node)) return;
          detached = reusableBundle(board, node);
          await this.plugin.saveVisualSource(node.visualSource, node.visualNote, detached, this);
          if (board !== this.board || !board.nodes.includes(node)) return;
        } catch (error) {
          if (board !== this.board || !board.nodes.includes(node)) return;
          if (missingNote()) detached = reusableBundle(board, node);
          else { new Notice(`O cartão foi mantido porque não foi possível salvar na nota: ${error.message}`); return; }
        }
      }
    }
    this.endDrag(); this.checkpoint();
    if (this.plugin.activeReader?.node.id === node.id) this.plugin.activeReader.close();
    const session = this.webSessions?.get(node.id); session?.reader?.onClose(); this.webSessions?.delete(node.id);
    const removed = new Set(detached ? reusableNodes(board, node).map(n => n.id) : node.type === 'mind' ? this.mindBranch(node).map(n => n.id) : [node.id]);
    const affectedMaps = new Set();
    for (const proxy of this.board.nodes) if (!removed.has(proxy.id) && removed.has(proxy.linkedVisualRoot)) {
      delete proxy.linkedVisualRoot; proxy.visualExpanded = false; proxy.visualCollapsed = true;
      if (proxy.visualAsChild) { proxy.w = 240; proxy.h = 130; affectedMaps.add(proxy.mapId); }
    }
    this.board.nodes = this.board.nodes.filter(n => !removed.has(n.id)); this.board.edges = this.board.edges.filter(e => !removed.has(e.from.node) && !removed.has(e.to.node));
    for (const n of this.board.nodes) for (const pin of n.pins || []) if (removed.has(pin.mapRoot)) delete pin.mapRoot;
    if (node.type === 'mind' && node.parentId) this.layoutMind(node.mapId);
    for (const mapId of affectedMaps) this.layoutMind(mapId);
    if (removed.has(this.selected?.node)) this.selected = null;
    if (removed.has(this.source?.node)) this.source = null;
    this.changed(true); this.render();
  }
  /** A pin owns its summary independently of whether that summary has a visible board card. */
  pinnedSummary(image, pin) {
    for (const edge of this.board.edges) {
      if (edge.from.node !== image.id || edge.from.pin !== pin.id) continue;
      const card = this.board.nodes.find(n => n.id === edge.to.node && n.type === 'note' && n.path === pin.notePath);
      if (card) return card;
    }
    return null;
  }
  /** Pin/unpin only this occurrence; shared cards and all original Markdown files survive. */
  toggleSummaryCard(image, pin) {
    if (!this.board.nodes.includes(image) || !image.pins.includes(pin)) return;
    if (!pin.notePath) { this.noteFromPin(image, pin); return; }
    this.checkpoint();
    const pinned = this.pinnedSummary(image, pin);
    if (pinned) {
      this.board.edges = this.board.edges.filter(e => !(e.from.node === image.id && e.from.pin === pin.id && e.to.node === pinned.id));
      if (!this.board.edges.some(e => e.from.node === pinned.id || e.to.node === pinned.id)) this.board.nodes = this.board.nodes.filter(n => n !== pinned);
    } else {
      let card = this.board.nodes.find(n => n.type === 'note' && n.path === pin.notePath);
      if (!card) {
        let y = image.y + Math.max(0, pin.v * image.h - 80);
        const x = image.x + image.w + 130;
        while (this.board.nodes.some(n => x < n.x + n.w + 24 && x + 320 + 24 > n.x && y < n.y + n.h + 66 && y + 286 > n.y)) y += 290;
        card = { id: uid(), type: 'note', path: pin.notePath, x, y, w: 320, h: 220 };
        this.board.nodes.push(card);
      }
      this.board.edges.push({ id: uid(), from: { node: image.id, pin: pin.id }, to: { node: card.id }, color: pin.color });
    }
    this.changed(true); this.render();
  }
  showPin(image, pin) {
    this.clearPanel();
    this.panel.createDiv({ text: 'REGIÃO MARCADA', cls: 'ia-eyebrow' });
    this.panel.createEl('h2', { text: pin.label });
    this.panel.createEl('p', { text: image.title || image.path.split('/').pop(), cls: 'ia-muted' });
    if (image.type === 'image') {
      this.button(this.panel, pin.area ? 'Redesenhar área · arrastar' : 'Transformar alfinete em área', 'scan', () => { this.pendingMapPin = null; this.pendingAreaPin = { board: this.board, image, pin }; this.mode = 'area'; this.render(); this.focusNode(image); });
      if (this.pendingAreaPin?.pin === pin) this.panel.createEl('p', { text: 'Arraste na imagem para definir a área. Escape cancela.', cls: 'ia-muted' });
      if (pin.area) this.button(this.panel, 'Voltar para alfinete pontual', 'map-pin', () => { this.checkpoint(); delete pin.area; this.pendingAreaPin = null; this.mode = 'select'; this.changed(); this.render(); });
    }
    if (image.type === 'web') this.button(this.panel, 'Ver ponto na página', 'globe', () => {
      this.focusNode(image);
      const reader = this.webSessions?.get(image.id)?.reader;
      if (reader) { if (reader.ready) reader.goToPin(pin); else reader.startPin = pin; }
      else this.openWeb(image, pin);
    });
    const map = this.board.nodes.find(n => n.id === pin.mapRoot && n.type === 'mind');
    this.button(this.panel, map ? (map.pinHidden ? 'Mostrar mapa mental' : 'Ocultar mapa mental') : 'Criar mapa mental', 'git-fork', () => map ? this.activatePin(image, pin) : this.mindFromPin(image, pin));
    this.button(this.panel, pin.notePath ? (this.pinnedSummary(image, pin) ? 'Desafixar nota do quadro' : 'Fixar nota no quadro') : 'Criar nota Markdown', 'file-text', () => this.noteFromPin(image, pin));
    this.button(this.panel, 'Fechar resumo', 'x', () => { this.selected = null; this.highlight(); this.showSelection(); });
    const colors = this.panel.createDiv({ cls: 'ia-form-color' }); colors.createSpan({ text: 'Cor' });
    const color = colors.createEl('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(pin.color) ? pin.color : COLORS[0] });
    color.onchange = () => { this.checkpoint(); pin.color = color.value; for (const e of this.board.edges) if (e.from.pin === pin.id) e.color = pin.color; this.changed(); this.drawNodes(); this.drawEdges(); };
    if (pin.notePath) { this.button(this.panel, 'Editar resumo no Obsidian', 'square-pen', () => this.openNote(pin.notePath)); this.notePreview(pin.notePath, this.panel.createDiv({ cls: 'ia-summary' })); }
    else this.panel.createEl('p', { text: 'Este alfinete pode abrir um mapa mental ou uma nota Markdown.', cls: 'ia-muted' });
    const connections = this.board.edges.filter(e => e.from.node === image.id && e.from.pin === pin.id);
    for (const e of connections) {
      const target = this.board.nodes.find(n => n.id === e.to.node);
      if (target?.type === 'image' || target?.type === 'web') this.button(this.panel, `Ir para ${target.title || target.path.split('/').pop()}`, 'arrow-up-right', () => { this.selected = { node: target.id }; this.focusNode(target); this.highlight(); this.showSelection(); });
    }
    this.button(this.panel, 'Conectar este alfinete', 'waypoints', () => { this.mode = 'connect'; this.source = { node: image.id, pin: pin.id }; this.render(); this.hint.textContent = 'Clique na imagem ou no alfinete de destino.'; });
    this.button(this.panel, 'Remover alfinete', 'trash-2', () => { this.checkpoint(); image.pins = image.pins.filter(p => p !== pin); this.board.edges = this.board.edges.filter(e => e.from.pin !== pin.id && e.to.pin !== pin.id); this.selected = { node: image.id }; this.changed(true); this.render(); });
  }
  relationAnswer(node) { const children = this.mindChildren ? this.mindChildren.get(node.id) || [] : this.board.nodes.filter(n => n.type === 'mind' && n.parentId === node.id); return children.map(n => `- ${n.title}`).join('\n'); }
  relationQuestion(node) { const parent = this.board.nodes.find(n => n.id === node.parentId); return `Quais são os itens de “${node.title}”${parent ? ` em “${parent.title}”` : ''}?`; }
  showRelation(node) {
    this.clearPanel(); this.panel.createDiv({ cls: 'ia-eyebrow', text: 'RELAÇÃO DO MAPA MENTAL' }); this.panel.createEl('h2', { text: node.title });
    this.button(this.panel, 'Vincular este mapa a uma imagem', 'map-pin-plus', () => new MapImageModal(this, node).open());
    this.button(this.panel, '+ Filho desta relação', 'plus', () => this.addMindNode(node));
    this.button(this.panel, '+ Filho de nota existente · Shift+Tab', 'file-input', () => this.addMindNoteChild(node));
    this.button(this.panel, 'Renomear relação', 'square-pen', () => this.renameMindInline(node));
    this.flashcardActions(node, this.panel);
    this.button(this.panel, 'Responder flashcards deste mapa', 'play', () => this.reviewFlashcards(node.mapId));
    const children = this.board.nodes.filter(n => n.type === 'mind' && n.parentId === node.id);
    this.panel.createEl('h3', { text: `Filhos · ${children.length}` });
    for (const child of children) this.button(this.panel, child.title, 'arrow-up-right', () => { if (node.collapsed) { this.checkpoint(); node.collapsed = false; this.layoutMind(node.mapId); this.changed(); this.render(); } this.selected = { node: child.id }; this.highlight(); this.showSelection(); this.focusNode(child); });
    if (children.length) this.button(this.panel, node.collapsed ? 'Expandir filhos' : 'Recolher filhos', node.collapsed ? 'chevron-right' : 'chevron-down', () => this.collapseMind(node));
    this.button(this.panel, 'Remover relação e seus ramos', 'trash-2', () => this.removeNode(node));
    this.panel.createEl('p', { cls: 'ia-muted', text: 'Tab cria um filho neste grupo. O flashcard da relação pode acompanhar automaticamente os títulos de todos os filhos, inclusive os recolhidos.' });
  }
  editEdgeLabel(edge) {
    edge = this.board.edges.find(e => e.id === edge?.id);
    if (!edge) return;
    const parent = this.board.nodes.find(n => n.id === edge.from.node), child = this.board.nodes.find(n => n.id === edge.to.node);
    if (!edge.mindTree || parent?.type !== 'mind' || child?.type !== 'mind' || child.parentId !== parent.id) { new EdgeLabelModal(this, edge).open(); return; }
    const relation = child.relation ? child : parent.relation ? parent : null;
    if (relation) { this.selected = { node: relation.id }; this.highlight(); this.showSelection(); this.focusNode(relation); this.renameMindInline(relation); return; }
    this.inlineRename?.finish(); this.checkpoint();
    const group = { id: uid(), type: 'mind', relation: true, mapId: parent.mapId, parentId: parent.id, path: '', title: edge.label || 'Relação', body: '', color: edge.color || parent.color, collapsed: false, x: parent.x + 350, y: child.y, w: 180, h: 4 };
    this.board.nodes.splice(this.board.nodes.indexOf(child), 0, group); child.parentId = group.id; edge.to = { node: group.id }; delete edge.label;
    this.board.edges.push({ id: uid(), from: { node: group.id }, to: { node: child.id }, color: child.color || group.color, mindTree: true });
    this.layoutMind(parent.mapId); this.selected = { node: group.id }; this.changed(); this.render(); this.focusNode(group); this.renameMindInline(group, true);
  }
  showEdge(edge) {
    edge = this.board.edges.find(e => e.id === edge?.id);
    if (!edge) return;
    const source = this.board.nodes.find(n => n.id === edge.from.node), target = this.board.nodes.find(n => n.id === edge.to.node);
    const relation = edge.mindTree && (target?.relation ? target : source?.relation ? source : null);
    if (relation) { this.selected = { node: relation.id }; this.highlight(); this.showRelation(relation); return; }
    this.clearPanel(); this.panel.createEl('h2', { text: 'Ligação visual' });
    this.button(this.panel, edge.mindTree ? 'Nomear relação e agrupar filhos' : 'Nomear linha', 'square-pen', () => this.editEdgeLabel(edge));
    if (edge.label) this.panel.createEl('p', { text: edge.label });
    if (edge.mindTree) { this.panel.createEl('p', { text: 'Dê dois cliques na linha para criar uma relação, como Indicações, e adicionar vários filhos.' }); this.button(this.panel, 'Remover ramo filho do quadro', 'trash-2', () => { const node = this.board.nodes.find(n => n.id === edge.to.node); if (node) this.removeNode(node); }); return; }
    this.panel.createEl('p', { text: 'Esta linha conecta dois pontos do seu quadro.' });
    this.button(this.panel, 'Remover ligação', 'unlink', () => { this.checkpoint(); this.board.edges = this.board.edges.filter(e => e !== edge); this.changed(); this.render(); });
  }
  async openNote(path) { const file = this.app.vault.getFileByPath(path); if (!file) { new Notice('Nota não encontrada.'); return; } await this.app.workspace.getLeaf('split').openFile(file); }
  openWeb(node, pin) {
    if (Platform.isMobile) { new Notice('A marcação de páginas externas está disponível no Obsidian para computador.'); return; }
    this.plugin.activeReader?.close();
    const reader = new WebReaderModal(this, node, pin); this.plugin.activeReader = reader; reader.open();
  }
  async saveVisualNote(image, existing) {
    const board = this.board;
    try {
      await this.plugin.folder(this.app.preferences.notesFolder || 'Notas');
      if (board !== this.board || !board.nodes.includes(image)) return;
      let note = existing;
      if (!note) note = await this.app.vault.create(this.plugin.unique(`${this.app.preferences.notesFolder || 'Notas'}/${namePart(image.title || 'Nota visual')}.md`), `# ${image.title || 'Nota visual'}\n\n`);
      const previous = await this.plugin.visualSource(note);
      if (previous) {
        const stored = await this.plugin.loadVisualNote(note);
        const savedRoot = stored.nodes.find(n => n.id === stored.visualRoot);
        if (stored.visualRoot !== (Object.entries(image.visualIdentity?.nodes || {}).find(([, local]) => local === image.id)?.[0] || image.id) && (savedRoot?.type === 'image' || (savedRoot?.type === 'mind' && !image.pins.some(p => p.mapRoot === savedRoot.id)))) { new Notice('Essa nota já possui outro conjunto visual. Use “Adicionar nota existente” para recuperá-lo.'); return false; }
        if (savedRoot?.type === 'note' && savedRoot.flashcards?.length) {
          image.flashcards ||= []; image.visualIdentity ||= { nodes: {}, pins: {}, edges: {}, cards: {} };
          for (const card of savedRoot.flashcards) { const id = image.visualIdentity.cards[card.id] ||= uid(); if (!image.flashcards.some(c => c.id === id)) image.flashcards.push({ ...clone(card), id }); }
        }
      }
      if (board !== this.board || !board.nodes.includes(image)) return;
      const source = note.path;
      const roots = image.pins.map(p => board.nodes.find(n => n.id === p.mapRoot)).filter(Boolean);
      if (board.nodes.some(n => n.type === 'image' && n !== image && n.visualSource && n.pins.some(p => roots.some(root => root.id === p.mapRoot)))) throw new Error('Este mapa já pertence a outra nota visual. Vincule essa nota existente em vez de criar outra.');
      this.checkpoint();
      for (const root of roots) if (!root.path) root.path = note.path;
      for (const root of roots) { delete root.visualSource; delete root.visualNote; }
      const bundle = visualBundle(board, image);
      bundle.visualNotePath = note.path;
      await this.plugin.saveVisualSource(source, note.path, bundle, this);
      if (board !== this.board || !board.nodes.includes(image)) { new Notice(`Nota visual salva: ${note.basename}`); return; }
      image.visualSource = source; image.visualNote = note.path; delete image.visualDetached;
      this.visualHashes ||= new Map(); this.visualHashes.set(source, JSON.stringify(bundle)); this.visualContentHashes ||= new Map(); this.visualContentHashes.set(image.id, visualContentHash(reusableBundle(board, image)));
      this.changed(true); this.render(); new Notice('Tudo salvo nas propriedades da nota. Use “Adicionar nota existente” em qualquer quadro.'); return true;
    } catch (error) { new Notice(`Não foi possível vincular a nota visual: ${error.message}`); }
  }
  /** Add an image to the owning note, preserving its existing canonical mind maps. */
  async attachImageToVisualRoot(node, image) {
    const board = this.board;
    this.pendingImageAttachments ||= new Set(); if (this.pendingImageAttachments.has(node.id)) return;
    if (image.visualSource && image.visualNote !== (node.visualNote || node.path)) throw new Error('Essa imagem pertence a outra nota. Cole uma imagem nova.');
    this.pendingImageAttachments.add(node.id);
    try {
      const path = node.visualNote || node.path;
      let note = path && this.app.vault.getFileByPath(path);
      if (!note) note = await this.createAtlasNote(node.title, node.body || '');
      if (this.board !== board || !board.nodes.includes(node) || !board.nodes.includes(image)) return;
      const source = node.visualSource || note.path, bundle = reusableBundle(board, node);
      const old = bundle.nodes.find(n => n.id === bundle.visualRoot), wasMind = old.type === 'mind', wasImage = old.type === 'image';
      const imageId = wasMind ? uid() : old.id;
      const maps = wasMind ? [old.id] : old.noteMaps || [];
      const card = { id: imageId, type: 'image', title: node.title, path: image.path, x: 0, y: 0, w: image.w, h: image.h, pins: wasImage ? clone(old.pins) : [] };
      if (!wasMind && old.flashcards) card.flashcards = clone(old.flashcards);
      for (const id of maps) {
        const map = bundle.nodes.find(n => n.id === id); if (!map) continue;
        const pin = { id: uid(), label: map.title || node.title, u: 1, v: .5, color: map.color || COLORS[0], notePath: '', mapRoot: id, imageMap: true };
        card.pins.push(pin);
        const edge = !wasMind && bundle.edges.find(e => e.from.node === old.id && e.to.node === id);
        if (edge) { edge.from = { node: imageId, pin: pin.id }; delete edge.noteMap; }
        else bundle.edges.push({ id: uid(), from: { node: imageId, pin: pin.id }, to: { node: id }, color: pin.color });
        // Keep the existing map to the right of the new image; its internal geometry remains intact.
        const dx = card.w + 130 - map.x, dy = card.h / 2 - map.h / 2 - map.y;
        for (const member of bundle.nodes) if (member.type === 'mind' && member.mapId === id) { member.x += dx; member.y += dy; }
        map.pinHidden = false;
      }
      for (const path of old.noteLinks || []) {
        const pin = { id: uid(), label: path.split('/').pop().replace(/\.md$/, ''), u: .5, v: .5, color: COLORS[0], notePath: path }; card.pins.push(pin);
        for (const edge of bundle.edges) if (edge.from.node === old.id && bundle.nodes.find(n => n.id === edge.to.node)?.path === path) edge.from = { node: imageId, pin: pin.id };
      }
      if (wasMind) bundle.nodes.unshift(card); else bundle.nodes[bundle.nodes.indexOf(old)] = card;
      bundle.visualRoot = imageId; bundle.visualNotePath = note.path;
      readVisualBundle(JSON.stringify(bundle));
      this.checkpoint();
      await this.plugin.saveVisualSource(source, note.path, bundle, this);
      if (this.board !== board || !board.nodes.includes(node)) return;
      const installed = this.applyVisualBundle(source, note.path, bundle, undefined, { root: node });
      for (const member of bundle.nodes) if (member.type === 'mind') {
        const local = board.nodes.find(n => n.id === installed.visualIdentity.nodes[member.id]);
        if (local) { local.x = installed.x + member.x; local.y = installed.y + member.y; }
      }
      this.alignVisualChildren();
      // The former root now serves as the image's logical map root.
      const map = board.nodes.find(n => n.id === installed.pins.find(p => p.imageMap)?.mapRoot);
      if (map && !wasImage) { map.pinHidden = false; if (wasMind) map.collapsed = node.collapsed; }
      if (wasImage) { installed.w = image.w; installed.h = image.h; }
      if (image !== node && image.id !== installed.id) {
        board.nodes = board.nodes.filter(n => n.id !== image.id);
        board.edges = board.edges.filter(e => e.from.node !== image.id && e.to.node !== image.id);
      }
      for (const group of board.groups || []) group.members = [...new Set(group.members.map(id => id === image.id ? installed.id : id))];
      this.selected = { node: installed.id }; this.rememberVisualLayout(); this.changed(true, false); this.render();
      new Notice('Imagem vinculada à nota. Mapas mentais e flashcards preservados.');
      return installed;
    } finally { this.pendingImageAttachments.delete(node.id); }
  }
  async attachImageToMindNode(node, image) {
    const board = this.board;
    if (!board.nodes.includes(node) || !board.nodes.includes(image)) return;
    if (node.type === 'note' || node.type === 'mind' && !node.parentId) {
      const owner = node.type === 'mind' && board.nodes.find(n => n.type === 'note' && n.noteMaps?.includes(node.id) || n.type === 'image' && n.pins.some(p => p.mapRoot === node.id));
      return this.attachImageToVisualRoot(owner || node, image);
    }
    const originalPath = node.path;
    let note = node.path && this.app.vault.getFileByPath(node.path);
    if (!note) note = await this.createAtlasNote(node.title, node.body || '');
    if (this.board !== board || !board.nodes.includes(node) || !board.nodes.includes(image)) return;
    if (image.visualSource && image.visualNote !== note.path) throw new Error('Essa imagem pertence a outra nota. Cole uma imagem nova para este nó.');
    const source = await this.plugin.visualSource(note);
    let target = image;
    if (source) {
      const bundle = await this.plugin.loadVisualNote(note);
      if (this.board !== board || !board.nodes.includes(node)) return;
      const savedRoot = bundle.nodes.find(n => n.id === bundle.visualRoot);
      let current = board.nodes.find(n => n.id === node.linkedVisualRoot);
      if (!current) current = this.applyVisualBundle(source, note.path, bundle, { x: node.x, y: node.y }, { createNew: true });
      if (savedRoot.type === 'image') {
        this.checkpoint(); current.path = image.path; current.w = image.w; current.h = image.h; current.title = node.title;
        target = current;
        if (image !== current) { board.nodes = board.nodes.filter(n => n !== image); board.edges = board.edges.filter(e => e.from.node !== image.id && e.to.node !== image.id); }
      } else {
        image.visualIdentity = clone(current.visualIdentity || { nodes: {}, pins: {}, edges: {}, cards: {} });
        const canonicalRoot = bundle.visualRoot; image.visualIdentity.nodes[canonicalRoot] = image.id;
        const maps = current.type === 'mind' ? [current.id] : current.noteMaps || [];
        for (const id of maps) {
          let pin = image.pins.find(p => p.mapRoot === id);
          if (!pin) { pin = { id: uid(), label: board.nodes.find(n => n.id === id)?.title || node.title, u: 1, v: .5, color: node.color || COLORS[0], notePath: '', mapRoot: id, imageMap: true }; image.pins.push(pin); }
          const edge = board.edges.find(e => e.from.node === current.id && e.to.node === id);
          if (edge) { edge.from = { node: image.id, pin: pin.id }; delete edge.noteMap; }
          else board.edges.push({ id: uid(), from: { node: image.id, pin: pin.id }, to: { node: id }, color: pin.color });
        }
        for (const path of current.noteLinks || []) if (!image.pins.some(p => p.notePath === path)) image.pins.push({ id: uid(), label: path.split('/').pop().replace(/\.md$/, ''), u: .5, v: .5, color: node.color || COLORS[0], notePath: path });
        if (current.flashcards) image.flashcards = clone(current.flashcards);
        delete current.visualSource; delete current.visualNote;
        if (current.type === 'note') {
          for (const edge of board.edges) for (const end of [edge.from, edge.to]) if (end.node === current.id) end.node = image.id;
          board.nodes = board.nodes.filter(n => n !== current);
        }
      }
    }
    target.title = node.title;
    if (!await this.saveVisualNote(target, note)) return;
    if (this.board !== board || !board.nodes.includes(node)) return;
    this.checkpoint(); node.path = note.path; node.visualAsChild = true;
    target.nestedOnly = true; node.linkedVisualRoot = target.id;
    if (originalPath !== node.path) { node.visualExpanded = false; }
    else node.visualExpanded = false;
    await this.toggleLinkedVisual(node);
  }
  async openLinkedVisualOrNote(node) {
    try {
      const file = this.app.vault.getFileByPath(node.path); if (!file) return;
      if (node.type === 'mind' && !node.parentId) new MapImageModal(this, node, true).open();
      else if (await this.plugin.visualSource(file)) await this.toggleLinkedVisual(node);
      else this.openNote(node.path);
    } catch (error) { new Notice(`Não foi possível abrir a nota: ${error.message}`); }
  }
  visualWouldCycle(node, path) {
    const queue = [node], seen = new Set();
    while (queue.length) {
      const current = queue.pop(); if (!current || seen.has(current.id)) continue; seen.add(current.id);
      for (const root of this.board.nodes.filter(n => n.visualSource)) {
        if (!reusableNodes(this.board, root).some(n => n.id === current.id)) continue;
        if (root.visualNote === path) return true;
        for (const id of root.visualParents || []) queue.push(this.board.nodes.find(n => n.id === id));
      }
    }
    return false;
  }
  async toggleLinkedVisual(node) {
    if (!this.board.nodes.includes(node) || !node.path) return;
    const opened = this.board.nodes.find(n => n.id === node.linkedVisualRoot);
    if (node.visualExpanded && opened) { this.checkpoint(); node.visualExpanded = false; node.visualCollapsed = true; if (node.visualAsChild) { node.w = 240; node.h = 130; this.layoutMind(node.mapId); } this.selected = { node: node.id }; this.changed(); this.render(); return; }
    this.pendingVisualExpansions ||= new Set(); if (this.pendingVisualExpansions.has(node.id)) return;
    const board = this.board, path = node.path, id = node.id; this.pendingVisualExpansions.add(id);
    try {
      const file = this.app.vault.getFileByPath(path); if (!file) throw new Error('Nota vinculada não encontrada.');
      const source = await this.plugin.visualSource(file);
      if (!source) { new Notice('Esta nota ainda não possui imagem ou mapa salvo. Vincule uma imagem ou salve seu mapa nessa nota primeiro.'); return; }
      if (this.visualWouldCycle(node, path)) { new Notice('Esta nota já faz parte deste caminho. Abra a nota original para evitar uma expansão circular.'); return; }
      const bundle = await this.plugin.loadVisualNote(file);
      if (this.board !== board || !board.nodes.includes(node) || node.path !== path) return;
      this.checkpoint();
      let root = board.nodes.find(n => n.id === node.linkedVisualRoot && (n.visualSource === source || n.visualNote === path));
      if (root && board.nodes.some(n => n.id !== node.id && n.linkedVisualRoot === root.id)) root = null;
      const added = !root;
      if (!root) {
        root = this.applyVisualBundle(source, path, bundle, { x: node.x + node.w + 130, y: node.y }, { createNew: true }); root.nestedOnly = true;
      }
      root.visualParents ||= []; if (!root.visualParents.includes(node.id)) root.visualParents.push(node.id);
      node.linkedVisualRoot = root.id; node.visualExpanded = true; delete node.visualCollapsed;
      if (node.parentId) node.visualAsChild = true;
      if (!board.edges.some(e => e.visualLink && e.from.node === node.id && e.to.node === root.id)) board.edges.push({ id: uid(), from: { node: node.id }, to: { node: root.id }, color: node.color || COLORS[0], visualLink: true });
      if (node.visualAsChild) { root.visualChildOf = node.id; node.w = root.w; node.h = root.h; this.layoutMind(node.mapId); this.alignVisualChildren(); }
      else if (added) this.positionLinkedVisual(node, root);
      this.selected = { node: node.visualAsChild ? root.id : node.id }; this.changed(true); this.render(); this.frameLinkedVisual(node.visualAsChild ? board.nodes.find(n => n.id === node.parentId) || node : node, root);
    } catch (error) { new Notice(`Não foi possível expandir a nota visual: ${error.message}`); }
    finally { this.pendingVisualExpansions.delete(id); }
  }
  async restoreDirectVisualChildren() {
    if (this.restoringVisualChildren) return;
    this.restoringVisualChildren = true; const board = this.board, seen = new Set();
    try {
      while (this.board === board) {
        this.prepareMind();
        const node = board.nodes.find(n => n.visualAsChild && n.path && !n.visualExpanded && !n.visualCollapsed && this.visibleMind.has(n.id) && !seen.has(n.id));
        if (!node) break; seen.add(node.id); await this.toggleLinkedVisual(node);
      }
    } finally { this.restoringVisualChildren = false; }
  }
  alignVisualChildren(updateDom = false, dirtyEdges = null) {
    const affected = dirtyEdges || new Set();
    const byId = new Map(this.board.nodes.map(n => [n.id, n]));
    for (const node of this.board.nodes) {
      if (!node.visualAsChild || !node.visualExpanded || !node.linkedVisualRoot) continue;
      const root = byId.get(node.linkedVisualRoot); if (!root?.nestedOnly || root.visualChildOf !== node.id) continue;
      const dx = node.x - root.x, dy = node.y - root.y; if (!dx && !dy) continue;
      for (const member of reusableNodes(this.board, root)) {
        member.x += dx; member.y += dy;
        if (updateDom) { const el = this.nodeElements?.get(member.id); if (el) this.place(el, member); affected.add(member.id); }
      }
      if (updateDom) affected.add(node.id);
    }
    if (updateDom && !dirtyEdges && affected.size) this.drawEdges(affected);
  }
  positionLinkedVisual(parent, root) {
    this.prepareMind(); const members = reusableNodes(this.board, root), ids = new Set(members.map(n => n.id));
    const visible = this.board.nodes.filter(n => ids.has(n.id) && !this.hiddenVisualNodes.has(n.id) && (n.type !== 'mind' || this.visibleMind.has(n.id)));
    if (!visible.length) return;
    const obstacles = this.board.nodes.filter(n => !ids.has(n.id) && !this.hiddenVisualNodes.has(n.id) && (n.type !== 'mind' || this.visibleMind.has(n.id)));
    const dx = parent.x + parent.w + 130 - Math.min(...visible.map(n => n.x)); let dy = parent.y - root.y;
    const blocked = [];
    for (const n of visible) for (const other of obstacles) if (n.x + dx < other.x + other.w + 28 && n.x + dx + n.w + 28 > other.x) blocked.push({ low: other.y - n.y - n.h - 70, high: other.y + other.h + 70 - n.y });
    blocked.sort((a, b) => a.low - b.low); for (const item of blocked) if (dy > item.low && dy < item.high) dy = item.high;
    for (const n of this.board.nodes) if (ids.has(n.id)) { n.x += dx; n.y += dy; }
  }
  frameLinkedVisual(parent, root) {
    this.prepareMind(); const ids = new Set(reusableNodes(this.board, root).map(n => n.id));
    const nodes = this.board.nodes.filter(n => (n.id === parent.id || ids.has(n.id)) && !this.hiddenVisualNodes.has(n.id) && (n.type !== 'mind' || this.visibleMind.has(n.id)));
    if (!nodes.length) return;
    const left = Math.min(...nodes.map(n => n.x)), top = Math.min(...nodes.map(n => n.y)), right = Math.max(...nodes.map(n => n.x + n.w)), bottom = Math.max(...nodes.map(n => n.y + n.h + 42));
    const r = this.viewport.getBoundingClientRect(), z = Math.max(.15, Math.min(1, (r.width - 100) / (right - left), (r.height - 100) / (bottom - top)));
    this.board.camera = { x: (r.width - (right - left) * z) / 2 - left * z, y: (r.height - (bottom - top) * z) / 2 - top * z, z }; this.camera(); this.changed();
  }
  async unlinkVisualImage(image) {
    if (!this.board.nodes.includes(image) || !image.visualNote || image.type !== 'image') return;
    this.unlinkingImages ||= new Set(); if (this.unlinkingImages.has(image.id)) return;
    const id = image.id, board = this.board, notePath = image.visualNote, source = image.visualSource;
    this.endDrag(); this.unlinkingImages.add(id);
    try {
      const scene = visualBundle(board, image), note = this.app.vault.getFileByPath(notePath);
      if (!note) throw new Error('Nota original não encontrada.');
      const bundle = clone(scene), root = bundle.nodes.find(n => n.id === bundle.visualRoot);
      const card = { id: root.id, type: 'note', path: notePath, title: note.basename, x: root.x, y: root.y, w: 360, h: 280, noteMaps: [...new Set(scene.nodes.filter(n => n.type === 'mind').map(n => n.mapId))], noteLinks: [...new Set(image.pins.map(p => p.notePath).filter(Boolean))] };
      if (root.flashcards) card.flashcards = clone(root.flashcards);
      bundle.nodes[bundle.nodes.indexOf(root)] = card;
      for (const edge of bundle.edges) for (const endpoint of [edge.from, edge.to]) if (endpoint.node === root.id) delete endpoint.pin;
      await this.plugin.saveVisualSource(source, notePath, bundle, this, scene);
      if (this.board !== board || !board.nodes.includes(image)) return;
      this.checkpoint();
      const ids = new Map(reusableNodes(board, image).map(n => [n.id, uid()])), pinIds = new Map();
      for (const node of board.nodes) if (ids.has(node.id)) {
        node.id = ids.get(node.id); delete node.visualSource; delete node.visualNote; delete node.visualIdentity;
        if (node.mapId) node.mapId = ids.get(node.mapId) || node.mapId;
        if (node.parentId) node.parentId = ids.get(node.parentId) || node.parentId;
        if (node.noteMaps) node.noteMaps = node.noteMaps.map(id => ids.get(id) || id);
        for (const pin of node.pins || []) { const next = uid(); pinIds.set(pin.id, next); pin.id = next; }
        for (const flashcard of node.flashcards || []) flashcard.id = uid();
      }
      for (const node of board.nodes) {
        if (ids.has(node.linkedVisualRoot)) node.linkedVisualRoot = ids.get(node.linkedVisualRoot);
        for (const pin of node.pins || []) if (ids.has(pin.mapRoot)) pin.mapRoot = ids.get(pin.mapRoot);
      }
      for (const edge of board.edges) {
        const local = ids.has(edge.from.node) && ids.has(edge.to.node); if (local) edge.id = uid();
        for (const endpoint of [edge.from, edge.to]) { endpoint.node = ids.get(endpoint.node) || endpoint.node; if (endpoint.pin) endpoint.pin = pinIds.get(endpoint.pin) || endpoint.pin; }
      }
      image.visualDetached = true;
      this.visualHashes ||= new Map(); this.visualHashes.set(source, JSON.stringify(bundle)); this.visualContentHashes ||= new Map(); this.visualContentHashes.set(image.id, visualContentHash(reusableBundle(board, image)));
      this.pendingMapPin = this.pendingAreaPin = null; this.source = null; this.mode = 'select'; this.selected = { node: image.id };
      this.changed(true); this.render(); new Notice('Imagem desvinculada. Mapas e flashcards permanecem na nota; a imagem continua independente neste quadro.');
    } catch (error) { new Notice(`Não foi possível desvincular: ${error.message}`); }
    finally { this.unlinkingImages.delete(id); }
  }
  async persistMindRoot(root) {
    if (!this.board.nodes.includes(root)) return false;
    if (root.visualSource) return true;
    const image = this.board.nodes.find(n => n.type === 'image' && n.pins.some(p => p.mapRoot === root.id));
    const board = this.board;
    if (image) return image.visualSource || image.visualDetached ? true : this.saveVisualNote(image, root.path ? this.app.vault.getFileByPath(root.path) : null);
    let note = root.path && this.app.vault.getFileByPath(root.path);
    if (!note) note = await this.createAtlasNote(root.title, root.body);
    if (board !== this.board || !board.nodes.includes(root)) return false;
    const existing = await this.plugin.visualSource(note);
    if (existing) {
      const saved = await this.plugin.loadVisualNote(note);
      if (saved.visualRoot !== (Object.entries(root.visualIdentity?.nodes || {}).find(([, local]) => local === root.id)?.[0] || root.id)) { new Notice('A nota já possui outro conjunto visual. O mapa foi mantido no quadro.'); return false; }
    }
    this.checkpoint(); root.path = note.path; root.visualNote = note.path; root.visualSource = note.path;
    const bundle = mindNoteBundle(board, root);
    await this.plugin.saveVisualSource(note.path, note.path, bundle, this);
    this.visualHashes ||= new Map(); this.visualHashes.set(note.path, JSON.stringify(bundle)); this.visualContentHashes ||= new Map(); this.visualContentHashes.set(root.id, visualContentHash(reusableBundle(board, root))); this.changed(true); this.render(); return true;
  }
  async pickVisualNote(pos) {
    const board = this.board;
    const files = this.app.vault.getMarkdownFiles();
    new FilePicker(this.app, files, file => { if (this.board === board) this.addVisualNote(file, pos); }, 'Adicionar uma nota existente da biblioteca…').open();
  }
  async addVisualNote(note, pos) {
    const board = this.board;
    try {
      const source = await this.plugin.visualSource(note);
      const r = this.viewport.getBoundingClientRect(), position = pos || this.toWorld(r.left + r.width / 2 - 180, r.top + r.height / 2 - 140);
      if (!source) {
        if (this.board !== board || !this.file) return;
        this.checkpoint(); const node = { id: uid(), type: 'note', path: note.path, title: note.basename, x: position.x, y: position.y, w: 360, h: 280, visualSource: note.path, visualNote: note.path };
        board.nodes.push(node); this.selected = { node: node.id }; const data = reusableBundle(board, node);
        await this.plugin.saveVisualSource(note.path, note.path, data, this);
        if (board !== this.board) return;
        this.visualHashes ||= new Map(); this.visualHashes.set(note.path, JSON.stringify(data)); this.visualContentHashes ||= new Map(); this.visualContentHashes.set(node.id, visualContentHash(reusableBundle(board, node))); this.changed(true); this.render(); this.focusNode(node); return;
      }
      const bundle = await this.plugin.loadVisualNote(note);
      if (this.board !== board || !this.file) return;
      this.checkpoint(); const installed = this.applyVisualBundle(source, note.path, bundle, position, { createNew: true }); this.selected = { node: installed.id };
      this.changed(true); this.render(); this.focusNode(installed); this.restoreDirectVisualChildren();
    } catch (error) { new Notice(`Não foi possível adicionar a nota visual: ${error.message}`); }
  }
  applyVisualBundle(source, notePath, bundle, position, options = {}) {
    const image = options.createNew ? null : options.root ? this.board.nodes.find(n => n.id === options.root.id) : this.board.nodes.find(n => n.visualSource === source || n.visualNote === notePath);
    const oldNodes = image ? reusableNodes(this.board, image) : [], removed = new Set(oldNodes.map(n => n.id));
    const oldEdges = new Set(this.board.edges.filter(e => removed.has(e.from.node) && removed.has(e.to.node)).map(e => e.id));
    const previous = new Map(this.board.nodes.map(n => [n.id, n]));
    const identity = image?.visualIdentity ? clone(image.visualIdentity) : { nodes: {}, pins: {}, edges: {}, cards: {} };
    if (image && !image.visualIdentity) {
      for (const n of oldNodes) { identity.nodes[n.id] = n.id; for (const p of n.pins || []) identity.pins[p.id] = p.id; for (const c of n.flashcards || []) identity.cards[c.id] = c.id; }
      for (const id of oldEdges) identity.edges[id] = id;
    }
    if (image) {
      for (const key of Object.keys(identity.nodes)) if (identity.nodes[key] === image.id && key !== bundle.visualRoot) delete identity.nodes[key];
      identity.nodes[bundle.visualRoot] = image.id;
    }
    const local = mapVisualIds(clone(bundle), (kind, id) => {
      identity[kind] ||= {};
      if (!Object.prototype.hasOwnProperty.call(identity[kind], id)) identity[kind][id] = uid();
      return identity[kind][id];
    });
    const origin = position || (image ? { x: image.x, y: image.y } : { x: 0, y: 0 }), root = local.nodes.find(n => n.id === local.visualRoot);
    if (local.nodes.some(n => previous.has(n.id) && !removed.has(n.id))) throw new Error('Conflito entre ocorrências da nota visual.');
    const priorCanonical = new Map(image ? Object.entries(image.visualIdentity?.nodes || Object.fromEntries(oldNodes.map(n => [n.id, n.id]))).map(([canonical, id]) => [canonical, previous.get(id)]) : []);
    const template = options.templateRoot;
    const templateIds = template?.visualIdentity ? new Map(Object.entries(template.visualIdentity.nodes || {}).map(([canonical, id]) => [id, canonical])) : new Map();
    const templateNodes = new Map((template ? reusableNodes(this.board, template) : []).map(n => [templateIds.get(n.id) || n.id, n]));
    const canonicalIds = new Map(Object.entries(identity.nodes).map(([canonical, id]) => [id, canonical]));
    const rootX = root.x, rootY = root.y;
    for (const n of local.nodes) {
      cleanNestedState(n);
      n.x += origin.x - rootX; n.y += origin.y - rootY;
      const prior = previous.get(n.id), state = prior || priorCanonical.get(canonicalIds.get(n.id)) || templateNodes.get(canonicalIds.get(n.id));
      if (prior) {
        n.x = prior.x; n.y = prior.y; if (prior.cardColor) n.cardColor = prior.cardColor; if (n.type === prior.type) { n.w = prior.w; n.h = prior.h; }
        for (const key of ['visualParents', 'nestedOnly', 'visualChildOf']) if (prior[key] !== undefined) n[key] = clone(prior[key]);
        if (prior.path === n.path) for (const key of ['linkedVisualRoot', 'visualExpanded', 'visualAsChild', 'visualCollapsed']) if (prior[key] !== undefined) n[key] = prior[key];
      }
      if (n.type === 'mind' && state) { n.pinHidden = state.pinHidden; n.collapsed = state.collapsed; }
      if (n.id === local.visualRoot) { n.visualSource = source; n.visualNote = notePath; n.visualIdentity = identity; }
    }
    const newIds = new Set([...this.board.nodes.filter(n => !removed.has(n.id)).map(n => n.id), ...local.nodes.map(n => n.id)]);
    this.board.nodes = [...this.board.nodes.filter(n => !removed.has(n.id)), ...local.nodes];
    for (const n of this.board.nodes) for (const pin of n.pins || []) if (pin.mapRoot && !newIds.has(pin.mapRoot)) delete pin.mapRoot;
    this.board.edges = [...this.board.edges.filter(e => !oldEdges.has(e.id) && newIds.has(e.from.node) && newIds.has(e.to.node)), ...local.edges];
    const installed = this.board.nodes.find(n => n.id === local.visualRoot), normalized = reusableBundle(this.board, installed);
    this.visualHashes ||= new Map(); this.visualHashes.set(source, JSON.stringify(normalized));
    this.visualContentHashes ||= new Map(); this.visualContentHashes.set(installed.id, visualContentHash(normalized));
    return installed;
  }
  separateSharedOccurrences() {
    let repaired = false; const maps = new Set();
    for (const root of this.board.nodes.filter(n => n.visualSource)) {
      const parents = this.board.nodes.filter(n => n.linkedVisualRoot === root.id);
      if (parents.length < 2) continue;
      const bundle = reusableBundle(this.board, root);
      for (let i = 0; i < parents.length; i++) {
        const parent = parents[i];
        const local = i === 0 ? root : this.applyVisualBundle(root.visualSource, root.visualNote, bundle, { x: parent.x, y: parent.y }, { createNew: true, templateRoot: root });
        local.nestedOnly = true; local.visualParents = [parent.id]; local.visualChildOf = parent.id;
        parent.linkedVisualRoot = local.id;
        for (const edge of this.board.edges) if (edge.visualLink && edge.from.node === parent.id && edge.to.node === root.id) edge.to.node = local.id;
        if (parent.visualAsChild && parent.visualExpanded) { parent.w = local.w; parent.h = local.h; }
        if (parent.mapId) maps.add(parent.mapId);
      }
      repaired = true;
    }
    if (repaired) { for (const id of maps) this.layoutMind(id); this.alignVisualChildren(); this.rememberVisualLayout(); }
    return repaired;
  }
  async refreshVisualNotes() {
    const board = this.board; let updated = reconcileAtlasNoteNames(board, this.app.vault, this.plugin.noteRenames) || false;
    updated = this.separateSharedOccurrences() || updated; const loaded = new Map();
    for (const image of board.nodes.filter(n => n.visualSource)) {
      try {
        const note = this.app.vault.getFileByPath(image.visualNote); if (!note) { new Notice(`Nota original ausente: ${image.visualNote}`); continue; }
        if (!loaded.has(note.path)) loaded.set(note.path, this.plugin.loadVisualNote(note));
        const bundle = await loaded.get(note.path);
        if (this.board !== board) return;
        this.applyVisualBundle(image.visualSource, image.visualNote, bundle, undefined, { root: image }); updated = true;
      } catch (error) { new Notice(`Nota visual preservada no quadro: ${error.message}`); }
    }
    if (this.board === board) {
      const requests = this.plugin.pendingMindMoves || [];
      let applied = false;
      for (const request of [...requests]) if (request.boardPath === this.file?.path) {
        const node = board.nodes.find(n => n.id === request.nodeId), parent = board.nodes.find(n => n.id === request.parentId);
        if (node && parent && this.reparentMindNode(node, parent, false)) { this.plugin.pendingMindMoves = this.plugin.pendingMindMoves.filter(item => item !== request); applied = true; }
      }
      if (applied) { const state = await this.plugin.loadData(); await this.plugin.saveData({ ...(state || {}), pendingMindMoves: this.plugin.pendingMindMoves }); }
      if (this.board !== board) return;
      const repaired = this.restorePreviousMapLayout();
      if (updated || repaired) { this.requestSave(); this.render(); }
      this.restoreDirectVisualChildren();
      if (repaired) this.fit();
    }
  }
  syncVisualNotes() {
    if (!this.file || this.invalidData !== null) return;
    this.visualContentHashes ||= new Map(); this.visualInputHashes ||= new Map(); const index = atlasSceneIndex(this.board);
    const roots = new Set(this.board.nodes.filter(n => n.visualSource).map(n => n.id));
    for (const id of this.visualInputHashes.keys()) if (!roots.has(id)) this.visualInputHashes.delete(id);
    for (const image of this.board.nodes.filter(n => n.visualSource)) {
      if (this.unlinkingImages?.has(image.id)) continue;
      const input = visualInputHash(this.board, image, index);
      if (this.visualInputHashes.get(image.id) === input && this.visualContentHashes.has(image.id)) continue;
      const bundle = reusableBundle(this.board, image, index), hash = visualContentHash(bundle), previous = this.visualContentHashes.get(image.id);
      this.visualInputHashes.set(image.id, visualInputHash(this.board, image, index));
      this.visualContentHashes.set(image.id, hash);
      if (previous === undefined || previous === hash) continue;
      this.plugin.saveVisualSource(image.visualSource, image.visualNote, bundle, this).catch(error => { this.visualInputHashes.delete(image.id); if (this.visualContentHashes.get(image.id) === hash) this.visualContentHashes.set(image.id, previous); new Notice(`Não foi possível sincronizar a nota visual: ${error.message}`); });
    }
  }

  addSubboard(file, pos) {
    if (!this.file || file.extension !== 'imageboard' || file.path === this.file.path) { new Notice('Escolha outro whiteboard para vincular.'); return; }
    const existing = this.board.nodes.find(n => n.type === 'whiteboard' && n.path === file.path);
    if (existing) { this.selected = { node: existing.id }; this.highlight(); this.focusNode(existing); return; }
    const r = this.viewport.getBoundingClientRect(), center = pos || this.toWorld(r.left + 100, r.top + 100);
    this.checkpoint('board');
    const node = { id: uid(), type: 'whiteboard', path: file.path, title: file.basename, x: center.x, y: center.y, w: 360, h: 235 };
    this.board.nodes.push(node); this.selected = { node: node.id }; this.selectedGroup = null;
    this.changed(true, false); this.render(); this.focusNode(node);
  }
  async renderSubboardPreview(node, el) {
    const token = uid(); el._atlasBoardToken = token;
    const file = this.app.vault.getFileByPath(node.path);
    if (!file) { el.empty(); el.createDiv({ cls: 'ia-muted', text: 'Whiteboard não encontrado. O vínculo foi mantido.' }); return; }
    this.subboardCache ||= new Map();
    const key = `${file.stat.mtime}:${file.stat.size}`, cached = this.subboardCache.get(file.path);
    let pending = cached?.key === key ? cached.pending : null;
    if (!pending) {
      pending = this.app.vault.cachedRead(file).then(raw => {
        const board = JSON.parse(raw);
        if (board.version !== 1 || !Array.isArray(board.nodes)) throw new Error('Formato de whiteboard inválido.');
        const cards = board.nodes.filter(n => n && n.type !== 'whiteboard' && !n.relation && !(n.type === 'mind' && n.visualAsChild));
        return { items: cards.length, boards: board.nodes.filter(n => n?.type === 'whiteboard').length, labels: [...new Set(cards.map(n => n.title || n.path?.split('/').pop() || 'Sem título'))].slice(0, 12) };
      });
      this.subboardCache.set(file.path, { key, pending });
      while (this.subboardCache.size > 40) this.subboardCache.delete(this.subboardCache.keys().next().value);
    }
    try {
      const summary = await pending;
      if (!el.isConnected || el._atlasBoardToken !== token || !this.board.nodes.includes(node)) return;
      el.empty(); el.createDiv({ cls: 'ia-board-count', text: `${summary.items} itens · ${summary.boards} subwhiteboards` });
      const pills = el.createDiv({ cls: 'ia-board-pills' });
      for (const title of summary.labels) pills.createDiv({ cls: 'ia-board-pill', text: title, attr: { title } });
      if (!summary.labels.length) el.createDiv({ cls: 'ia-muted', text: summary.boards ? 'Abra para explorar os subwhiteboards.' : 'Quadro vazio. Abra para adicionar conteúdo.' });
    } catch (error) {
      if (this.subboardCache.get(file.path)?.pending === pending) this.subboardCache.delete(file.path);
      if (el.isConnected && el._atlasBoardToken === token) { el.empty(); el.createDiv({ cls: 'ia-muted', text: `Prévia indisponível: ${error.message}` }); }
    }
  }
  async navigateWhiteboard(path) {
    const history = this.plugin.whiteboardHistory.get(this.leaf.id) || [];
    const target = path || history[history.length - 1];
    const file = target && this.app.vault.getFileByPath(target);
    if (!file || file.extension !== 'imageboard') { new Notice('Whiteboard não encontrado.'); return; }
    try {
      if (typeof this.save === 'function') await this.save();
      const next = [...history]; if (path && this.file?.path !== path) next.push(this.file.path); else if (!path) next.pop();
      this.plugin.whiteboardHistory.set(this.leaf.id, next);
      await this.leaf.openFile(file);
    } catch (error) { this.plugin.whiteboardHistory.set(this.leaf.id, history); new Notice(`Não foi possível abrir o whiteboard: ${error.message}`); }
  }
  pickImage() { new FilePicker(this.app, this.app.vault.getFiles().filter(f => /^(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(f.extension)), file => this.addImage(file), 'Buscar uma imagem no vault…').open(); }
  async addImage(file, pos) {
    const currentFile = this.file, currentBoard = this.board; if (!currentFile) return;
    try {
      const img = this.contentEl.ownerDocument.createElement('img');
      const size = await new Promise((resolve, reject) => { img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight }); img.onerror = () => reject(new Error('Imagem não suportada.')); img.src = this.app.vault.getResourcePath(file); });
      if (this.file !== currentFile || this.board !== currentBoard || !this.viewport?.isConnected) return;
      const center = pos || this.toWorld(this.viewport.getBoundingClientRect().left + 120, this.viewport.getBoundingClientRect().top + 100);
      this.checkpoint(); const w = Math.min(650, Math.max(300, size.w)), h = w * size.h / size.w;
      const node = { id: uid(), type: 'image', path: file.path, title: file.basename, x: center.x, y: center.y, w, h, pins: [] };
      this.board.nodes.push(node); this.changed(true); this.render(); return node;
    } catch (error) { new Notice(error.message); }
  }
  importDialog() {
    const input = this.contentEl.createEl('input', { type: 'file', cls: 'ia-file-input', attr: { accept: 'image/*', multiple: '' } });
    input.onchange = () => { this.importFiles(Array.from(input.files || [])); input.remove(); }; input.click();
  }
  pasteImages(event) {
    if (!this.file || this.invalidData !== null || !this.viewport?.isConnected || event.defaultPrevented) return;
    if (event.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),webview,iframe')) return;
    const clipboard = event.clipboardData; if (!clipboard) return;
    const items = Array.from(clipboard.items || []).filter(item => item.kind === 'file' && /^image\//i.test(item.type));
    const files = items.map(item => item.getAsFile()).filter(Boolean);
    if (!files.length) files.push(...Array.from(clipboard.files || []).filter(file => /^image\//i.test(file.type) || /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(file.name)));
    if (!files.length) return;
    event.preventDefault(); event.stopPropagation();
    const r = this.viewport.getBoundingClientRect(), pos = this.toWorld(r.left + r.width / 2, r.top + r.height / 2);
    pos.x -= 180; pos.y -= 140;
    this.viewport.focus();
    const node = this.board.nodes.find(n => n.id === this.selected?.node);
    if (node?.type === 'note' || node?.type === 'mind' && !node.relation) {
      const board = this.board;
      this.importFiles(files.slice(0, 1), { x: node.x, y: node.y }).then(images => { if (this.board === board && board.nodes.includes(node) && images?.[0]) return this.attachImageToMindNode(node, images[0]); }).catch(error => new Notice(error.message));
    } else this.importFiles(files, pos);
  }
  async importFiles(files, pos) {
    const original = this.file, board = this.board;
    if (!original || this.invalidData !== null) return;
    const added = [];
    try {
      await this.plugin.folder(`${ROOT}/Imagens`);
      for (const file of files) {
        if (this.file !== original || this.board !== board) return;
        const mimeExtensions = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/avif': 'avif', 'image/bmp': 'bmp' };
        const name = file.name || '', namedExtension = name.match(/\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i)?.[1].toLowerCase();
        const ext = mimeExtensions[(file.type || '').toLowerCase()] || namedExtension;
        if (!ext) { new Notice('Formato de imagem não suportado. Copie a imagem como PNG, JPEG ou WebP.'); continue; }
        const stem = namePart(name.replace(/\.[^.]+$/, '') || `Imagem colada ${Date.now()}`);
        const path = this.plugin.unique(`${ROOT}/Imagens/${stem}.${ext}`);
        const bytes = await file.arrayBuffer();
        if (this.file !== original || this.board !== board) return;
        const saved = await this.app.vault.createBinary(path, bytes);
        if (this.file === original && this.board === board) { const image = await this.addImage(saved, pos); if (image) added.push(image); }
        if (pos) pos = { x: pos.x + 50, y: pos.y + 50 };
      }
    } catch (error) { new Notice(`Não foi possível importar: ${error.message}`); }
    return added;
  }
}

// BEGIN ATLAS REVIEW SYSTEM
/* Review engine: FSRS scheduling, vault-local durable decks and a bounded DOM cache. */
const REVIEW_VIEW = 'image-atlas-flashcards';
const REVIEW_ROOT = `${ROOT}/Revisões`;
const REVIEW_MARKER = /<!-- image-atlas-fsrs-deck:([a-z0-9-]+) -->/;
const RATING_LABELS = ['', 'Errei', 'Difícil', 'Acertei', 'Fácil'];
function reviewHash(text) { let a = 2166136261; for (let i = 0; i < text.length; i++) a = Math.imul(a ^ text.charCodeAt(i), 16777619); return (a >>> 0).toString(36); }
function fsrsCard(record, now = new Date()) {
  if (!record.schedule) return FSRS_ENGINE.createEmptyCard(now);
  const card = { ...record.schedule, due: new Date(record.schedule.due) };
  if (card.last_review) card.last_review = new Date(card.last_review);
  return card;
}
function intervalLabel(due, now = Date.now()) {
  const ms = Math.max(0, new Date(due).getTime() - Number(now));
  if (ms < 60000) return '<1 min';
  if (ms < 3600000) return `${Math.round(ms / 60000)} min`;
  if (ms < 23.5 * 3600000) return `${Math.round(ms / 3600000)} h`;
  return `${Math.round(ms / 86400000)} d`;
}
function validateReviewDeck(deck, id) {
  if (!deck || deck.version !== 1 || deck.id !== id || !deck.records || typeof deck.records !== 'object' || Array.isArray(deck.records)) throw new Error('Arquivo de revisões inválido. O arquivo original foi preservado.');
  for (const [key, record] of Object.entries(deck.records)) {
    if (!/^[a-z0-9-]+$/.test(key) || !record || record.id !== key || typeof record.question !== 'string' || typeof record.answer !== 'string' || !Number.isSafeInteger(record.revision) || record.revision < 0 || !Array.isArray(record.history)) throw new Error('Histórico de flashcards inválido. O arquivo original foi preservado.');
    if (record.schedule && (![0, 1, 2, 3].includes(record.schedule.state) || !Number.isFinite(new Date(record.schedule.due).getTime()) || !['stability', 'difficulty', 'reps', 'lapses', 'elapsed_days', 'scheduled_days', 'learning_steps'].every(field => finite(record.schedule[field]) && record.schedule[field] >= 0) || record.schedule.last_review && !Number.isFinite(new Date(record.schedule.last_review).getTime()))) throw new Error('Agendamento FSRS inválido. O arquivo original foi preservado.');
  }
  return deck;
}
class AtlasReviewStore {
  constructor(plugin) { this.plugin = plugin; this.decks = new Map(); this.loading = new Map(); this.sources = new Map(); this.listeners = new Set(); this.scheduler = FSRS_ENGINE.fsrs({ request_retention: .9, enable_fuzz: true, enable_short_term: true, learning_steps: ['1m', '10m'], relearning_steps: ['10m'] }); }
  async noteSource(note) {
    if (this.sources.has(note.path)) return this.sources.get(note.path);
    const task = (async () => {
      let id;
      await this.plugin.app.vault.process(note, text => {
        const match = text.match(REVIEW_MARKER); if (match) { id = match[1]; return text; }
        id = uid(); return `${text}${text.endsWith('\n') ? '\n' : '\n\n'}<!-- image-atlas-fsrs-deck:${id} -->\n`;
      });
      return id;
    })();
    this.sources.set(note.path, task);
    if (this.sources.size > 200) this.sources.delete(this.sources.keys().next().value);
    try { return await task; } catch (error) { this.sources.delete(note.path); throw error; }
  }
  async load(id, title, notePath) {
    if (!/^[a-z0-9-]+$/.test(id)) throw new Error('Identificador de revisão inválido.');
    if (this.decks.has(id)) return this.decks.get(id);
    if (this.loading.has(id)) return this.loading.get(id);
    const task = (async () => {
      const path = `${REVIEW_ROOT}/${id}.json`, adapter = this.plugin.app.vault.adapter;
      const exists = await adapter.exists(path);
      const deck = exists ? validateReviewDeck(JSON.parse(await adapter.read(path)), id) : { version: 1, id, title, notePath, engine: 'ts-fsrs@5.4.2', retention: .9, records: {} };
      const state = { deck, path, generation: 0, saved: 0, timer: null, writing: null, error: null, refs: 0, lastUsed: Date.now() };
      this.decks.set(id, state); return state;
    })();
    this.loading.set(id, task);
    try { return await task; } finally { this.loading.delete(id); }
  }
  async attach(id, cards, title, notePath, full = true) {
    const state = await this.load(id, title, notePath), deck = state.deck, used = new Set(); let changed = deck.notePath !== notePath || deck.title !== title;
    deck.notePath = notePath; deck.title = title;
    const old = Object.values(deck.records), exact = new Map(), question = new Map(), source = new Map();
    const add = (map, key, record) => { if (!map.has(key)) map.set(key, []); map.get(key).push(record); };
    const normalize = text => text.normalize('NFC').replace(/\s+/g, ' ').trim();
    for (const record of old) { add(exact, normalize(record.question) + '\0' + normalize(record.answer), record); add(question, normalize(record.question), record); if (record.sourceId) add(source, record.sourceId, record); }
    const take = list => list?.find(record => !used.has(record.id));
    const entries = cards.map(card => {
      const sourceId = card.stableSourceId || (String(card.id).startsWith('legacy:') ? card.id : null);
      let record = sourceId && take(source.get(sourceId)) || take(exact.get(normalize(card.question) + '\0' + normalize(card.answer))) || take(question.get(normalize(card.question)));
      if (!record) { record = { id: uid(), question: card.question, answer: card.answer, sourceId, revision: 0, schedule: null, needsReview: false, lastRating: null, active: true, history: [] }; deck.records[record.id] = record; changed = true; }
      if (record.question !== card.question || record.answer !== card.answer || !record.active) changed = true;
      record.question = card.question; record.answer = card.answer; record.active = true; used.add(record.id);
      return { ...card, sourceCardId: card.id, id: `${id}:${record.id}`, deckId: id, recordId: record.id, record, sourcePath: card.sourcePath || notePath };
    });
    if (full) for (const record of old) if (!used.has(record.id) && record.active) { record.active = false; changed = true; }
    if (changed) this.touch(state);
    return entries;
  }
  touch(state) {
    state.generation++; if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(() => { state.timer = null; this.flush(state).catch(() => {}); }, 150);
    this.emit();
  }
  emit() { for (const fn of this.listeners) fn(); }
  async flush(state) {
    if (!state) { await Promise.all([...this.decks.values()].map(value => this.flush(value))); return; }
    if (state.timer) { clearTimeout(state.timer); state.timer = null; }
    if (state.writing) return state.writing;
    if (state.saved === state.generation) return;
    const task = (async () => {
      try {
        await this.plugin.folder(REVIEW_ROOT);
        while (state.saved !== state.generation) {
          const generation = state.generation, data = JSON.stringify(state.deck);
          await this.plugin.app.vault.adapter.write(state.path, data); state.saved = generation;
        }
        state.error = null;
      } catch (error) { state.error = error; throw error; }
      finally { state.writing = null; this.emit(); }
    })(); state.writing = task; return task;
  }
  prune() {
    const unused = [...this.decks.entries()].filter(([, state]) => !state.refs && !state.writing && !state.timer && state.saved === state.generation).sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    while (this.decks.size > 24 && unused.length) this.decks.delete(unused.shift()[0]);
  }
  initialGood(record, result, now) {
    if (!record.schedule?.reps) {
      result.card.state = FSRS_ENGINE.State.Review; result.card.learning_steps = 0;
      result.card.scheduled_days = 1; result.card.due = new Date(now.getTime() + 86400000);
    }
    return result;
  }
  preview(entry, now = new Date()) {
    const results = this.scheduler.repeat(fsrsCard(entry.record, now), now);
    this.initialGood(entry.record, results[FSRS_ENGINE.Rating.Good], now); return results;
  }
  async resetAsNew(candidates) {
    const unique = [...new Map(candidates.map(value => [value.entry.id, value])).values()];
    const states = [...new Set(unique.map(value => this.decks.get(value.entry.deckId)))];
    if (states.some(state => !state)) throw new Error('Atualize os temas antes de resetar.');
    await Promise.all(states.map(state => this.flush(state)));
    // Retrying a failed disk write must persist the same reset, not archive twice.
    const resetIdBefore = unique[0]?.entry.record.resets?.slice(-1)[0]?.id;
    if (resetIdBefore && unique.every(({ entry, expected }) => entry.record.revision === expected + 1 && !entry.record.schedule && !entry.record.history.length && entry.record.resets?.slice(-1)[0]?.id === resetIdBefore)) return unique.length;
    if (unique.some(({ entry, expected }) => entry.record.revision !== expected)) throw new Error('Alguns cartões mudaram em outra sessão. Atualize os temas antes de resetar.');
    const at = new Date().toISOString(), resetId = uid();
    for (const { entry } of unique) {
      const record = entry.record;
      record.resets ||= [];
      record.resets.push({ id: resetId, at, schedule: clone(record.schedule), history: clone(record.history), needsReview: record.needsReview, lastRating: record.lastRating });
      record.schedule = null; record.history = []; record.needsReview = false; record.lastRating = null; record.revision++;
    }
    for (const state of states) this.touch(state);
    await Promise.all(states.map(state => this.flush(state)));
    return unique.length;
  }
  rate(entry, rating, expected, now = new Date()) {
    const record = entry.record;
    if (record.revision !== expected) throw new Error('Este cartão foi avaliado em outra aba. Clique em Atualizar para carregar o agendamento atual.');
    const before = { schedule: clone(record.schedule), needsReview: record.needsReview, lastRating: record.lastRating };
    const result = this.scheduler.next(fsrsCard(record, now), now, rating);
    if (rating === FSRS_ENGINE.Rating.Good) this.initialGood(record, result, now);
    const event = { id: uid(), at: now.toISOString(), rating, before, after: clone(result.card), log: clone(result.log), undone: false };
    record.schedule = clone(result.card); record.needsReview = rating === FSRS_ENGINE.Rating.Again; record.lastRating = rating; record.revision++; record.history.push(event);
    this.touch(this.decks.get(entry.deckId)); return event;
  }
  undo(entry, event) {
    const record = entry.record, last = [...record.history].reverse().find(item => !item.undone);
    if (!last || last.id !== event.id || JSON.stringify(record.schedule) !== JSON.stringify(event.after)) throw new Error('O cartão já recebeu outra avaliação. Atualize a sessão antes de alterá-lo.');
    record.schedule = clone(event.before.schedule); record.needsReview = event.before.needsReview; record.lastRating = event.before.lastRating; record.revision++; event.undone = true; event.undoneAt = new Date().toISOString();
    this.touch(this.decks.get(entry.deckId));
  }
}
function initializeReviewSurface(surface, plugin) {
  Object.assign(surface, { plugin, spec: {}, entries: [], queue: [], position: 0, cache: new Map(), renderToken: 0, mode: 'due', cacheLimit: 6, alive: true });
}
class FlashcardReviewView extends (ItemView || TextFileView) {
  constructor(leaf, plugin) { super(leaf); initializeReviewSurface(this, plugin); }
  getViewType() { return REVIEW_VIEW; }
  getDisplayText() { return `Flashcards · ${this.spec.title || 'Revisão'}`; }
  getIcon() { return 'layers'; }
  getState() { return this.spec; }
  async setState(state, result) { this.spec = { ...state }; this.build(); await this.load(); if (super.setState) await super.setState(state, result); }
  async onOpen() { this.build(); }
  button(parent, title, icon, run) { return AtlasView.prototype.button.call(this, parent, title, icon, run); }
  build() {
    if (this.host) return;
    this.contentEl.empty(); this.contentEl.addClass('ia-fsrs-view'); this.host = this.contentEl.createDiv({ cls: 'ia-fsrs-layout' });
    const head = this.host.createDiv({ cls: 'ia-fsrs-heading' });
    const title = head.createDiv(); title.createDiv({ cls: 'ia-eyebrow', text: 'FLASHCARDS · REVISÃO ESPAÇADA' }); this.title = title.createEl('h2', { text: this.spec.title || 'Flashcards' });
    const actions = head.createDiv({ cls: 'ia-fsrs-actions' }); this.actions = actions;
    this.chooseTopicButton = this.button(actions, 'Escolher tema', 'list', () => new WhiteboardStudyPicker(this.plugin, this.spec.boardPath, this.popup?.origin || this.plugin.flashcardContext()).open()); this.chooseTopicButton.hidden = !this.spec.boardNotesOnly;
    this.button(actions, 'Abrir nota', 'file-text', () => this.openSummary());
    this.button(actions, 'Editar cartões', 'square-pen', () => this.editCurrent());
    this.button(actions, 'Adicionar flashcards', 'plus', () => this.addCards());
    this.button(actions, 'Atualizar', 'refresh-cw', () => this.load());
    this.button(actions, 'Revisões de hoje', 'calendar-check', () => this.popup?.controller === this ? this.popup.changeDeck({ library: true, title: 'Revisões de hoje' }) : this.plugin.openReviewTab({ library: true, title: 'Revisões de hoje' }));
    this.counters = this.host.createDiv({ cls: 'ia-fsrs-counters' });
    const filters = this.host.createDiv({ cls: 'ia-fsrs-filters' }); this.filters = {};
    for (const [mode, label] of [['due', 'Vencidos e novos'], ['errors', 'Errei'], ['all', 'Todos']]) this.filters[mode] = this.button(filters, label, mode === 'errors' ? 'rotate-ccw' : 'layers', () => this.start(mode));
    if (this.spec.boardNotesOnly) { this.filters.errors.hidden = true; this.filters.all.hidden = true; }
    this.resetButton = this.button(filters, 'Resetar progresso', 'list-restart', () => this.start('all'));
    this.resetButton.title = 'Recomeçar a sessão com todos os cartões desta nota, em ordem. O histórico FSRS é preservado.'; this.resetButton.hidden = true;
    this.hint = this.host.createDiv({ cls: 'ia-muted ia-fsrs-hint' });
    const progress = this.host.createDiv({ cls: 'ia-review-progress' }); this.progress = progress.createDiv();
    const nav = this.host.createDiv({ cls: 'ia-fsrs-navigation' });
    this.previous = this.button(nav, 'Questão anterior', 'arrow-left', () => this.move(-1)); this.number = nav.createSpan(); this.next = this.button(nav, 'Próxima questão', 'arrow-right', () => this.move(1));
    this.mount = this.host.createDiv({ cls: 'ia-fsrs-mount' });
    this.gradeHost = this.host.createDiv({ cls: 'ia-fsrs-grade-host' });
    this.revealButton = this.button(this.gradeHost, 'Mostrar resposta · Ctrl+Enter', 'eye', () => this.reveal()); this.revealButton.addClass('mod-cta');
    this.grades = this.gradeHost.createDiv({ cls: 'ia-fsrs-grades' }); this.gradeButtons = {};
    for (const rating of [1, 3]) {
      const button = this.button(this.grades, '', '', () => this.grade(rating)); button.addClass(`ia-fsrs-rating-${rating}`);
      const name = button.createSpan({ text: `${rating === 1 ? 1 : 2}. ${RATING_LABELS[rating]}` }), interval = button.createSpan({ cls: 'ia-fsrs-interval' }); this.gradeButtons[rating] = { button, name, interval };
    }
    this.assessed = this.gradeHost.createDiv({ cls: 'ia-fsrs-assessed' }); this.assessedText = this.assessed.createSpan(); this.button(this.assessed, 'Desfazer esta avaliação', 'undo', () => this.undoGrade());
    this.status = this.host.createDiv({ cls: 'ia-fsrs-status', attr: { role: 'status', 'aria-live': 'polite' } });
    this.reviewKeydown = event => this.handleReviewKey(event);
    this.contentEl.addEventListener('keydown', this.reviewKeydown, true);
    this.bindNoteLinks();
    this.app.reviewInteractions?.install(this);
    this.app.romusUI?.review(this);
    this.scope?.register(['Mod'], 'Enter', event => { (this.popup?.focusedReview?.() || this).handleReviewKey(event); return false; });
    this.store = this.plugin.getReviewStore(); this.onStore = () => { this.updateStats(); this.updateSaveStatus(); }; this.store.listeners.add(this.onStore);
    this.gradeHost.hidden = true;
  }
  addCards() {
    const path = this.note?.path || this.spec.notePath || this.current()?.entry.sourcePath;
    const file = path && this.app.vault.getFileByPath(path);
    if (file?.extension !== 'md') { new Notice('Selecione uma questão de uma nota para adicionar flashcards.'); return; }
    new NoteFlashcardEditor(this.plugin.flashcardContext(), file, {
      paste: true,
      onSaved: async () => { if (this.alive) await this.load({ preserveSession: true }); },
      resumeReview: true
    }).open();
  }
  editCurrent() {
    const item = this.current(), entry = item?.entry, file = entry?.sourcePath && this.app.vault.getFileByPath(entry.sourcePath);
    if (!entry || file?.extension !== 'md') { new Notice('Selecione uma questão de uma nota para editar.'); return; }
    new NoteFlashcardEditor(this.plugin.flashcardContext(), file, {
      card: entry,
      onWritten: card => {
        // Content changes keep the existing FSRS schedule and review history.
        entry.record.question = card.question; entry.record.answer = card.answer;
        for (const value of this.entries) if (value.id === entry.id) { value.question = card.question; value.answer = card.answer; }
        this.store.touch(this.store.decks.get(entry.deckId));
      },
      onSaved: async () => {
        if (!this.alive) return;
        const panel = this.cache.get(entry.id); if (panel) { panel.component.unload(); panel.el.remove(); this.cache.delete(entry.id); }
        for (const queued of this.queue) if (queued.entry.id === entry.id) { queued.entry.question = entry.record.question; queued.entry.answer = entry.record.answer; }
        await this.show();
      }
    }).open();
  }
  bindNoteLinks() {
    const win = this.contentEl.ownerDocument.defaultView;
    this.linkPointer = event => {
      if (this.notePreview?.contains(event.target)) return;
      const link = event.target?.closest?.('a.internal-link');
      if (!link || !this.mount.contains(link)) { this.linkHover = this.linkHoverShown = null; this.closeNotePreview(); return; }
      this.linkHover = { link, x: event.clientX, y: event.clientY };
      if (!event.ctrlKey && !event.metaKey) { this.linkHoverShown = null; return; }
      this.previewNoteLink(event, link);
    };
    this.linkModifier = event => {
      if (!this.alive || event.repeat || !['Control', 'Meta'].includes(event.key)) return;
      const point = this.linkHover;
      if (point?.link.isConnected && this.contentEl.ownerDocument.elementFromPoint(point.x, point.y)?.closest('a.internal-link') === point.link) this.previewNoteLink(new win.MouseEvent('mouseover', { ctrlKey: event.ctrlKey, metaKey: event.metaKey, clientX: point.x, clientY: point.y }), point.link);
    };
    this.linkKeyup = event => { if (['Control', 'Meta'].includes(event.key)) { this.linkHoverShown = null; this.closeNotePreview(); } };
    this.linkClick = event => {
      const link = event.target?.closest?.('a.internal-link'); if (!link || !this.mount.contains(link)) return;
      event.preventDefault(); event.stopPropagation();
      this.closeNotePreview();
      if (event.shiftKey) { event.stopImmediatePropagation(); this.studyLinkedNote(link).catch(error => new Notice(error.message)); return; }
      this.app.workspace.openLinkText(link.dataset.href || link.getAttribute('href'), link.closest('.ia-fsrs-card')?.dataset.sourcePath || '', Boolean(event.ctrlKey || event.metaKey));
    };
    this.contentEl.addEventListener('pointerover', this.linkPointer);
    this.contentEl.addEventListener('pointermove', this.linkPointer);
    this.linkLeave = () => { this.linkHover = this.linkHoverShown = null; this.closeNotePreview(); };
    this.contentEl.addEventListener('pointerleave', this.linkLeave);
    this.contentEl.addEventListener('click', this.linkClick, true);
    win.addEventListener('keydown', this.linkModifier, true); win.addEventListener('keyup', this.linkKeyup, true);
  }
  resolveLinkedNote(link) {
    const text = link.dataset.href || link.getAttribute('href') || '', sourcePath = link.closest('.ia-fsrs-card')?.dataset.sourcePath || '';
    let path = text.split('|')[0].split('#')[0];
    try { path = decodeURIComponent(path); } catch (_) {}
    return (path ? this.app.metadataCache?.getFirstLinkpathDest?.(path, sourcePath) : this.app.vault.getFileByPath(sourcePath)) || this.app.vault.getFileByPath(path) || this.app.vault.getFileByPath(`${path}.md`);
  }
  async studyLinkedNote(link) {
    if (this.openingLinkedStudy) return;
    const note = this.resolveLinkedNote(link);
    if (note?.extension !== 'md') { new Notice('Não foi possível encontrar a nota vinculada.'); return; }
    this.openingLinkedStudy = true;
    try {
      const cards = await this.plugin.readNoteFlashcards(note);
      if (!this.alive) return;
      if (!cards.length) { new Notice(`A nota ${note.basename} ainda não tem flashcards.`); return; }
      if (this.popup) await this.popup.openLinkedStudy(note);
      else await this.plugin.openReviewTab({ notePath: note.path, title: note.basename }, null, 'split');
    } finally { this.openingLinkedStudy = false; }
  }
  closeNotePreview(options = {}) {
    this.previewToken = (this.previewToken || 0) + 1;
    const component = this.notePreviewComponent; this.notePreviewComponent = null;
    if (!options.preserve) component?.unload();
    if (!options.preserve) this.notePreview?.remove(); this.notePreview = null;
    if (options.preserve) return () => component?.unload();
  }
  async previewNoteLink(event, link) {
    if (!this.alive || !this.mount.contains(link) || this.linkHoverShown === link) return;
    this.linkHoverShown = link;
    this.closeNotePreview();
    const note = this.resolveLinkedNote(link); if (note?.extension !== 'md') return;
    const token = this.previewToken, win = this.contentEl.ownerDocument.defaultView;
    const preview = this.notePreview = this.contentEl.createDiv({ cls: 'ia-review-note-preview', attr: { role: 'region', 'aria-label': `Prévia · ${note.basename}` } });
    preview.createDiv({ cls: 'ia-review-note-preview-title', text: note.basename });
    const body = preview.createDiv({ cls: 'ia-review-note-preview-body markdown-rendered', text: 'Carregando nota…' });
    preview.createDiv({ cls: 'ia-muted ia-review-note-preview-tip', text: 'Shift+clique no link para revisar os flashcards desta nota ao lado.' });
    this.app.wireEditableNotePreview?.(preview, note, options => this.notePreview === preview ? this.closeNotePreview(options) : undefined, link);
    const rect = link.getBoundingClientRect(), width = Math.min(420, win.innerWidth - 24), height = Math.min(360, win.innerHeight - 24);
    Object.assign(preview.style, { width: `${width}px`, maxHeight: `${height}px`, left: `${Math.max(12, Math.min(rect.left, win.innerWidth - width - 12))}px`, top: `${rect.top >= height + 8 ? rect.top - height - 8 : Math.max(12, Math.min(rect.bottom + 8, win.innerHeight - height - 12))}px` });
    const component = this.notePreviewComponent = new Component(); component.load();
    try {
      const raw = await this.app.vault.cachedRead?.(note) ?? await this.app.vault.read(note);
      if (!preview.isConnected || preview.dataset.editing) return;
      const text = raw.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '').replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '').replace(/<!-- image-atlas-visual:start -->[\s\S]*?<!-- image-atlas-visual:end -->/g, '');
      body.empty(); await MarkdownRenderer.render(this.app, text.slice(0, 24000) || 'Esta nota não contém texto.', body, note.path, component);
      if (text.length > 24000 && token === this.previewToken) body.createDiv({ cls: 'ia-muted', text: 'Prévia parcial. Clique no link para abrir a nota completa.' });
    } catch (error) { if (preview.isConnected && !preview.dataset.editing) body.textContent = `Não foi possível carregar a prévia: ${error.message}`; }
  }
  openSummary() {
    const path = this.spec.notePath || this.current()?.entry.sourcePath, file = path && this.app.vault.getFileByPath(path);
    if (!file) { new Notice('Selecione uma questão para abrir a nota.'); return; }
    if (this.popup) { this.popup.openNote(file, this); return; }
    this.app.workspace.getLeaf('split').openFile(file);
  }
  handleReviewKey(event) {
    if (this.inlineCardEditor?.active) return false;
    if (event.defaultPrevented || event.isComposing || !this.alive) return false;
    const enter = event.key === 'Enter' || event.code === 'NumpadEnter';
    if ((event.ctrlKey || event.metaKey) && enter) { event.preventDefault(); event.stopPropagation(); if (!event.repeat) this.reveal(); return true; }
    if (event.target?.closest?.('input,textarea,select,[contenteditable=true]') || event.ctrlKey || event.metaKey || event.altKey) return false;
    if (/^[12]$/.test(event.key) && this.current()?.revealed) { event.preventDefault(); event.stopPropagation(); if (!event.repeat) this.grade(event.key === '1' ? 1 : 3); return true; }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); event.stopPropagation(); this.move(event.key === 'ArrowLeft' ? -1 : 1); return true; }
    return false;
  }
  sessionSnapshot() {
    return { mode: this.mode, position: this.position, queue: this.queue.map(item => ({ id: item.entry.id, revealed: item.revealed, event: item.event, draft: item.draft, expected: item.expected })) };
  }
  restoreSession(snapshot) {
    if (this.spec.boardNotesOnly && snapshot.mode !== 'due') { this.start('due'); return; }
    const entries = new Map(this.entries.map(entry => [entry.id, entry]));
    this.mode = snapshot.mode; this.queue = snapshot.queue.filter(item => entries.has(item.id)).map(item => ({ ...item, entry: entries.get(item.id) })); this.position = Math.min(snapshot.position, this.queue.length);
    for (const [mode, button] of Object.entries(this.filters)) button.setAttribute('aria-pressed', String(mode === this.mode));
    this.clearCache(); this.show();
  }
  async load({ preserveSession = false } = {}) {
    const previous = preserveSession ? this.sessionSnapshot() : null;
    const loadToken = this.loadToken = (this.loadToken || 0) + 1; this.loadError = null; this.status.textContent = 'Carregando cartões…';
    try {
      const data = await this.plugin.loadReviewEntries(this.spec);
      if (!this.alive || loadToken !== this.loadToken) return;
      this.clearCache();
      const held = new Set(data.entries.map(entry => entry.deckId));
      for (const id of this.heldDecks || []) if (!held.has(id) && this.store.decks.has(id)) this.store.decks.get(id).refs--;
      for (const id of held) if (!this.heldDecks?.has(id)) { const state = this.store.decks.get(id); state.refs++; state.lastUsed = Date.now(); }
      this.heldDecks = held; this.store.prune(); this.entries = data.entries; this.spec.title = data.title; this.title.textContent = data.title; this.note = data.note; this.noteCount = data.noteCount;
      this.chooseTopicButton.hidden = !this.spec.boardNotesOnly; this.filters.errors.hidden = this.filters.all.hidden = Boolean(this.spec.boardNotesOnly);
      this.start(this.mode);
      if (previous) {
        const currentId = previous.queue[previous.position]?.id;
        const known = new Set(previous.queue.map(item => item.id));
        const additions = this.sessionSnapshot().queue.filter(item => !known.has(item.id));
        previous.queue.push(...additions);
        const entries = new Map(this.entries.map((entry, index) => [entry.id, { entry, index }]));
        const reorder = item => entries.has(item.id) && (previous.mode === 'all' || !entries.get(item.id).entry.record.schedule?.reps);
        const ordered = previous.queue.filter(reorder).sort((a, b) => entries.get(a.id).index - entries.get(b.id).index);
        let index = 0; previous.queue = previous.queue.map(item => reorder(item) ? ordered[index++] : item);
        if (currentId) previous.position = Math.max(0, previous.queue.findIndex(item => item.id === currentId));
        else if (additions.length) previous.position = previous.queue.findIndex(item => item.id === additions[0].id);
        this.restoreSession(previous);
      }
      const snapshot = this.plugin.reviewTransfers?.get(this.spec.transferId);
      if (snapshot) { this.plugin.reviewTransfers.delete(this.spec.transferId); this.restoreSession(snapshot); }
      this.updateSaveStatus();
    } catch (error) { if (this.alive && loadToken === this.loadToken) { this.loadError = error; this.clearCache(); this.gradeHost.hidden = true; this.mount.textContent = 'Não foi possível carregar esta revisão. O conteúdo original foi preservado.'; this.status.textContent = error.message; this.status.addClass('is-error'); } }
  }
  stats() {
    const now = Date.now(); return { new: this.entries.filter(e => !e.record.schedule || !e.record.schedule.reps).length, due: this.entries.filter(e => e.record.schedule?.reps && new Date(e.record.schedule.due).getTime() <= now).length, errors: this.entries.filter(e => e.record.needsReview).length };
  }
  updateStats() {
    if (!this.counters) return;
    const stats = this.stats(), startToday = new Date(); startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(startToday); endToday.setHours(23, 59, 59, 999);
    this.resetAvailable ||= Boolean(this.spec.notePath && this.entries.some(entry => {
      const card = entry.record.schedule;
      return card?.reps && (new Date(card.due).getTime() <= endToday.getTime() || new Date(card.last_review).getTime() >= startToday.getTime() && new Date(card.last_review).getTime() <= Date.now());
    }));
    this.counters.textContent = `${stats.due} vencidos · ${stats.new} novos · ${stats.errors} para rever · ${this.entries.length} no total`;
    if (this.spec.boardNotesOnly) this.counters.textContent += ` · ${this.noteCount || 0} notas neste quadro`;
    this.resetButton.hidden = !this.spec.notePath || !this.resetAvailable;
  }
  updateSaveStatus() {
    if (!this.status || !this.store || this.loadError) return;
    const states = [...new Set(this.entries.map(e => this.store.decks.get(e.deckId)))].filter(Boolean), failed = states.find(s => s.error), pending = states.some(s => s.saved !== s.generation);
    this.status.classList.toggle('is-error', Boolean(failed));
    this.status.textContent = failed ? `Não foi possível salvar as revisões: ${failed.error.message}. Clique em Tentar salvar.` : pending ? 'Salvando revisões…' : 'Revisões salvas · FSRS · Retenção desejada: 90%';
    if (failed && !this.retrySave?.isConnected) this.retrySave = this.button(this.host, 'Tentar salvar', 'save', () => this.store.flush().catch(error => new Notice(error.message)));
    else if (!failed) this.retrySave?.remove();
  }
  start(mode) {
    if (this.spec.boardNotesOnly) mode = 'due';
    this.mode = mode; const now = Date.now();
    this.queue = this.entries.filter(entry => mode === 'errors' ? entry.record.needsReview : mode === 'all' ? true : !entry.record.schedule || new Date(entry.record.schedule.due).getTime() <= now).map(entry => ({ entry, revealed: false, event: null, draft: '', expected: entry.record.revision }));
    if (mode === 'due') this.queue.sort((a, b) => Number(Boolean(!a.entry.record.schedule)) - Number(Boolean(!b.entry.record.schedule)) || new Date(a.entry.record.schedule?.due || now) - new Date(b.entry.record.schedule?.due || now));
    this.position = 0; this.clearCache(); for (const [key, button] of Object.entries(this.filters)) button.setAttribute('aria-pressed', String(key === mode));
    this.hint.textContent = mode === 'due' ? 'Vencidos primeiro, depois os novos. Errei e Acertei calculam a próxima revisão.' : 'Revisão antecipada: as avaliações também atualizam o agendamento FSRS.';
    if (this.spec.boardNotesOnly) this.hint.textContent += ' Somente notas deste whiteboard, incluindo mapas recolhidos. O histórico FSRS é o mesmo da revisão individual.';
    this.updateStats(); this.show();
  }
  current() { return this.queue[this.position]; }
  move(delta) { const target = this.position + delta; if (target < 0 || target > this.queue.length) return; this.position = target; this.show(); }
  async panel(item) {
    const key = item.entry.id; if (this.cache.has(key)) { const value = this.cache.get(key); this.cache.delete(key); this.cache.set(key, value); return value.ready; }
    const el = this.contentEl.ownerDocument.createElement('div'); el.className = 'ia-fsrs-card'; el.dataset.sourcePath = item.entry.sourcePath || '';
    const component = new Component(); component.load();
    const heading = el.createDiv({ cls: 'romus-flashcard-header' }); heading.createSpan({ cls: 'romus-flashcard-kind', text: 'FLASHCARD' }); const source = heading.createEl('h3', { cls: 'romus-flashcard-title', text: item.entry.nodeTitle || this.spec.title || 'Flashcards' });
    const failures = item.entry.record.history.filter(event => !event.undone && event.rating === 1).length;
    const history = el.createDiv({ cls: 'ia-fsrs-history', text: `${item.entry.record.schedule?.reps || 0} revisões · ${failures} erros anteriores` }); heading.append(history); const question = el.createDiv({ cls: 'ia-flash-question' });
    el.createEl('label', { cls: 'ia-response-label', text: 'Sua resposta (opcional)' });
    const input = el.createEl('textarea', { cls: 'ia-flash-response', attr: { rows: '3', 'aria-label': 'Sua resposta', placeholder: 'Tente recordar antes de revelar…' } }); input.value = item.draft; input.oninput = () => { value.item.draft = input.value; };
    const answerWrap = el.createDiv({ cls: 'ia-fsrs-answer-wrap' }); answerWrap.createDiv({ cls: 'ia-eyebrow', text: 'RESPOSTA' }); const answer = answerWrap.createDiv({ cls: 'ia-flash-answer' }); answerWrap.hidden = true;
    const value = { el, component, input, answerWrap, item, history };
    value.ready = Promise.all([MarkdownRenderer.render(this.app, item.entry.question, question, item.entry.sourcePath || '', component), MarkdownRenderer.render(this.app, item.entry.answer, answer, item.entry.sourcePath || '', component)]).then(() => {
      const links = el.querySelectorAll('a.internal-link');
      for (const link of links) link.title = 'Ctrl: prévia da nota · Shift+clique: revisar flashcards desta nota ao lado';
      if (links.length) answerWrap.createDiv({ cls: 'ia-muted ia-linked-note-hint', text: 'Links de notas: Ctrl para prévia · Shift+clique para estudar os flashcards ao lado.' });
      return value;
    }).catch(error => { question.textContent = item.entry.question; answer.textContent = item.entry.answer; return value; });
    this.cache.set(key, value);
    while (this.cache.size > this.cacheLimit) { const oldest = this.cache.keys().next().value; const removed = this.cache.get(oldest); this.cache.delete(oldest); removed.component.unload(); removed.el.remove(); }
    return value.ready;
  }
  async show() {
    this.contentEl.ownerDocument.defaultView.clearTimeout(this.dueTimer);
    if (this.mode === 'due' && this.position === this.queue.length) {
      const last = new Map(this.queue.map(item => [item.entry.id, item]));
      for (const entry of this.entries) if (entry.record.schedule?.reps && new Date(entry.record.schedule.due).getTime() <= Date.now() && (!last.has(entry.id) || last.get(entry.id).event)) this.queue.push({ entry, revealed: false, event: null, draft: '', expected: entry.record.revision });
    }
    const token = ++this.renderToken, item = this.current(); this.updateStats(); this.previous.disabled = this.position <= 0; this.next.disabled = this.position >= this.queue.length;
    this.closeNotePreview(); this.linkHover = this.linkHoverShown = null;
    this.progress.style.width = `${this.queue.length ? this.position / this.queue.length * 100 : 100}%`; this.number.textContent = this.queue.length ? `${Math.min(this.position + 1, this.queue.length)} de ${this.queue.length}` : 'Nenhum cartão nesta fila';
    if (!item) {
      this.gradeHost.hidden = true; this.mount.empty(); const end = this.mount.createDiv({ cls: 'ia-fsrs-finished' }); end.createEl('h2', { text: this.queue.length ? 'Sessão concluída' : 'Você está em dia' });
      const failures = this.entries.filter(e => e.record.needsReview).length;
      end.createEl('p', { text: `${failures} cartões marcados para rever. Os intervalos e os erros ficam salvos mesmo ao fechar a revisão.` });
      const future = this.entries.filter(e => e.record.schedule).map(e => new Date(e.record.schedule.due).getTime()).filter(t => t > Date.now()).sort((a, b) => a - b)[0];
      if (future) end.createEl('p', { text: `Próxima revisão: ${new Date(future).toLocaleString()}` });
      this.button(end, 'Atualizar vencidos', 'refresh-cw', () => this.start('due'));
      if (this.spec.boardNotesOnly) this.button(end, 'Escolher outro tema', 'list', () => new WhiteboardStudyPicker(this.plugin, this.spec.boardPath, this.popup?.origin || this.plugin.flashcardContext()).open());
      else {
        if (failures) this.button(end, 'Estudar os que errei', 'rotate-ccw', () => this.start('errors'));
        this.button(end, 'Estudar todos', 'layers', () => this.start('all'));
      }
      if (future && this.mode === 'due') this.dueTimer = this.contentEl.ownerDocument.defaultView.setTimeout(() => {
        if (this.alive && !this.current()) { if (this.stats().due) this.start('due'); else this.show(); }
      }, Math.max(1000, Math.min(60000, future - Date.now())));
      return;
    }
    const cached = this.cache.get(item.entry.id); if (!cached) { this.gradeHost.hidden = true; this.mount.textContent = 'Preparando cartão…'; }
    const panel = await this.panel(item); if (!this.alive || token !== this.renderToken) return;
    panel.item = item; panel.input.value = item.draft;
    panel.history.textContent = `${item.entry.record.schedule?.reps || 0} revisões · ${item.entry.record.history.filter(event => !event.undone && event.rating === 1).length} erros anteriores`; this.mount.replaceChildren(panel.el); panel.answerWrap.hidden = !item.revealed; this.gradeHost.hidden = false;
    this.updateGradeControls(item);
    if (!item.revealed && !this.contentEl.ownerDocument.defaultView.matchMedia('(max-width: 600px)').matches) panel.input.focus({ preventScroll: true });
    const win = this.contentEl.ownerDocument.defaultView; if (this.prefetch) win.clearTimeout(this.prefetch);
    this.prefetch = win.setTimeout(() => { if (this.alive && token === this.renderToken && this.queue[this.position + 1]) this.panel(this.queue[this.position + 1]); }, 25);
  }
  updateGradeControls(item) {
    this.revealButton.hidden = item.revealed; this.grades.hidden = !item.revealed || Boolean(item.event); this.assessed.hidden = !item.event;
    if (item.event) { this.assessedText.textContent = `Avaliado: ${RATING_LABELS[item.event.rating]} · Próxima revisão: ${new Date(item.event.after.due).toLocaleString()}`; return; }
    if (!item.revealed) return;
    item.preview = this.store.preview(item.entry);
    for (const rating of [1, 3]) { this.gradeButtons[rating].interval.textContent = intervalLabel(item.preview[rating].card.due); this.gradeButtons[rating].button.disabled = false; }
  }
  reveal() {
    const item = this.current(), panel = item && this.cache.get(item.entry.id); if (!item || !panel) return;
    item.revealed = true; panel.answerWrap.hidden = false; this.updateGradeControls(item); this.gradeButtons[3].button.focus();
  }
  grade(rating) {
    const item = this.current(); if (!item || !item.revealed || item.event || ![1, 3].includes(rating)) return;
    try { item.event = this.store.rate(item.entry, rating, item.expected); this.position++; this.show(); }
    catch (error) { new Notice(error.message); }
  }
  undoGrade() {
    const item = this.current(); if (!item?.event) return;
    try { this.store.undo(item.entry, item.event); item.event = null; item.expected = item.entry.record.revision; item.preview = null; this.updateGradeControls(item); }
    catch (error) { new Notice(error.message); }
  }
  clearCache() { this.renderToken++; for (const value of this.cache.values()) { value.component.unload(); value.el.remove(); } this.cache.clear(); }
  async onClose() {
    this.closeNotePreview(); this.contentEl.removeEventListener('pointerover', this.linkPointer); this.contentEl.removeEventListener('pointermove', this.linkPointer); this.contentEl.removeEventListener('pointerleave', this.linkLeave); this.contentEl.removeEventListener('click', this.linkClick, true);
    this.contentEl.ownerDocument.defaultView.removeEventListener('keydown', this.linkModifier, true); this.contentEl.ownerDocument.defaultView.removeEventListener('keyup', this.linkKeyup, true); this.linkHover = this.linkHoverShown = null;
    this.alive = false; this.loadToken++; this.renderToken++; this.contentEl.onkeydown = null; this.contentEl.removeEventListener('keydown', this.reviewKeydown, true); this.contentEl.ownerDocument.defaultView.clearTimeout(this.prefetch); this.contentEl.ownerDocument.defaultView.clearTimeout(this.dueTimer); this.clearCache(); this.store?.listeners.delete(this.onStore);
    try { await this.store?.flush(); } catch (error) { new Notice(`As revisões ainda não foram salvas: ${error.message}`); }
    for (const id of this.heldDecks || []) if (this.store?.decks.has(id)) this.store.decks.get(id).refs--;
    this.store?.prune(); this.contentEl.empty();
  }
}

/** Default surface: same fast FSRS controller inside a native Obsidian modal. */
class FSRSReviewPopup extends Modal {
  constructor(plugin, spec, origin) { super(plugin.app); this.plugin = plugin; this.spec = spec; this.origin = origin; }
  async onOpen() {
    this.modalEl.addClass('ia-fsrs-modal'); this.setTitle(`Flashcards · ${this.spec.title || 'Revisão'}`);
    const win = this.contentEl.ownerDocument.defaultView;
    this.options = this.contentEl.createEl('details', { cls: 'ia-review-window-options' }); this.options.open = !win.matchMedia('(max-width: 600px)').matches;
    const toggle = this.options.createEl('summary', { cls: 'ia-review-controls-toggle', text: 'Mostrar controles' });
    this.options.ontoggle = () => { toggle.textContent = this.options.open ? 'Ocultar controles' : 'Mostrar controles'; };
    const options = this.options.createDiv({ cls: 'ia-review-options-body' });
    this.fullscreen = AtlasView.prototype.button.call(this, options, 'Tela cheia', 'maximize', () => {
      const full = this.modalEl.classList.toggle('is-fullscreen'); this.fullscreen.setAttribute('aria-pressed', String(full)); this.fullscreen.setAttribute('aria-label', full ? 'Sair da tela cheia' : 'Tela cheia'); this.fullscreen.querySelector('span:last-child').textContent = full ? 'Sair da tela cheia' : 'Tela cheia';
    }); this.fullscreen.setAttribute('aria-pressed', 'false');
    AtlasView.prototype.button.call(this, options, 'Abrir em aba', 'panel-top', () => this.openTab());
    this.panes = this.contentEl.createDiv({ cls: 'ia-review-panes' });
    this.surfaceEl = this.panes.createDiv({ cls: 'ia-fsrs-popup-surface' });
    const controller = Object.create(FlashcardReviewView.prototype);
    Object.defineProperties(controller, { app: { value: this.app }, contentEl: { value: this.surfaceEl }, scope: { value: this.scope } });
    initializeReviewSurface(controller, this.plugin); controller.popup = this; controller.spec = { ...this.spec }; this.controller = controller;
    controller.build(); options.append(controller.actions); this.bindMobileLayout(); await controller.load();
  }
  bindMobileLayout() {
    const win = this.contentEl.ownerDocument.defaultView, viewport = win.visualViewport;
    this.mobileFrame = null;
    this.mobileLayout = () => {
      if (this.mobileFrame !== null) return;
      this.mobileFrame = win.requestAnimationFrame(() => {
        this.mobileFrame = null;
        const mobile = win.matchMedia('(max-width: 600px)').matches;
        if (this.wasMobile !== mobile) { this.options.open = !mobile; this.wasMobile = mobile; }
        this.modalEl.classList.toggle('ia-review-mobile', mobile);
        if (!mobile) { this.modalEl.classList.remove('is-mobile-typing'); return; }
        const top = viewport?.offsetTop || 0, height = viewport?.height || win.innerHeight;
        this.modalEl.style.setProperty('--ia-review-visible-height', `${height}px`);
        this.modalEl.style.setProperty('--ia-review-visible-top', `${top}px`);
        const active = this.contentEl.ownerDocument.activeElement;
        const typing = this.contentEl.contains(active) && active?.matches('textarea,input:not([type=button])');
        this.modalEl.classList.toggle('is-mobile-typing', Boolean(typing));
        if (!typing) return;
        this.options.open = false;
        const field = active.getBoundingClientRect(), content = this.contentEl.getBoundingClientRect();
        const bottom = Math.min(content.bottom, top + height - 12), start = Math.max(content.top, top + 8) + 8;
        if (field.height > bottom - start || field.top < start) this.contentEl.scrollTop += field.top - start;
        else if (field.bottom > bottom) this.contentEl.scrollTop += field.bottom - bottom + 8;
      });
    };
    this.mobileFocus = () => this.mobileLayout();
    viewport?.addEventListener('resize', this.mobileLayout); viewport?.addEventListener('scroll', this.mobileLayout);
    win.addEventListener('resize', this.mobileLayout); this.contentEl.addEventListener('focusin', this.mobileFocus); this.contentEl.addEventListener('focusout', this.mobileFocus);
    this.mobileLayout();
  }
  focusedReview() {
    return this.linkedController?.contentEl.contains(this.contentEl.ownerDocument.activeElement) ? this.linkedController : this.controller;
  }
  async openLinkedStudy(note) {
    if (!this.controller?.alive) return;
    if (this.linkedController?.spec.notePath === note.path) { this.linkedController.contentEl.querySelector('textarea,button')?.focus(); return; }
    this.closeLinkedStudy(); this.modalEl.addClass('has-linked-study'); this.contentEl.scrollTop = 0;
    this.linkedPane = this.panes.createDiv({ cls: 'ia-linked-study-pane' });
    const header = this.linkedPane.createDiv({ cls: 'ia-linked-study-header' });
    header.createEl('h3', { text: `Flashcards · ${note.basename}` });
    AtlasView.prototype.button.call(this, header, 'Fechar revisão ao lado', 'x', () => this.closeLinkedStudy());
    const surface = this.linkedPane.createDiv({ cls: 'ia-fsrs-popup-surface ia-linked-study-surface' });
    const controller = Object.create(FlashcardReviewView.prototype);
    Object.defineProperties(controller, { app: { value: this.app }, contentEl: { value: surface } });
    initializeReviewSurface(controller, this.plugin); controller.popup = this; controller.spec = { notePath: note.path, title: note.basename }; this.linkedController = controller;
    controller.build(); const actions = this.linkedPane.createDiv({ cls: 'ia-linked-study-actions' }); actions.append(controller.actions); this.linkedPane.insertBefore(actions, surface);
    await controller.load();
    if (controller.alive && !surface.ownerDocument.defaultView.matchMedia('(max-width: 600px)').matches) surface.querySelector('textarea,button')?.focus({ preventScroll: true });
  }
  closeLinkedStudy() {
    this.linkedController?.onClose(); this.linkedController = null;
    this.linkedPane?.remove(); this.linkedPane = null; this.modalEl.classList.remove('has-linked-study');
  }
  async changeDeck(spec) { this.spec = spec; this.setTitle(`Flashcards · ${spec.title}`); this.controller.spec = { ...spec }; await this.controller.load(); }
  async openNote(file, review = this.controller) {
    if (this.switching) return; this.switching = true;
    try {
      await this.plugin.openReviewTab(review.spec, review.sessionSnapshot()); this.close();
      await this.app.workspace.getLeaf('split').openFile(file);
    } catch (error) { new Notice(error.message); }
    finally { this.switching = false; }
  }
  async openTab() {
    if (this.switching || !this.controller?.entries.length) return;
    this.switching = true;
    try {
      const leaf = await this.plugin.openReviewTab(this.controller.spec, this.controller.sessionSnapshot()); this.close();
      const review = leaf.view; if (review?.current && !review.current()?.revealed && !review.contentEl.ownerDocument.defaultView.matchMedia('(max-width: 600px)').matches) review.cache.get(review.current()?.entry.id)?.input.focus({ preventScroll: true });
    } catch (error) { new Notice(error.message); }
    finally { this.switching = false; }
  }
  onClose() {
    const win = this.contentEl.ownerDocument.defaultView, viewport = win.visualViewport;
    viewport?.removeEventListener('resize', this.mobileLayout); viewport?.removeEventListener('scroll', this.mobileLayout); win.removeEventListener('resize', this.mobileLayout);
    this.contentEl.removeEventListener('focusin', this.mobileFocus); this.contentEl.removeEventListener('focusout', this.mobileFocus);
    if (this.mobileFrame !== null && this.mobileFrame !== undefined) win.cancelAnimationFrame(this.mobileFrame);
    this.mobileFrame = null;
    this.closeLinkedStudy();
    this.controller?.onClose();
    if (this.origin?.reviewModal === this) this.origin.reviewModal = null;
    if (this.plugin.activeReviewPopup === this) this.plugin.activeReviewPopup = null;
    if (this.origin?.viewport?.isConnected) this.origin.viewport.focus();
  }
}
// END ATLAS REVIEW SYSTEM

/** Registers the custom board format and keeps an owned Markdown index for backlinks. */
module.exports = class ImageAtlasPlugin extends Plugin {
  async onload() {
    this.whiteboardHistory = new Map();
    const settings = await this.loadData();
    this.pendingMindMoves = settings?.pendingMindMoves || [];
    this.noteRenames = settings?.noteRenames && typeof settings.noteRenames === 'object' && !Array.isArray(settings.noteRenames) ? settings.noteRenames : {};
    this.registerHoverLinkSource('image-atlas', { display: 'ROMUS', defaultMod: true });
    this.indexWrites = new Map();
    this.visualWrites = new Map();
    this.retired = false; this.register(() => { this.retired = true; this.activeReader?.close(); this.activeReviewPopup?.close(); });
    this.registerView(VIEW, leaf => new AtlasView(leaf, this));
    this.registerView(REVIEW_VIEW, leaf => new FlashcardReviewView(leaf, this));
    this.register(() => { this.reviewStore?.flush().catch(error => new Notice(`Revisões pendentes: ${error.message}`)); });
    this.registerExtensions(['imageboard'], VIEW);
    this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
      if (file.extension !== 'md') return;
      this.noteRenames[oldPath] = file.path;
      this.boardSearchCache?.clear();
      // Only remember the renamed path. Closed boards and embedded note scenes
      // repair references lazily instead of scanning the vault during a rename.
      this.noteRenameWrite = (this.noteRenameWrite || Promise.resolve()).catch(() => {}).then(async () => {
        const state = await this.loadData(); await this.saveData({ ...(state || {}), noteRenames: { ...this.noteRenames } });
      }).catch(error => new Notice(`Não foi possível salvar o novo vínculo da nota: ${error.message}`));
    }));
    this.registerEvent(this.app.vault.on('modify', file => {
      if (this.visualWrites.has(file.path)) return;
      if (file.extension === 'md') {
        if (this.app.workspace.getLeavesOfType(VIEW).some(leaf => leaf.view.board?.nodes.some(n => n.visualNote === file.path))) this.loadVisualNote(file).then(bundle => this.publishVisual(file.path, bundle, undefined, file.path)).catch(error => new Notice(`Não foi possível ler os dados visuais da nota: ${error.message}`));
        return;
      }
      if (file.extension !== 'imageboard') return;
      const views = this.app.workspace.getLeavesOfType(VIEW).map(leaf => leaf.view).filter(view => view.board?.nodes.some(n => n.visualSource === file.path));
      if (!views.length && !file.path.startsWith(`${ROOT}/Notas visuais/Dados/`)) return;
      this.app.vault.read(file).then(async raw => {
        const bundle = readVisualBundle(raw);
        this.publishVisual(file.path, bundle);
        const notePath = views.map(view => view.board.nodes.find(n => n.visualSource === file.path)?.visualNote).find(Boolean) || bundle.visualNotePath;
        if (notePath) await this.writeVisualMarkdown(notePath, file.path, bundle);
      }).catch(error => new Notice(`Não foi possível atualizar a nota visual: ${error.message}`));
    }));
    this.addRibbonIcon('map-pinned', 'ROMUS: abrir quadro', () => this.openBoard());
    this.addCommand({ id: 'edit-note-flashcards', name: 'Criar / editar flashcards da nota atual', checkCallback: checking => {
      const file = this.app.workspace.getActiveFile(); if (file?.extension !== 'md') return false;
      if (!checking) new NoteFlashcardEditor(this.flashcardContext(), file).open(); return true;
    } });
    this.addCommand({ id: 'review-today-fsrs', name: 'Revisões de hoje (FSRS)', callback: () => this.openReviewPopup({ library: true, title: 'Revisões de hoje' }).catch(error => new Notice(error.message)) });
    this.addCommand({ id: 'review-due-flashcards', name: 'Revisar flashcards de uma nota (FSRS)', callback: () => {
      new FilePicker(this.app, this.app.vault.getMarkdownFiles(), file => this.openNoteFlashcardReview(file).catch(error => new Notice(error.message)), 'Escolher nota para revisar com FSRS…').open();
    } });
    this.addCommand({ id: 'review-note-flashcards', name: 'Responder flashcards da nota atual', checkCallback: checking => {
      const file = this.app.workspace.getActiveFile(); if (file?.extension !== 'md') return false;
      if (!checking) this.openNoteFlashcardReview(file).catch(error => new Notice(error.message)); return true;
    } });
    this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
      if (file?.extension !== 'md') return;
      menu.addItem(item => item.setTitle('Criar / editar flashcards desta nota').setIcon('layers').onClick(() => new NoteFlashcardEditor(this.flashcardContext(), file).open()));
      menu.addItem(item => item.setTitle('Responder flashcards desta nota').setIcon('play').onClick(() => this.openNoteFlashcardReview(file).catch(error => new Notice(error.message))));
    }));
    this.addCommand({ id: 'open-board', name: 'Abrir quadro', callback: () => this.openBoard() });
    this.addCommand({ id: 'search-whiteboards', name: 'Buscar notas e mapas nos whiteboards', hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'O' }], callback: () => new AtlasBoardSearchModal(this).open() });
    this.addCommand({ id: 'new-board', name: 'Criar quadro', callback: () => this.newBoard() });
    this.addCommand({ id: 'open-demo', name: 'Abrir quadro de exemplo', callback: () => this.openDemo() });
    this.addCommand({ id: 'open-mind-demo', name: 'Abrir exemplo de mapa mental', callback: () => { const file = this.app.vault.getFileByPath(`${ROOT}/Mapa mental — demonstração.imageboard`); if (file) this.openFile(file); else new Notice('O arquivo de demonstração não foi encontrado.'); } });
    this.app.workspace.onLayoutReady(async () => {
      try {
        const state = await this.loadData();
        if (this.retired || state?.demoOpened) return;
        await this.openDemo();
        if (!this.retired) await this.saveData({ ...(state || {}), demoOpened: true });
      } catch (error) { if (!this.retired) new Notice(`Abra o exemplo pela paleta: ${error.message}`); }
    });
  }
  async readBoardFlashcardsForSearch(file) {
    const live = this.app.workspace.getLeavesOfType(VIEW).find(leaf => leaf.view.file?.path === file.path && !leaf.view.invalidData)?.view;
    const board = live?.board || parseBoard(await this.app.vault.read(file));
    const ownership = new Map();
    for (const root of board.nodes.filter(node => node.visualSource)) for (const member of reusableNodes(board, root)) ownership.set(member.id, root);
    const seen = new Set(), cards = [];
    for (const node of board.nodes) for (const card of node.flashcards || []) {
      const owner = ownership.get(node.id), notePath = owner?.visualNote || (node.path?.endsWith('.md') ? node.path : null);
      if (notePath || seen.has(card.id)) continue; seen.add(card.id);
      cards.push({ ...card, order: cards.length, nodeTitle: node.title, answer: card.answerSource === 'children' ? board.nodes.filter(child => child.parentId === node.id).map(child => child.title).join('\n') : card.answer });
    }
    return { title: board.title || file.basename, summaryNote: board.summaryNote, cards };
  }
  reviewSourceTools() { return { parseNoteFlashcards, serializeFlashcardRows, parseBoard, readVisualBundle }; }
  createFlashcardEditor(note, options = {}) { return new NoteFlashcardEditor(this.flashcardContext(), note, options); }
  editMediaFlashcards(note) { new NoteFlashcardEditor(this.flashcardContext(), note).open(); }
  flashcardContext() { return { app: this.app, plugin: this, button: AtlasView.prototype.button }; }
  async readNoteFlashcards(note, options = {}) {
    await this.visualWrites?.get(note.path);
    const text = await this.app.vault.read(note), cards = parseNoteFlashcards(text, note.path).cards;
    // Preserve review access to existing visual flashcards without including linked notes' decks.
    const header = text.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1], fm = header ? parseYaml(header) : {};
    if (fm?.['image-atlas-data']) {
      const data = fm['image-atlas-data'], scene = readVisualBundle(typeof data === 'string' ? data : JSON.stringify(data));
      options.onScene?.(scene);
      const children = new Map(); for (const n of scene.nodes) if (n.type === 'mind' && n.parentId) { if (!children.has(n.parentId)) children.set(n.parentId, []); children.get(n.parentId).push(n); }
      for (const n of scene.nodes) if (n.id === scene.visualRoot || n.type === 'mind' && (!n.path || n.path === note.path)) for (const card of n.flashcards || []) cards.push({ ...card, id: `legacy:${card.id}`, answer: card.answerSource === 'children' ? (children.get(n.id) || []).map(n => n.title).join('\n') || 'Esta relação não possui mais filhos.' : card.answer, sourcePath: note.path });
    }
    return cards.map(card => ({ ...card, nodeTitle: note.basename }));
  }
  getReviewStore() { return this.reviewStore ||= new AtlasReviewStore(this); }
  async registerNoteDeck(note) {
    const cards = await this.readNoteFlashcards(note); if (!cards.length) return;
    const store = this.getReviewStore(), id = await store.noteSource(note);
    return store.attach(id, cards, note.basename, note.path);
  }
  async openReviewPopup(spec, origin = this.flashcardContext()) {
    this.activeReviewPopup?.close();
    const popup = new FSRSReviewPopup(this, spec, origin); this.activeReviewPopup = popup; origin.reviewModal = popup; popup.open(); return popup;
  }
  async openReviewTab(spec, snapshot, placement = 'tab') {
    if (snapshot) { this.reviewTransfers ||= new Map(); const transferId = uid(); this.reviewTransfers.set(transferId, snapshot); spec = { ...spec, transferId }; }
    const leaf = this.app.workspace.getLeaf(placement);
    try {
      await leaf.setViewState({ type: REVIEW_VIEW, state: spec, active: true });
      await this.app.workspace.revealLeaf(leaf); return leaf;
    } finally { if (spec.transferId) this.reviewTransfers?.delete(spec.transferId); }
  }
  async openNoteFlashcardReview(note, view = this.flashcardContext()) {
    const cards = await this.readNoteFlashcards(note);
    if (!cards.length) { new Notice('Esta nota ainda não tem flashcards. Escreva Pergunta == Resposta para começar.'); new NoteFlashcardEditor(view, note).open(); return; }
    return this.openReviewPopup({ notePath: note.path, title: note.basename }, view);
  }
  async loadReviewEntries(spec) {
    const store = this.getReviewStore();
    if (spec.boardNotesOnly && spec.boardThemePath) {
      const data = await this.loadReviewEntries({ notePath: spec.boardThemePath });
      return { ...data, noteCount: data.entries.length ? 1 : 0 };
    }
    if (spec.library) {
      const adapter = this.app.vault.adapter;
      if (!await adapter.exists(REVIEW_ROOT)) return { entries: [], title: 'Revisões de hoje', note: null };
      const listing = await adapter.list(REVIEW_ROOT), files = listing.files.filter(path => /\/[a-z0-9-]+\.json$/.test(path));
      const entries = []; let next = 0;
      await Promise.all(Array.from({ length: Math.min(4, files.length) }, async () => {
        while (next < files.length) {
          const path = files[next++], id = path.split('/').pop().replace(/\.json$/, ''), state = await store.load(id, '', '');
          const note = this.app.vault.getFileByPath(state.deck.notePath);
          if (note?.extension === 'imageboard') { const data = await this.loadReviewEntries({ boardPath: note.path }); entries.push(...data.entries); continue; }
          if (note?.extension !== 'md') continue;
          const cards = await this.readNoteFlashcards(note); entries.push(...await store.attach(id, cards, note.basename, note.path));
        }
      }));
      entries.sort((a, b) => a.sourcePath.localeCompare(b.sourcePath) || a.order - b.order);
      return { entries: [...new Map(entries.map(entry => [entry.id, entry])).values()], title: 'Revisões de hoje', note: null };
    }
    if (spec.notePath) {
      const note = this.app.vault.getFileByPath(spec.notePath); if (!note) throw new Error('Nota não encontrada.');
      const id = await store.noteSource(note), cards = await this.readNoteFlashcards(note);
      return { entries: await store.attach(id, cards, note.basename, note.path), title: note.basename, note };
    }
    const file = this.app.vault.getFileByPath(spec.boardPath); if (!file) throw new Error('Whiteboard não encontrado.');
    const live = this.app.workspace.getLeavesOfType?.(VIEW).find(leaf => leaf.view.file?.path === file.path && !leaf.view.invalidData)?.view;
    const board = live?.board || parseBoard(await this.app.vault.read(file));
    if (spec.boardNotesOnly) {
      const paths = whiteboardFlashcardNotes(board.nodes), visited = new Set(paths), byPath = new Map(), scenes = new Map();
      let next = 0;
      await Promise.all(Array.from({ length: Math.min(4, paths.length) }, async () => {
        while (next < paths.length) {
          const path = paths[next++], note = this.app.vault.getFileByPath(path);
          if (note?.extension !== 'md') continue;
          const cards = await this.readNoteFlashcards(note, { onScene: scene => {
            scenes.set(path, scene);
            // Folded note maps belong to this scope too. Never follow Markdown
            // links or another whiteboard; cycles and repeated occurrences stop here.
            for (const linked of whiteboardFlashcardNotes(scene.nodes)) if (!visited.has(linked)) { visited.add(linked); paths.push(linked); }
          } });
          if (!cards.length) continue;
          const id = await store.noteSource(note);
          byPath.set(path, await store.attach(id, cards, note.basename, note.path));
        }
      }));
      const addedPaths = whiteboardFlashcardNotes(board.nodes), added = new Set(addedPaths);
      for (let i = 0; i < addedPaths.length; i++) { const scene = scenes.get(addedPaths[i]); if (scene) for (const path of whiteboardFlashcardNotes(scene.nodes)) if (!added.has(path)) { added.add(path); addedPaths.push(path); } }
      const entries = [...new Map(addedPaths.flatMap(path => byPath.get(path) || []).map(entry => [entry.id, entry])).values()];
      const topicOrder = [], ordered = new Set(), stack = whiteboardFlashcardNotes(board.nodes, true).reverse();
      while (stack.length) { const path = stack.pop(); if (ordered.has(path)) continue; ordered.add(path); if (byPath.has(path)) topicOrder.push(path); const scene = scenes.get(path); if (scene) stack.push(...whiteboardFlashcardNotes(scene.nodes, true).reverse()); }
      return { entries, title: `Flashcards · ${board.title || file.basename}`, note: null, noteCount: byPath.size, topicOrder };
    }
    const nodes = board.nodes.filter(n => !spec.mapId || n.type === 'mind' && n.mapId === spec.mapId);
    const notes = new Set(nodes.map(n => noteFlashcardPath(n)).filter(Boolean));
    const roots = board.nodes.filter(n => n.visualSource), ownership = new Map();
    for (const root of roots) for (const member of reusableNodes(board, root)) ownership.set(member.id, root);
    const local = [], seen = new Set();
    for (const node of nodes) for (const card of node.flashcards || []) {
      const owner = ownership.get(node.id), path = owner?.visualNote || (node.path?.endsWith('.md') ? node.path : null);
      if (path) { notes.add(path); continue; }
      if (seen.has(card.id)) continue; seen.add(card.id);
      local.push({ ...card, stableSourceId: `board:${card.id}`, answer: card.answerSource === 'children' ? board.nodes.filter(n => n.parentId === node.id).map(n => n.title).join('\n') : card.answer, sourcePath: file.path, nodeTitle: node.title });
    }
    const entries = [];
    const paths = [...notes]; let index = 0;
    await Promise.all(Array.from({ length: Math.min(4, paths.length) }, async () => {
      while (index < paths.length) {
        const path = paths[index++], note = this.app.vault.getFileByPath(path); if (!note) continue;
        const cards = await this.readNoteFlashcards(note); if (!cards.length) continue;
        const id = await store.noteSource(note);
        entries.push(...await store.attach(id, cards, note.basename, note.path));
      }
    }));
    if (local.length) entries.push(...await store.attach(`board-${reviewHash(file.path)}`, local, board.title, file.path, false));
    const order = new Map(paths.map((path, i) => [path, i])); entries.sort((a, b) => (order.get(a.sourcePath) ?? paths.length) - (order.get(b.sourcePath) ?? paths.length) || a.order - b.order);
    return { entries, title: spec.title || board.title, note: null };
  }
  async visualSource(note) {
    const text = await this.app.vault.cachedRead(note);
    const header = text.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
    const fm = header ? parseYaml(header) : {};
    if (fm?.['image-atlas-data']) return note.path;
    const path = fm?.['image-atlas-source'];
    return typeof path === 'string' && path.endsWith('.imageboard') ? normalizePath(path) : null;
  }
  async storeVisualData(note, bundle, archive) {
    readVisualBundle(JSON.stringify(bundle));
    const image = bundle.nodes.find(n => n.id === bundle.visualRoot && n.type === 'image');
    await this.app.fileManager.processFrontMatter(note, fm => {
      fm['image-atlas-data'] = JSON.stringify(bundle);
      fm['image-atlas-version'] = 1;
      if (archive) fm['image-atlas-unlinked-image-backup'] = JSON.stringify(archive);
      if (image) fm['image-atlas-image'] = `[[${image.path}]]`;
      else delete fm['image-atlas-image'];
    });
  }
  async loadVisualNote(note) {
    const text = await this.app.vault.read(note), header = text.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
    const fm = header ? parseYaml(header) : {};
    const normalize = bundle => {
      const oldPath = bundle.visualNotePath;
      const renames = { ...this.noteRenames, ...(oldPath && oldPath !== note.path ? { [oldPath]: note.path } : {}) };
      bundle.visualNotePath = note.path;
      reconcileAtlasNoteNames(bundle, this.app.vault, renames, oldPath ? { file: note, oldPath } : null);
      return bundle;
    };
    if (fm?.['image-atlas-data']) return normalize(readVisualBundle(typeof fm['image-atlas-data'] === 'string' ? fm['image-atlas-data'] : JSON.stringify(fm['image-atlas-data'])));
    const source = fm?.['image-atlas-source'], file = typeof source === 'string' && this.app.vault.getFileByPath(source);
    if (!file) throw new Error('Esta nota ainda não possui dados visuais salvos nas propriedades.');
    const bundle = normalize(readVisualBundle(await this.app.vault.read(file)));
    bundle.visualNotePath = note.path; await this.storeVisualData(note, bundle); return bundle;
  }
  async writeVisualMarkdown(notePath, source, bundle) {
    const note = this.app.vault.getFileByPath(notePath); if (!note) return;
    const image = bundle.nodes.find(n => n.id === bundle.visualRoot), target = image.type === 'image' && this.app.vault.getFileByPath(image.path);
    const link = path => { const file = this.app.vault.getFileByPath(path); return file ? this.app.fileManager.generateMarkdownLink(file, notePath) : ''; };
    const lines = ['<!-- image-atlas-visual:start -->', '## Atlas visual', '', ...(target ? [`!${link(target.path)}`, ''] : []), 'Imagem, marcações, mapas e flashcards são carregados pelas propriedades desta nota no Image Atlas.', ''];
    const byId = new Map(bundle.nodes.map(n => [n.id, n])), children = new Map();
    for (const node of bundle.nodes) if (node.type === 'mind' && node.parentId) { if (!children.has(node.parentId)) children.set(node.parentId, []); children.get(node.parentId).push(node); }
    for (const pin of image.pins || (image.noteMaps?.length ? image.noteMaps.map(id => ({ label: byId.get(id)?.title || 'Mapa mental', mapRoot: id })) : [{ label: image.title, mapRoot: image.id }])) {
      lines.push(`### ${pin.label.replace(/[\r\n]/g, ' ')}`, '');
      if (pin.notePath && pin.notePath !== notePath) lines.push(link(pin.notePath), '');
      const root = byId.get(pin.mapRoot), stack = root ? [{ node: root, depth: 0 }] : [];
      while (stack.length) {
        const { node, depth } = stack.pop(), indent = '  '.repeat(Math.min(depth, 30));
        lines.push(`${indent}- ${node.title.replace(/[\r\n]/g, ' ')}${node.path && node.path !== notePath ? ` · ${link(node.path)}` : ''}`);
        if (node.body) for (const text of node.body.split(/\r?\n/)) lines.push(`${indent}  ${text}`);
        for (const card of node.flashcards || []) { lines.push(`${indent}  - Flashcard: ${card.question.replace(/[\r\n]/g, ' ')}`); const answer = card.answerSource === 'children' ? (children.get(node.id) || []).map(n => n.title).join('\n') : card.answer; for (const text of answer.split(/\r?\n/)) lines.push(`${indent}    ${text}`); }
        stack.push(...(children.get(node.id) || []).slice().reverse().map(child => ({ node: child, depth: depth + 1 })));
      }
      lines.push('');
    }
    lines.push('<!-- image-atlas-visual:end -->'); const block = lines.join('\n');
    await this.app.vault.process(note, text => {
      const pattern = /<!-- image-atlas-visual:start -->[\s\S]*?<!-- image-atlas-visual:end -->/;
      if (pattern.test(text)) return text.replace(pattern, () => block);
      if (text.includes('<!-- image-atlas-visual:')) throw new Error('Bloco visual incompleto na nota. O texto original foi preservado.');
      return `${text.trimEnd()}\n\n${block}\n`;
    });
  }
  saveVisualSource(source, notePath, bundle, origin, archive) {
    const originHash = visualContentHash(bundle);
    const originRoots = new Set((origin?.board.nodes || []).filter(node => (node.visualSource === source || node.visualNote === notePath) && visualContentHash(reusableBundle(origin.board, node)) === originHash).map(node => node.id));
    const previous = this.visualWrites.get(notePath) || Promise.resolve();
    const task = previous.catch(() => {}).then(async () => {
      readVisualBundle(JSON.stringify(bundle));
      const note = this.app.vault.getFileByPath(notePath); if (!note) throw new Error('Nota Markdown original não encontrada.');
      await this.storeVisualData(note, bundle, archive);
      const file = this.app.vault.getFileByPath(source);
      if (file?.extension === 'imageboard') await this.app.vault.modify(file, JSON.stringify(bundle, null, 2));
      await this.writeVisualMarkdown(notePath, source, bundle);
      this.publishVisual(source, bundle, origin, notePath, originRoots);
    });
    this.visualWrites.set(source, task); this.visualWrites.set(notePath, task);
    task.finally(() => { if (this.visualWrites.get(source) === task) this.visualWrites.delete(source); if (this.visualWrites.get(notePath) === task) this.visualWrites.delete(notePath); }).catch(() => {}); return task;
  }
  publishVisual(source, bundle, origin, notePath, originRoots) {
    const hash = visualContentHash(bundle);
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW)) {
      const view = leaf.view; if (!view.file || view.invalidData !== null) continue;
      let updated = false;
      for (const image of view.board.nodes.filter(n => n.visualSource === source || (notePath && n.visualNote === notePath))) {
        if (view.unlinkingImages?.has(image.id) || view.pendingImageAttachments?.has(image.id) || view.visualContentHashes?.get(image.id) === hash) continue;
        if (view === origin && originRoots?.has(image.id)) continue;
        // The editing occurrence already contains this content; do not replace live references.
        if (view === origin && visualContentHash(reusableBundle(view.board, image)) === hash) {
          view.visualContentHashes ||= new Map(); view.visualContentHashes.set(image.id, hash); continue;
        }
        try { view.applyVisualBundle(image.visualSource, image.visualNote, bundle, undefined, { root: image }); updated = true; }
        catch (error) { new Notice(`Quadro preservado ao atualizar nota visual: ${error.message}`); }
      }
      if (updated) { view.requestSave(); view.render(); }
    }
  }

  async folder(path) { const parts = normalizePath(path).split('/'); let current = ''; for (const part of parts) { current += (current ? '/' : '') + part; if (!this.app.vault.getAbstractFileByPath(current)) await this.app.vault.createFolder(current); } }
  unique(path) { const dot = path.lastIndexOf('.'), base = path.slice(0, dot), ext = path.slice(dot); let result = path, i = 2; while (this.app.vault.getAbstractFileByPath(result)) result = `${base} ${i++}${ext}`; return result; }
  async openFile(file) { const leaf = this.app.workspace.getLeaf('tab'); await leaf.openFile(file); if (leaf.view instanceof AtlasView) leaf.view.fit(); }
  async boardSearchIndex(force = false) {
    if (this.searchIndexTask && !force) return this.searchIndexTask;
    this.boardSearchCache ||= new Map(); if (force) this.boardSearchCache.clear();
    const task = (async () => {
      const files = this.app.vault.getFiles().filter(file => file.extension === 'imageboard' && !file.path.startsWith('.obsidian/') && !file.path.includes('/Notas visuais/Dados/'));
      const paths = new Set(files.map(file => file.path));
      for (const path of this.boardSearchCache.keys()) if (!paths.has(path)) this.boardSearchCache.delete(path);
      const live = new Map(this.app.workspace.getLeavesOfType(VIEW).filter(leaf => leaf.view.file && leaf.view.invalidData === null).map(leaf => [leaf.view.file.path, leaf.view.board]));
      let next = 0, boardCount = 0, skipped = 0; const rows = [];
      await Promise.all(Array.from({ length: Math.min(4, files.length) }, async () => {
        while (next < files.length) {
          const index = next++, file = files[index];
          try {
            let found;
            if (live.has(file.path)) found = atlasBoardSearchRows(live.get(file.path), file);
            else {
              const stamp = `${file.stat?.mtime}:${file.stat?.size}`, cached = this.boardSearchCache.get(file.path);
              if (cached?.stamp === stamp) found = cached.rows;
              else {
                const raw = await this.app.vault.read(file), board = JSON.parse(raw.replace(/^\uFEFF/, ''));
                if (!Array.isArray(board?.nodes)) throw new Error('Quadro inválido');
                reconcileAtlasNoteNames(board, this.app.vault, this.noteRenames);
                found = atlasBoardSearchRows(board, file); this.boardSearchCache.set(file.path, { stamp, rows: found });
              }
            }
            if (found.length) { boardCount++; for (const row of found) rows.push(row); }
          } catch (_) { skipped++; }
          if (index % 8 === 7) await new Promise(resolve => setTimeout(resolve, 0));
        }
      }));
      while (this.boardSearchCache.size > 120) this.boardSearchCache.delete(this.boardSearchCache.keys().next().value);
      return { rows, boardCount, skipped };
    })();
    this.searchIndexTask = task;
    try { return await task; } finally { if (this.searchIndexTask === task) this.searchIndexTask = null; }
  }
  async openBoardSearchResult(result) {
    const file = this.app.vault.getFileByPath(result.boardPath);
    if (file?.extension !== 'imageboard') throw new Error('Este whiteboard não existe mais. Atualize a busca.');
    let leaf = this.app.workspace.getLeavesOfType(VIEW).find(leaf => leaf.id === result.leafId && leaf.view.file?.path === file.path) || this.app.workspace.getLeavesOfType(VIEW).find(leaf => leaf.view.file?.path === file.path);
    if (!leaf) { leaf = this.app.workspace.getLeaf('tab'); await leaf.openFile(file); }
    await this.app.workspace.revealLeaf(leaf);
    const view = leaf.view;
    if (!(view instanceof AtlasView) || view.invalidData !== null) throw new Error('Não foi possível abrir este whiteboard.');
    if (!result.nodeId) { view.fit(); return; }
    const node = view.board.nodes.find(n => n.id === result.nodeId);
    if (!node) throw new Error('Este cartão foi movido ou removido. Atualize a busca.');
    const plan = atlasSearchRevealPlan(view.board, node);
    if (plan.changes.size) {
      view.checkpoint('board');
      for (const [target, values] of plan.changes) Object.assign(target, values);
      for (const map of plan.maps) view.layoutMind(map);
      view.changed(false, false);
    }
    view.mode = 'select'; view.multiSelection?.clear(); view.selectedGroup = null; view.selected = { node: node.id, ...(result.pinId && node.pins?.some(pin => pin.id === result.pinId) ? { pin: result.pinId } : {}) };
    view.board.camera.z = Math.min(1.25, Math.max(.7, view.board.camera.z));
    view.render();
    // Some mind roots are displayed by their note card or expanded image.
    const focus = view.noteMapOwners?.get(node.id) || (view.directVisualNodes?.has(node.id) && view.board.nodes.find(n => n.id === node.linkedVisualRoot)) || node;
    view.selected.node = focus.id; view.focusNode(focus); view.highlight(); view.showSelection(); view.viewport.focus({ preventScroll: true });
  }
  async openDemo() { const file = this.app.vault.getFileByPath(`${ROOT}/Primeiro atlas.imageboard`); if (file) await this.openFile(file); else await this.newBoard(); }
  async openBoard() {
    const files = this.app.vault.getFiles().filter(f => f.extension === 'imageboard');
    if (!files.length) { await this.newBoard(); return; }
    if (files.length === 1) { await this.openFile(files[0]); return; }
    new FilePicker(this.app, files, file => this.openFile(file), 'Escolher um quadro…').open();
  }
  async createBoardFile(name = 'Novo atlas') {
      await this.folder(ROOT);
      const path = this.unique(`${ROOT}/${namePart(name)}.imageboard`), title = path.split('/').pop().replace('.imageboard', '');
      const board = emptyBoard(title); board.indexPath = this.unique(`${ROOT}/${title} — Índice.md`);
      await this.app.vault.create(board.indexPath, `# ${title}\n\n[[${path}|Abrir quadro visual]]\n\nÍndice de imagens e resumos deste quadro.\n\n<!-- image-atlas:start -->\n<!-- image-atlas:end -->\n`);
      return this.app.vault.create(path, JSON.stringify(board, null, 2));
  }
  async newBoard() {
    try {
      const file = await this.createBoardFile(); await this.openFile(file);
    } catch (error) { new Notice(`Não foi possível criar o quadro: ${error.message}`); }
  }
  syncIndex(board) {
    const path = board.indexPath;
    if (!path) return Promise.resolve();
    // The index contains links, not the scene. Do not deep-clone maps, images
    // and flashcards to update it, or rewrite Markdown when those links match.
    const references = [...new Set(board.nodes.flatMap(n => [n.path, n.visualNote, ...(n.pins || []).map(p => p.notePath)]).filter(Boolean))];
    const signature = JSON.stringify(references);
    this.indexReferenceCache ||= new Map();
    const previous = this.indexWrites.get(path) || Promise.resolve();
    const task = previous.catch(() => {}).then(async () => {
      const file = this.app.vault.getFileByPath(path); if (!file) return;
      const stamp = () => `${file.stat?.mtime}:${file.stat?.size}`, cached = this.indexReferenceCache.get(path);
      if (cached?.signature === signature && cached.stamp === stamp()) return;
      const links = references.map(p => { const url = safeUrl(p); if (url) return `- <${url}>`; const target = this.app.vault.getFileByPath(p); return target ? `- ${this.app.fileManager.generateMarkdownLink(target, path)}` : ''; }).filter(Boolean).join('\n');
      const block = `<!-- image-atlas:start -->\n${links}\n<!-- image-atlas:end -->`, pattern = /<!-- image-atlas:start -->[\s\S]*?<!-- image-atlas:end -->/;
      const raw = await (this.app.vault.cachedRead ? this.app.vault.cachedRead(file) : this.app.vault.read(file));
      if (pattern.test(raw) && raw.match(pattern)[0] !== block) await this.app.vault.process(file, text => text.replace(pattern, () => block));
      this.indexReferenceCache.set(path, { signature, stamp: stamp() });
      while (this.indexReferenceCache.size > 200) this.indexReferenceCache.delete(this.indexReferenceCache.keys().next().value);
    });
    this.indexWrites.set(path, task);
    task.finally(() => { if (this.indexWrites.get(path) === task) this.indexWrites.delete(path); }).catch(() => {});
    return task;
  }
};
