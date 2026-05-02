---
name: self-sync-skills-command
description: 'Scan .agents/skills/ and generate matching command wrappers in .agents/commands/. Use when adding a new skill, renaming a skill, or auditing that every skill has a corresponding command. Also use when a skill directory structure changes (e.g. flat file to directory with SKILL.md).'
---

# Sync Commands from Skills

Ensure every skill under `.agents/skills/` has a matching command entry in `.agents/commands/`.

## Workflow

1. Scan `.agents/skills/` for directories that contain a `SKILL.md`.
2. For each skill directory `<name>`, check whether `.agents/commands/<name>.md` exists.
3. If missing, create it using the template below.
4. If it exists, verify the `../skills/<name>/SKILL.md` reference path is still correct (update if stale).
5. After all commands are in place, run `./scripts/link.sh` to propagate symlinks to IDE directories.

## Command Template

Use this exact template for every generated command:

```markdown
---
name: <skill-name>
description: '<one-line description>'
---

Invoke the skill at `../skills/<skill-name>/SKILL.md` and follow its instructions exactly.
```

- Copy `<skill-name>` and `<one-line description>` from the corresponding `SKILL.md` frontmatter (`name` and `description` fields).
- The relative path `../skills/<name>/SKILL.md` works uniformly from every IDE `commands/` directory after `link.sh` creates the per-item symlinks.

## Notes

- Skip any subdirectory under `.agents/skills/` that does not contain a `SKILL.md` file (it is not a skill).
- `self-skill-creator` is itself a skill and should have a command just like any other.
- `self-sync-skills-command` itself also needs a command — treat it like any other skill.
- After generating or updating commands, always run `./scripts/link.sh` so IDE directories pick up the changes.
