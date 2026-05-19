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
  "Identify the critical path, check whether independent subtasks should be delegated, and keep parent-owned integration and verification.",
  "If delegation overhead exceeds value, do the work locally but still apply the orchestration decision gate and completion standard.",
].join(" ");

const USER_PROMPT_HOOK = "UserPromptSubmit";
const STOP_HOOK = "Stop";

const APPLICABLE_PATTERNS = [
  /\b(add|build|create|implement|fix|debug|repair|refactor|change|update|modify)\b/iu,
  /\b(test|tests|typecheck|lint|verify|verification|review|code review)\b/iu,
  /\b(repo|repository|codebase|file|files|module|package|plugin|skill|hook|hooks)\b/iu,
  /\b(task|tasks|multi[- ]?step|multi[- ]?file|subtask|parallel|investigate|research)\b/iu,
  /\b(open ?spec|proposal|design|spec|implementation)\b/iu,
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
  /\b(done|complete|completed|implemented|fixed|finished|all set)\b/iu,
  /\bI (updated|added|changed|implemented|fixed|created)\b/iu,
];

const VERIFICATION_PATTERNS = [
  /\b(test|tests|typecheck|lint|verified|verification|ran|checked|reviewed|integrated)\b/iu,
  /\bskipped\b.*\b(test|typecheck|lint|verification)\b/iu,
  /\bnot run\b/iu,
  /(테스트|타입체크|린트|검증|확인|실행|통과|실패|건너뜀|스킵)/u,
];

/**
 * @param {unknown} value
 * @returns {string}
 */
function textFrom(value) {
  return typeof value === "string" ? value : "";
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

  return APPLICABLE_PATTERNS.some(pattern => pattern.test(text));
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

  const claims_completion = COMPLETION_PATTERNS.some(pattern => pattern.test(message));
  const mentions_verification = VERIFICATION_PATTERNS.some(pattern => pattern.test(message));

  return claims_completion && !mentions_verification;
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
      "Apply the codex-orchestrator completion standard: confirm delegation was considered, integrate any results, and report verification before finishing.",
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
