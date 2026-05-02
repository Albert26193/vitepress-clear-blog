#!/bin/bash
# =============================================================================
# link_agents.sh
# Symlink manager for AI IDE configurations (.cursor / .claude / .codex).
#
# Sources live under .agents/ (rules, skills, commands, agents, AGENTS.md).
# This script creates per-item symlinks from each IDE dot-directory back to
# the corresponding entries in .agents/, so that a single set of sources
# feeds multiple IDEs simultaneously.
#
# Usage:
#   ./scripts/link_agents.sh                # init all supported IDEs
#   ./scripts/link_agents.sh --ide cursor   # init a single IDE
#   ./scripts/link_agents.sh --check        # dry-run: report issues, exit non-zero
#   ./scripts/link_agents.sh --clean        # remove all managed symlinks
#   ./scripts/link_agents.sh --log-level verbose
#   ./scripts/link_agents.sh -h | --help
# =============================================================================

# We do NOT use "set -e".  CHECK_FAILED accumulates issues so that --check
# can report every problem in a single pass instead of bailing early.

# --------------------------------------------------------------------------
# Terminal colours
# --------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

LOG_LEVEL="${LOG_LEVEL:-normal}"
CHECK_ONLY=false
ACTION="init"
CHECK_FAILED=0
TARGET_IDE="all"

RESOURCE_TYPES=("rules" "skills" "commands" "agents")
PROJECT_DESC_SRC="AGENTS.md"

# IDE definitions: "DisplayName:dot-dir:description-filename"
IDE_DEFS=(
    "Cursor:.cursor:AGENTS.md"
    "Claude Code:.claude:CLAUDE.md"
    "Codex:.codex:AGENTS.md"
)

#-----------------------------------------
# overview: gatekeep log output by verbosity level.
#
# @param:  $1  required level (error / normal / verbose)
# @return: 0 if the message should be printed, 1 otherwise
#-----------------------------------------
should_log() {
    local required_level="$1"
    case "$LOG_LEVEL" in
        quiet)   [[ "$required_level" == "error" ]] ;;
        normal)  [[ "$required_level" != "verbose" ]] ;;
        verbose) return 0 ;;
        *)       return 1 ;;
    esac
}

log_verbose() { $CHECK_ONLY && return 0; should_log "verbose" && echo -e "${GREEN}[INFO]${NC}  $*"; }
log_info()    { $CHECK_ONLY && return 0; should_log "normal" && echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()    { should_log "normal" && echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }
log_section() { should_log "normal" && echo -e "\n${BLUE}>>> $*${NC}"; }

#-----------------------------------------
# overview: increment CHECK_FAILED safely (avoid non-zero rc when counter is 0).
#-----------------------------------------
bump_check_failed() { (( CHECK_FAILED++ )) || true; }

# --------------------------------------------------------------------------
# Argument parsing
# --------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case "$1" in
        --silent) LOG_LEVEL="quiet" ;;
        --check)  CHECK_ONLY=true ;;
        --clean)  ACTION="clean" ;;
        --ide)    TARGET_IDE="$2"; shift ;;
        --log-level)
            if [[ $# -lt 2 ]]; then
                log_error "--log-level requires an argument (quiet / normal / verbose)"
                exit 1
            fi
            LOG_LEVEL="$2"
            shift
            ;;
        -h|--help)
            sed -n '2,/^# =====/p' "$0" | sed 's/^# \?//'
            exit 0
            ;;
        *) log_error "unknown argument: $1"; exit 1 ;;
    esac
    shift
done

case "$LOG_LEVEL" in
    quiet|normal|verbose) ;;
    *)
        log_error "invalid --log-level: $LOG_LEVEL (valid: quiet / normal / verbose)"
        exit 1
        ;;
esac

# --------------------------------------------------------------------------
# Locate project root
# --------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
AGENTS_DIR="$PROJECT_ROOT/.agents"

if [[ ! -d "$AGENTS_DIR" ]]; then
    log_error ".agents/ directory not found: $AGENTS_DIR"
    exit 1
fi

# --------------------------------------------------------------------------
# IDE definition look-up helpers
# --------------------------------------------------------------------------

#-----------------------------------------
# overview: given an IDE display name, print its dot-directory (e.g. ".cursor").
#
# @param:  $1  IDE display name (must match an entry in IDE_DEFS)
# @output: dot-directory path segment
# @return: 0 on success, 1 if not found
#-----------------------------------------
get_ide_dot_dir() {
    for def in "${IDE_DEFS[@]}"; do
        local name="${def%%:*}"
        local rest="${def#*:}"
        local dot_dir="${rest%%:*}"
        if [[ "$name" == "$1" ]]; then
            echo "$dot_dir"
            return 0
        fi
    done
    return 1
}

