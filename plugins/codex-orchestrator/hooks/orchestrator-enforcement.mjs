// @ts-check
/**
 * @typedef {{
 *   hook_event_name?: string;
 *   prompt?: string;
 *   stop_hook_active?: boolean;
 *   last_assistant_message?: string;
 * }} HookInput
 */

const ORCHESTRATOR_CONTEXT = [
  "Codex Orchestrator is mandatory-by-default for this request.",
  "Use the codex-orchestrator workflow before acting unless the user explicitly opted out.",
  "Spawn suitable available subagents by default for applicable substantive work.",
  "Only stay local when an allowed exception applies: explicit opt-out, unavailable matching subagents, trivial single-command checks, exact known-file lookups, or immediately blocking critical-path work with no independent lane.",
  "Keep parent-owned integration and verification, and still apply the orchestration decision gate and completion standard.",
].join(" ");

const USER_PROMPT_HOOK = "UserPromptSubmit";
const STOP_HOOK = "Stop";

const APPLICABLE_PATTERNS = [
  /\b(add|build|create|implement|fix|debug|repair|refactor|change|update|modify)\b/iu,
  /\b(test|tests|typecheck|lint|verify|verification|code review)\b/iu,
  /\b(repo|repository|codebase|module|package|plugin|skill|hook|hooks)\b/iu,
  /\b(task|tasks|multi[- ]?step|multi[- ]?file|subtask|implementation|debugging)\b/iu,
  /\b(open ?spec|proposal|propose|design|spec|planning|plan|analysis|review|investigate|research|investigation)\b.*\b(repo|repository|codebase|code|coding|implementation|debugging|plugin|skill|hook|hooks|module|package|file|files|multi[- ]?file)\b/iu,
  /\b(repo|repository|codebase|code|coding|implementation|debugging|plugin|skill|hook|hooks|module|package|file|files|multi[- ]?file)\b.*\b(open ?spec|proposal|propose|design|spec|planning|plan|analysis|review|investigate|research|investigation)\b/iu,
  /(구현|추가|생성|만들|수정|변경|고치|해결|디버그|리팩터|리팩토|검토|리뷰|조사|분석|확인|검증|테스트|타입체크|린트|저장소|코드베이스|파일|모듈|패키지|플러그인|스킬|후크|훅|작업)/u,
];

