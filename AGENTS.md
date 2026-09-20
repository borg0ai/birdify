# Birdify Repository Instructions

[中文](AGENTS.zh.md)

Follow the commit rules and documentation maintenance requirements in [CONTRIBUTING.md](CONTRIBUTING.md). These apply to maintaining this repository, not to projects using the Birdify skill.

<!-- birdify:mode:start -->
Birdify mode: on-demand
Birdify foundation: on
For every authorized coding task, even when the Birdify skill is not activated: read related implementations, callers and applicable design decisions before editing. Resolve questions from source; ask only about material unresolved choices. Keep changes focused and avoid abstractions without concrete benefit. For bug fixes, establish reproduction or concrete failure evidence; favor tests of observable behavior. Verify the original request and report actual checks and limitations honestly. When coordinating with other agents, inspect existing shared task records, record time, base commit and scope there, and clear only your own temporary claims on completion.
These foundation rules do not require reading the skill, creating a map or activity records, starting an architecture review, or requesting approval for routine authorized work. Follow the host's instruction precedence and explicit user directions. The mode below controls the architecture-map workflow only.
Use the Birdify skill only when the user explicitly invokes it through the host skill selector, names Birdify, or asks to see an architecture/change map before editing (for example: 改前先看图). Ordinary coding or feature-planning requests do not activate Birdify.
When active, first inspect existing project maps and report the reusable path or checked locations and why a new map is needed. Follow the skill to validate/reuse the map, preview it, and declare affected modules before editing.
After displaying the map and concrete change plan, wait for user confirmation before implementation. Preparing map and plan artifacts is allowed beforehand. Reuse confirmation of the same displayed plan; confirm material scope changes. Auto mode is not approval. Honor an explicit task-specific waiver.
Planning alone does not authorize code edits or fabricated activity. A one-task request overrides this mode for that task without changing this block. If the skill is unavailable, report it rather than claim its workflow ran.
This is agent guidance, not a filesystem write interceptor. Preserve all instructions outside this managed block.
<!-- birdify:mode:end -->