#-----------------------------------------
# overview: given an IDE display name, print its description filename (e.g. "CLAUDE.md").
#
# @param:  $1  IDE display name
# @output: description filename
# @return: 0 on success, 1 if not found
#-----------------------------------------
get_ide_desc_filename() {
    for def in "${IDE_DEFS[@]}"; do
        local name="${def%%:*}"
        local rest="${def#*:}"
        local desc_file="${rest#*:}"
        if [[ "$name" == "$1" ]]; then
            echo "$desc_file"
            return 0
        fi
    done
    return 1
}

#-----------------------------------------
# overview: given a dot-directory, print the corresponding IDE display name.
#
# @param:  $1  dot-directory (e.g. ".claude")
# @output: IDE display name
# @return: 0 on success, 1 if not found
#-----------------------------------------
get_ide_name_by_dir() {
    for def in "${IDE_DEFS[@]}"; do
        local name="${def%%:*}"
        local rest="${def#*:}"
        local dot_dir="${rest%%:*}"
        if [[ "$dot_dir" == "$1" ]]; then
            echo "$name"
            return 0
        fi
    done
    return 1
}

# --------------------------------------------------------------------------
# Symlink helpers
# --------------------------------------------------------------------------

#-----------------------------------------
# overview: create or verify a single symlink.
#           In --check mode reports problems without modifying anything.
#           Backs up real files that sit where a managed symlink belongs.
#
# @param:  $1  link_path  — absolute path where the symlink should exist
# @param:  $2  target     — relative path the symlink should point to
# @return: 0 always (CHECK_FAILED is bumped on issues)
#-----------------------------------------
create_symlink() {
    local link_path="$1"
    local target="$2"
    local link_dir
    link_dir="$(dirname "$link_path")"
    local link_name
    link_name="$(basename "$link_path")"

    # Validate that the resolved target exists.
    local abs_target="$link_dir/$target"
    if [[ -L "$abs_target" && ! -e "$abs_target" ]]; then
        log_error "symlink target is a dangling symlink: $abs_target"
        bump_check_failed
        return 0
    fi
    if [[ ! -e "$abs_target" ]]; then
        log_error "symlink target does not exist: $abs_target"
        bump_check_failed
        return 0
    fi

    if [[ -L "$link_path" ]]; then
        local current_target
        current_target="$(readlink "$link_path")"
        if [[ "$current_target" == "$target" ]]; then
            log_verbose "  ✓ symlink already correct: $link_name -> $target"
            return 0
        else
            log_warn "  ✗ symlink target mismatch: $link_name -> $current_target (expected: $target)"
            if $CHECK_ONLY; then
                bump_check_failed
                return 0
            fi
            rm "$link_path"
        fi
    elif [[ -e "$link_path" ]]; then
        log_warn "  ✗ real file/dir blocks symlink: $link_path — will back up and replace"
        if $CHECK_ONLY; then
            bump_check_failed
            return 0
        fi
        mv "$link_path" "${link_path}.bak.$(date +%Y%m%d%H%M%S)"
        log_verbose "  backed up to: ${link_path}.bak.*"
    fi

    if $CHECK_ONLY; then
        log_warn "  ✗ symlink missing: $link_name -> $target"
        bump_check_failed
        return 0
    fi
    ln -s "$target" "$link_path"
    log_verbose "  ✓ symlink created: $link_name -> $target"
}

#-----------------------------------------
# overview: migrate a legacy whole-directory symlink (<ide>/<res> -> ../.agents/<res>)
#           into a real directory so per-item linking can take over.
#
# @param:  $1  ide_dir  — absolute path to the IDE dot-directory
# @param:  $2  res      — resource type name (e.g. "skills")
# @return: 0 = ready for per-item linking; 1 = skip this resource type
#-----------------------------------------
migrate_legacy_dir_symlink() {
    local ide_dir="$1"
    local res="$2"
    local res_path="$ide_dir/$res"
    local legacy_target="../.agents/$res"

    [[ -L "$res_path" ]] || return 0

    local current_target
    current_target="$(readlink "$res_path")"

    if [[ "$current_target" == "$legacy_target" ]]; then
        if $CHECK_ONLY; then
            log_warn "  ✗ $res/ is a legacy whole-directory symlink — migrate to per-item mode"
            bump_check_failed
            return 1
        fi
        rm "$res_path"
        log_info "migrated $res/ from legacy whole-directory symlink to real directory"
        return 0
    fi

    log_warn "  ⊘ $res/ is an unmanaged symlink (-> $current_target), skipping"
    return 1
}