const OPT_OUT_PATTERNS = [
  /\b(do not|don't|dont|never|without|no)\s+(use\s+)?(orchestrat\w*|subagents?|sub-agents?|delegat\w*|spawn(?:ed)? agents?|codex-orchestrator)\b/iu,
  /\b(use\s+)?(no|zero)\s+(orchestrat\w*|subagents?|sub-agents?|delegat\w*|spawn(?:ed)? agents?)\b/iu,
  /\b(skip|avoid|disable)\s+(the\s+)?(orchestrat\w*|subagents?|sub-agents?|delegat\w*|codex-orchestrator)\b/iu,
  /\b(local(?:ly)? only|single agent only|no agents)\b/iu,
  /(오케스트라|오케스트레이션|codex-orchestrator|서브 ?에이전트|하위 ?에이전트|위임|분담|스폰|spawn).{0,20}(쓰지|사용하지|사용하지마|사용하지 마|하지 ?마|하지 ?말|빼고|없이|금지|끄고|비활성)/u,
  /(쓰지|사용하지|사용하지마|사용하지 마|하지 ?마|하지 ?말|빼고|없이|금지|끄고|비활성).{0,20}(오케스트라|오케스트레이션|codex-orchestrator|서브 ?에이전트|하위 ?에이전트|위임|분담|스폰|spawn)/u,
  /(로컬|혼자|단일 ?에이전트).{0,12}(만|으로만|처리)/u,
];

const COMPLETION_PATTERNS = [
  /\b(complete|completed|implemented|fixed|finished)\b/iu,
  /\bI (updated|added|changed|implemented|fixed|created)\b/iu,
  /(완료|구현|수정|변경|고쳤|처리)/u,
];

const VERIFICATION_PATTERNS = [
  /\b(test|tests|typecheck|lint|verified|verification|ran|checked|reviewed|integrated)\b/iu,
  /\bskipped\b.*\b(test|typecheck|lint|verification)\b/iu,
  /\bnot run\b/iu,
  /(테스트|타입체크|린트|검증|확인|실행|통과|실패|건너뜀|스킵)/u,
];

const DELEGATION_PATTERNS = [
  /\b(spawn(?:ed)?|delegat(?:e|ed|ing)|subagent(?:s)?|sub-agent(?:s)?|orchestrator-explorer|librarian|oracle|designer|fixer|observer)\b/iu,
  /\b(parent-owned integration|parent owned integration)\b/iu,
  /(서브 ?에이전트|하위 ?에이전트|위임|분담|스폰|통합)/u,
];

const LOCAL_ONLY_REASON_PATTERNS = [
  /\b(explicit opt-out|opt out|opt-out)\b/iu,
  /\b(unavailable matching subagents?|unavailable specialists?)\b/iu,
  /\b(trivial single-command checks?|single-command checks?|exact known-file lookups?|exact known file lookups?)\b/iu,
  /\b(immediately blocking critical-path work|blocking critical-path work|no independent lane)\b/iu,
  /\b(already had the exact required context|already-known exact context|already known exact context)\b/iu,
  /(명시적 옵트아웃|서브 ?에이전트.*사용 ?불가|단일 명령|정확한 파일 조회|독립.*작업.*없)/u,
];

/**
 * @param {unknown} value
 * @returns {string}
 */
function textFrom(value) {
  return typeof value === "string" ? value : "";
}

/**
 * @param {string} text
 * @param {RegExp[]} patterns
 * @returns {boolean}
 */
function matchesAny(text, patterns) {
  return patterns.some(pattern => pattern.test(text));
}

/**
 * @param {unknown} prompt
 * @returns {boolean}
 */
export function hasExplicitOptOut(prompt) {
  const text = textFrom(prompt);

  return OPT_OUT_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * @param {unknown} prompt
 * @returns {boolean}
 */
export function isApplicablePrompt(prompt) {
  const text = textFrom(prompt);

  if (text.trim().length === 0 || hasExplicitOptOut(text)) {
    return false;
  }

  return matchesAny(text, APPLICABLE_PATTERNS);
}

/**
 * @param {HookInput} input
 * @returns {{ hookSpecificOutput: { hookEventName: "UserPromptSubmit"; additionalContext: string } } | null}
 */
export function buildUserPromptSubmitOutput(input) {
  const prompt = textFrom(input?.prompt);

  if (input?.hook_event_name !== USER_PROMPT_HOOK || !isApplicablePrompt(prompt)) {
    return null;
  }

  return {
    hookSpecificOutput: {
      hookEventName: USER_PROMPT_HOOK,
      additionalContext: ORCHESTRATOR_CONTEXT,
    },
  };
}

/**
 * @param {HookInput} input
 * @returns {boolean}
 */
export function shouldContinueAtStop(input) {
  if (input?.hook_event_name !== STOP_HOOK || input?.stop_hook_active === true) {
    return false;
  }

  const message = textFrom(input?.last_assistant_message);

  if (message.trim().length === 0) {
    return false;
  }

  const claims_completion = matchesAny(message, COMPLETION_PATTERNS);
  const mentions_verification = matchesAny(message, VERIFICATION_PATTERNS);
  const mentions_delegation = matchesAny(message, DELEGATION_PATTERNS);
  const mentions_allowed_local_reason = matchesAny(message, LOCAL_ONLY_REASON_PATTERNS);

  return (
    claims_completion &&
    (!mentions_verification || (!mentions_delegation && !mentions_allowed_local_reason))
  );
}

/**
 * @param {HookInput} input
 * @returns {{ continue: true } | { decision: "block"; reason: string } | null}
 */
export function buildStopOutput(input) {
  if (input?.hook_event_name !== STOP_HOOK) {
    return null;
  }

  if (!shouldContinueAtStop(input)) {
    return {
      continue: true,
    };
  }

  return {
    decision: "block",
    reason:
      "Apply the codex-orchestrator completion standard: include delegation evidence or a concrete allowed local-only reason, then report verification before finishing.",
  };
}

/**
 * @param {HookInput} input
 * @returns {{ hookSpecificOutput: { hookEventName: "UserPromptSubmit"; additionalContext: string } } | { continue: true } | { decision: "block"; reason: string } | null}
 */
export function buildHookOutput(input) {
  switch (input?.hook_event_name) {
    case USER_PROMPT_HOOK:
      return buildUserPromptSubmitOutput(input);
    case STOP_HOOK:
      return buildStopOutput(input);
    default:
      return null;
  }
}
