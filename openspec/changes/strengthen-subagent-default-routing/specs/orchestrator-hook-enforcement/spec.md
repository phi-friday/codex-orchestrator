## ADDED Requirements

### Requirement: Route-specific prompt context
The UserPromptSubmit hook SHALL emit route-specific orchestrator context for
detectable prompts that imply documentation/network research or non-trivial
review and judgment work.

#### Scenario: Documentation or network research prompt
- **WHEN** a UserPromptSubmit hook receives a prompt mentioning documentation, official docs, Context7, web search, GitHub search, release notes, migration guides, SDKs, frameworks, cloud services, AI tooling, library internals, current external knowledge, network research, or fetching external sources for substantive work
- **THEN** the emitted additional context MUST instruct Codex that `librarian` is the default route when available and that parent-local research requires an allowed objective local-only reason.

#### Scenario: Oracle-worthy prompt
- **WHEN** a UserPromptSubmit hook receives a prompt mentioning OpenSpec proposals, design critique, code review, architecture tradeoffs, debugging hypotheses, simplification, maintainability review, orchestration rules, hooks, schemas, installers, skill prompts, or subagent prompts for substantive work
- **THEN** the emitted additional context MUST instruct Codex that `oracle` is the default read-only review or judgment route when available unless an allowed objective local-only reason applies.

#### Scenario: Prompt has no explicit route terms
- **WHEN** a UserPromptSubmit hook receives an applicable substantive prompt that does not mention documentation/network research or oracle-worthy review terms
- **THEN** the hook MUST still emit the general subagent-first orchestrator context required by the existing hook specification.

### Requirement: Subjective local-only reasons are rejected
The Stop hook SHALL reject detectable completion claims that justify local-only
execution with subjective reasons rather than allowed objective exceptions.

#### Scenario: Completion uses confidence as local-only reason
- **WHEN** a Stop hook receives a final assistant message that claims completion for applicable substantive work without delegation
- **AND** the message justifies local-only execution with confidence, routine nature, speed, convenience, perceived simplicity, "I can do it myself", "API is simple", or "parent already knows enough"
- **THEN** it MUST request continuation with a concise prompt to apply the closed-list local-only exception standard.

#### Scenario: Completion names an allowed exception
- **WHEN** a Stop hook receives a final assistant message that claims completion for applicable substantive work without delegation
- **AND** the message names an allowed objective local-only exception with verification evidence
- **THEN** it MUST allow the turn to finish unless another completion guard applies.

### Requirement: Route-specific completion evidence
The Stop hook SHALL require route-specific delegation evidence or an allowed
objective local-only reason when detectable final-message text indicates
documentation/network research or oracle-worthy review and judgment work.

#### Scenario: Documentation research lacks librarian evidence
- **WHEN** a Stop hook receives a final assistant message that claims completion and mentions using documentation, official docs, Context7, web search, GitHub search, release notes, migration guides, SDKs, frameworks, cloud services, AI tooling, library internals, current external knowledge, network research, or fetching external sources
- **AND** the message does not mention `librarian` delegation or an allowed objective local-only reason
- **THEN** it MUST request continuation with a concise prompt to report `librarian` evidence or apply the closed-list local-only exception standard.

#### Scenario: Review or judgment lacks oracle evidence
- **WHEN** a Stop hook receives a final assistant message that claims completion and mentions code review, design critique, architecture tradeoffs, debugging hypotheses, simplification, maintainability review, OpenSpec proposal review, orchestration rules, hooks, schemas, installers, skill prompts, or subagent prompts
- **AND** the message does not mention `oracle` delegation or an allowed objective local-only reason
- **THEN** it MUST request continuation with a concise prompt to report `oracle` evidence or apply the closed-list local-only exception standard.

#### Scenario: Hook evidence is text-deterministic
- **WHEN** route-specific Stop hook checks are implemented
- **THEN** they MUST be based on deterministic prompt and final-message text patterns and MUST NOT claim to prove actual runtime subagent execution beyond available hook input.