#-----------------------------------------
# overview: for every entry in .agents/<res>/, create a corresponding
#           per-item symlink in <ide_dir>/<res>/.
#
# @param:  $1  ide_dir  — absolute path to the IDE dot-directory
# @param:  $2  res      — resource type name (e.g. "skills")
# @return: 0 always
#-----------------------------------------
link_resource_items() {
    local ide_dir="$1"
    local res="$2"
    local res_dir="$ide_dir/$res"
    local src_dir="$AGENTS_DIR/$res"
    local managed_prefix="../../.agents/${res}/"

    [[ -d "$src_dir" ]] || return 0
    mkdir -p "$res_dir"

    while IFS= read -r entry; do
        local name
        name="$(basename "$entry")"
        [[ "$name" == ".gitkeep" ]] && continue

        local link_path="$res_dir/$name"
        local expected_target="../../.agents/${res}/${name}"

        if [[ -L "$link_path" ]]; then
            local current_target
            current_target="$(readlink "$link_path")"
            if [[ "$current_target" == "$expected_target" ]]; then
                log_verbose "  ✓ $res/$name"
                continue
            fi
            # Managed prefix but wrong target — fix it.
            if [[ "$current_target" == "$managed_prefix"* ]]; then
                if $CHECK_ONLY; then
                    log_warn "  ✗ $res/$name managed symlink has wrong target"
                    bump_check_failed
                    continue
                fi
                rm "$link_path"
                ln -s "$expected_target" "$link_path"
                log_verbose "  ✓ $res/$name (corrected)"
                continue
            fi
            # Unmanaged symlink — leave it alone.
            log_warn "  ⊘ $res/$name is a user symlink (-> $current_target), skipping"
            continue
        fi

        # Real file or directory — leave it alone.
        if [[ -e "$link_path" ]]; then
            log_warn "  ⊘ $res/$name is a user file, skipping"
            continue
        fi

        # Nothing there — create.
        if $CHECK_ONLY; then
            log_warn "  ✗ $res/$name symlink missing"
            bump_check_failed
            continue
        fi
        ln -s "$expected_target" "$link_path"
        log_verbose "  ✓ $res/$name (new)"
    done < <(find "$src_dir" -mindepth 1 -maxdepth 1 2>/dev/null | sort)
}

#-----------------------------------------
# overview: scan <ide_dir>/<res>/ for managed symlinks whose targets no longer
#           exist in .agents/ and remove them.
#
# @param:  $1  ide_dir  — absolute path to the IDE dot-directory
# @param:  $2  res      — resource type name
# @return: 0 always
#-----------------------------------------
clean_stale_managed_links() {
    local ide_dir="$1"
    local res="$2"
    local res_dir="$ide_dir/$res"
    local managed_prefix="../../.agents/${res}/"

    [[ -d "$res_dir" ]] || return 0

    while IFS= read -r entry; do
        [[ -L "$entry" ]] || continue
        local current_target
        current_target="$(readlink "$entry")"
        [[ "$current_target" == "$managed_prefix"* ]] || continue

        if [[ ! -e "$entry" ]]; then
            local name
            name="$(basename "$entry")"
            if $CHECK_ONLY; then
                log_warn "  ✗ $res/$name managed link is dangling"
                bump_check_failed
            else
                rm "$entry"
                log_verbose "  ✓ $res/$name (removed dangling link)"
            fi
        fi
    done < <(find "$res_dir" -mindepth 1 -maxdepth 1 2>/dev/null)
}

# --------------------------------------------------------------------------
# IDE initialisation
# --------------------------------------------------------------------------

#-----------------------------------------
# overview: initialise (or check) a single IDE dot-directory.
#           Creates per-item symlinks for every resource type and the
#           project description file.
#
# @param:  $1  ide_name      — human-readable IDE name for logging
# @param:  $2  dot_dir       — IDE dot-directory name (e.g. ".cursor")
# @param:  $3  desc_filename — description filename inside that directory
# @return: 0 always
#-----------------------------------------
init_ide() {
    local ide_name="$1"
    local dot_dir="$2"
    local desc_filename="$3"

    if $CHECK_ONLY; then
        log_section "checking ${ide_name} (${dot_dir}/)"
    else
        log_section "initialising ${ide_name} (${dot_dir}/)"
    fi

    local ide_dir="$PROJECT_ROOT/$dot_dir"
    mkdir -p "$ide_dir"

    for res in "${RESOURCE_TYPES[@]}"; do
        if migrate_legacy_dir_symlink "$ide_dir" "$res"; then
            link_resource_items "$ide_dir" "$res"
            clean_stale_managed_links "$ide_dir" "$res"
        fi
    done

    # Project description file symlink.
    if [[ -n "$desc_filename" && -f "$AGENTS_DIR/$PROJECT_DESC_SRC" ]]; then
        create_symlink "$ide_dir/$desc_filename" "../.agents/$PROJECT_DESC_SRC"
    fi
}

