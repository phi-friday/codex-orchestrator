# Codex Orchestrator

한국어 | [English](./README.md)

Codex Orchestrator는
[oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim)의
에이전트 라우팅 아이디어를 Codex 환경에 맞게 옮긴 Codex 플러그인입니다. 기본
오케스트레이션 스킬, 번들 custom-agent 템플릿, 그리고 실질적인 코딩 작업을
부모 에이전트와 서브에이전트 협업 흐름으로 유도하는 훅을 제공합니다.

> [!IMPORTANT]
> 이 플러그인의 사용 책임은 전적으로 사용자 본인에게 있습니다. 설치, 활성화,
> 소스 검토, 운영, 스킬, 훅, 서브에이전트, 실행 명령, 모델 사용량, 비용, 파일
> 변경 등 이 플러그인으로 인해 발생하는 모든 결과는 사용자가 직접 책임져야
> 합니다.

## 원본: oh-my-opencode-slim

이 프로젝트는 [`alvinunreal`](https://github.com/alvinunreal)이 만든 경량
OpenCode 오케스트레이션 플러그인인
[`oh-my-opencode-slim`](https://github.com/alvinunreal/oh-my-opencode-slim)을
Codex에 맞게 각색한 것입니다. 원본 프로젝트는 하나의 메인 에이전트가 모든
작업을 혼자 처리하지 않도록, 전문 에이전트들에게 작업을 라우팅하는 구조를
제공합니다.

이 저장소의 Codex custom-agent 템플릿은 가능한 범위에서 원본 역할과 라우팅
의도를 보존하되, OpenCode 전용 런타임 동작을 Codex 호환 스킬, custom-agent
TOML 파일, 플러그인 훅으로 대체합니다.

현재 이 저장소는 `oh-my-opencode-slim` `1.1.1` 버전을 참조합니다. 번들
서브에이전트 템플릿에는 참조한 원본 저장소, 커밋, 원본 에이전트 파일, 각색
메모가 provenance 주석으로 포함되어 있습니다. 서드파티 라이선스 정보는
[`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md)에 기록되어 있습니다.

## 제공 기능

- `codex-orchestrator` 스킬: 실질적인 코딩 에이전트 작업에 기본 적용되는
  오케스트레이션 지침.
- `install-subagents` 스킬: JSON 설정을 바탕으로 번들 Codex custom-agent
  템플릿을 렌더링하는 설치 흐름.
- 번들 서브에이전트 템플릿:
  - `orchestrator-explorer`
  - `librarian`
  - `oracle`
  - `designer`
  - `fixer`
  - `observer`
- `UserPromptSubmit` 및 `Stop` 이벤트용 선택적 훅.
- Codex가 이 저장소를 marketplace source로 추가했을 때 이 플러그인을 발견할 수
  있게 하는 marketplace 카탈로그.

## 오케스트레이션 방식

부모 Codex 에이전트는 항상 핵심 경로, 통합, 검증을 책임집니다. 서브에이전트는
코드베이스 조사, 문서 리서치, 범위가 명확한 구현, 시각적 검토, 전략적 리뷰,
집중 검증처럼 독립적으로 처리할 수 있는 작업에 사용됩니다.

오케스트레이션 스킬은 사용자가 명시적으로 거부하지 않는 한 실질적인 코딩
작업에 기본 적용되도록 설계되어 있습니다. 단순한 단일 명령 확인, 정확히 알고
있는 파일 조회, 사용 가능한 전문 에이전트가 없는 경우, 독립 작업으로 분리할 수
없는 즉시 처리 핵심 경로 작업은 로컬 단독 처리도 유효합니다.

## 플러그인 구조

```text
plugins/codex-orchestrator/
  .codex-plugin/plugin.json
  assets/
    schemas/codex-orchestrator.schema.json
    subagents/*.toml
  hooks/
    hooks.json
    orchestrator-hook.mjs
    orchestrator-enforcement.mjs
  scripts/
    install-subagents.mjs
    install-subagents-wizard.mjs
  skills/
    codex-orchestrator/SKILL.md
    install-subagents/SKILL.md
```

## Marketplace로 플러그인 추가하기

이 저장소를 Git marketplace source로 추가합니다.

```bash
codex plugin marketplace add https://github.com/phi-friday/codex-orchestrator --ref v{{VERSION}}
```

GitHub shorthand를 사용할 수도 있습니다.

```bash
codex plugin marketplace add phi-friday/codex-orchestrator --ref v{{VERSION}}
```

이 저장소에는 다음 위치에 marketplace 파일이 포함되어 있습니다.

```text
.agents/plugins/marketplace.json
```

Codex는 Git marketplace source를 가져온 뒤 이 marketplace 파일을 플러그인
카탈로그로 읽고, `codex-orchestrator` 항목을 사용해 플러그인을 설치합니다. 이
파일은 marketplace 흐름에서 Codex가 플러그인을 발견하기 위해 필요한 목록
파일입니다.

`--ref`로 Codex가 가져올 브랜치, 태그, 커밋을 고정할 수 있습니다.

## 번들 서브에이전트 설정

플러그인을 설치한 뒤에는 어떤 번들 서브에이전트를 사용할지, 각 에이전트가 어떤
모델을 사용할지 설정합니다. 이 설정 파일은 번들 custom-agent 정의를 생성할 때
사용하는 기본 입력입니다.

설정은 아래 순서로 읽히며, 뒤쪽 항목의 우선순위가 더 높습니다.

```text
~/.codex/codex-orchestrator.json
<cwd>/codex-orchestrator.json
--config <path>
```

`codex-orchestrator.json` 예시:

```json
{
  "$schema": "./plugins/codex-orchestrator/assets/schemas/codex-orchestrator.schema.json",
  "agents": {
    "orchestrator-explorer": {
      "model": "gpt-5.4-mini",
      "model_reasoning_effort": "medium"
    },
    "fixer": {
      "model": "gpt-5.4-mini",
      "model_reasoning_effort": "low"
    },
    "oracle": {
      "model": null
    }
  }
}
```

`model`에는 해당 서브에이전트가 사용할 Codex 모델을 지정합니다. 번들
서브에이전트를 사용하지 않으려면 `model`을 `null`로 둡니다.
`model_reasoning_effort`는 특정 서브에이전트의 reasoning effort를 직접
지정하고 싶을 때만 설정하세요. 사용할 수 있는 값은 `low`, `medium`, `high`,
`xhigh`, `null`입니다.

## 훅과 권한 주의사항

이 플러그인은 `plugins/codex-orchestrator/hooks/hooks.json`에 Codex 플러그인 훅을
선언합니다. 훅은 다음 이벤트에서 Node 명령을 실행합니다.

- `UserPromptSubmit`: 적용 가능한 코딩 프롬프트에 오케스트레이션 컨텍스트를
  추가합니다.
- `Stop`: 응답이 끝나기 전에 오케스트레이션 또는 유효한 로컬 단독 처리 사유,
  정리, 검증을 언급했는지 확인합니다.

훅은 Codex 환경에서 플러그인 훅이 활성화되어 있을 때만 실행됩니다.

```toml
[features]
plugin_hooks = true
```

훅이나 marketplace 플러그인을 활성화하기 전에 반드시 플러그인 소스를 검토하고,
훅 명령이 사용자의 Codex 환경에서 허용된 권한으로 로컬 실행된다는 점을
이해해야 합니다. 이 플러그인의 훅은 플러그인 디렉터리의 Node 스크립트를
실행합니다. 또한 `librarian` 번들 에이전트 템플릿은 Context7 MCP 서버를
설정하므로, 해당 에이전트와 MCP 서버가 활성화되면 문서 조회 과정에서 네트워크
접근이 발생할 수 있습니다.

## 개발

의존성 설치:

```bash
bun install
```

검증 실행:

```bash
bun run test
bun run typecheck
bun run lint
```

`package.json`에 선언된 `oh-my-opencode-slim` 참조 스냅샷 버전을 갱신:

```bash
bun run reference:oh-my-opencode-slim
```
