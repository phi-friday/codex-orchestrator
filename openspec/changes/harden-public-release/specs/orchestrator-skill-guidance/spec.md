## ADDED Requirements

### Requirement: Bundled specialist permissions match default role
Bundled custom-agent templates SHALL default to the least privilege needed for
their documented specialist role.

#### Scenario: Librarian is installed from bundled template
- **WHEN** the installer renders the bundled `librarian` custom-agent template
- **THEN** the generated `librarian` definition MUST use a read-only filesystem
  sandbox by default.

#### Scenario: Librarian research suggests code changes
- **WHEN** the `librarian` role discovers implementation guidance that requires
  file edits
- **THEN** its instructions MUST route patch production to the parent or a
  write-capable implementation role instead of editing files itself.