#-----------------------------------------
# overview: remove all managed symlinks from every IDE dot-directory.
#           User-created files and unmanaged symlinks are preserved.
#
# @return: 0 always
#-----------------------------------------
clean_all() {
    log_section "cleaning IDE symlinks"

    for def in "${IDE_DEFS[@]}"; do
        local ide_name="${def%%:*}"
        local rest="${def#*:}"
        local dot_dir="${rest%%:*}"
        local desc_filename="${rest#*:}"

        local ide_dir="$PROJECT_ROOT/$dot_dir"
        [[ -d "$ide_dir" ]] || continue

        for res in "${RESOURCE_TYPES[@]}"; do
            local res_path="$ide_dir/$res"
            local legacy_target="../.agents/$res"
            local managed_prefix="../../.agents/${res}/"

            # Legacy whole-directory symlink.
            if [[ -L "$res_path" ]]; then
                local current_target
                current_target="$(readlink "$res_path")"
                if [[ "$current_target" == "$legacy_target" ]]; then
                    rm "$res_path"
                    log_info "removed legacy whole-directory symlink: $dot_dir/$res"
                fi
                continue
            fi

            # Per-item mode: only remove managed symlinks.
            [[ -d "$res_path" ]] || continue
            local cleaned=0
            while IFS= read -r entry; do
                [[ -L "$entry" ]] || continue
                local ct
                ct="$(readlink "$entry")"
                if [[ "$ct" == "$managed_prefix"* ]]; then
                    rm "$entry"
                    (( cleaned++ ))
                fi
            done < <(find "$res_path" -mindepth 1 -maxdepth 1 2>/dev/null)
            if [[ "$cleaned" -gt 0 ]]; then
                log_info "removed $cleaned managed symlink(s): $dot_dir/$res/"
            fi
        done

        # Clean the description file symlink.
        local desc_path="$ide_dir/$desc_filename"
        if [[ -L "$desc_path" ]]; then
            local ct
            ct="$(readlink "$desc_path")"
            if [[ "$ct" == "../.agents/$PROJECT_DESC_SRC" ]]; then
                rm "$desc_path"
                log_info "removed symlink: $dot_dir/$desc_filename"
            fi
        fi
    done
}

# ==========================================================================
# Main
# ==========================================================================

if $CHECK_ONLY; then
    log_section "AI IDE configuration check"
else
    log_section "AI IDE configuration init"
fi
log_info "project root: $PROJECT_ROOT"
log_info "source dir:   .agents/"

if [[ "$ACTION" == "clean" ]]; then
    clean_all
    log_section "clean complete"
    exit 0
fi

# ── Init per IDE ──
case "$TARGET_IDE" in
    all)
        for def in "${IDE_DEFS[@]}"; do
            name="${def%%:*}"
            rest="${def#*:}"
            dot_dir="${rest%%:*}"
            desc_file="${rest#*:}"
            init_ide "$name" "$dot_dir" "$desc_file"
        done
        ;;
    cursor)
        init_ide "Cursor" "$(get_ide_dot_dir "Cursor")" "$(get_ide_desc_filename "Cursor")"
        ;;
    claude-code|claude)
        init_ide "Claude Code" "$(get_ide_dot_dir "Claude Code")" "$(get_ide_desc_filename "Claude Code")"
        ;;
    codex)
        init_ide "Codex" "$(get_ide_dot_dir "Codex")" "$(get_ide_desc_filename "Codex")"
        ;;
    *)
        log_error "unknown IDE: $TARGET_IDE (valid: all / cursor / claude-code / codex)"
        exit 1
        ;;
esac

if $CHECK_ONLY; then
    log_section "check complete"
    if [[ $CHECK_FAILED -gt 0 ]]; then
        log_error "CHECK mode: $CHECK_FAILED issue(s) found. Run link_agents.sh to fix."
        exit 1
    fi
else
    log_section "init complete"
    log_info ""
    log_info "symlink mapping (per-item mode):"
    log_info "  .agents/<res>/<name> -> .<ide>/<res>/<name>  (rules/skills/commands/agents)"
    log_info "  .agents/AGENTS.md    -> .cursor/AGENTS.md, .codex/AGENTS.md"
    log_info "  .agents/AGENTS.md    -> .claude/CLAUDE.md"
    log_info ""
    log_info "Re-run scripts/link_agents.sh after modifying anything under .agents/."
    log_info "User files placed directly in .cursor/ etc. are never overwritten."
fi
