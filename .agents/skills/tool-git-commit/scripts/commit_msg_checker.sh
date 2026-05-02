#!/bin/bash
# =============================================================================
# commit_msg_checker.sh
# Validate a generated commit message against:
#   1. @commitlint/config-conventional
#   2. Subject line contains a #issue_id reference ("#<number>")
#
# Usage:
#   ./commit_msg_checker.sh <message-file>
#   echo "feat(auth): #42 add login" | ./commit_msg_checker.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

TMP_FILE=""

# -----------------------------------------
# overview: clean up temporary file on exit.
# @return: 0 always
# -----------------------------------------
cleanup() {
    if [[ -n "$TMP_FILE" && -f "$TMP_FILE" ]]; then
        rm -f "$TMP_FILE"
    fi
}
trap cleanup EXIT

# -----------------------------------------
# overview: save input (file or stdin) to a temporary file for re-use.
#
# @param:  $1  path to message file, or "-" for stdin
# @output: path to the temp file
# @return: 0 always
# -----------------------------------------
stage_input() {
    local input="$1"
    TMP_FILE=$(mktemp /tmp/commit-msg.XXXXXX)

    if [[ "$input" == "-" ]]; then
        cat > "$TMP_FILE"
    else
        cp "$input" "$TMP_FILE"
    fi
    echo "$TMP_FILE"
}

# -----------------------------------------
# overview: validate subject + body via commitlint (reads from file).
#
# @param:  $1  path to message file
# @output: commitlint output on failure
# @return: 0 = valid, non-zero = failed
# -----------------------------------------
check_commitlint() {
    local msg_file="$1"
    local result

    result=$(cat "$msg_file" | npx --no commitlint 2>/dev/null) || true

    if [[ -z "$result" ]]; then
        return 0
    else
        echo "$result"
        return 1
    fi
}

# -----------------------------------------
# overview: check that the subject line (first line) contains "#<N>"
#           after the colon. Expected format: type(scope?): #<N> <description>
#
# @param:  $1  path to message file
# @output: error message on failure
# @return: 0 = found, 1 = missing
# -----------------------------------------
check_issue_ref() {
    local msg_file="$1"
    local subject
    subject=$(head -n 1 "$msg_file")

    if echo "$subject" | grep -qE ':\s*#[0-9]+\s'; then
        return 0
    else
        echo "[FAIL] Subject line is missing '#<issue_number>' after the colon."
        echo "       Got:      $subject"
        echo "       Expected:  type(scope): #<N> description"
        return 1
    fi
}

# -----------------------------------------
# overview: print a summary of all checks performed.
# @return: 0 always
# -----------------------------------------
summarize() {
    echo ""
    echo "---"
    echo "Checks performed:"
    echo "  1. @commitlint/config-conventional (type, scope, subject format, body line length)"
    echo "  2. Issue reference (#<number>) present in subject line"
}

# =============================================================================
# Main
# =============================================================================
main() {
    local input="${1:--}"
    local failed=0

    stage_input "$input" > /dev/null

    echo "Checking commit message..."

    if ! check_commitlint "$TMP_FILE"; then
        echo -e "${RED}[FAIL]${NC} commitlint validation failed"
        failed=1
    else
        echo -e "${GREEN}[OK]${NC} commitlint validation passed"
    fi

    if ! check_issue_ref "$TMP_FILE"; then
        echo -e "${RED}[FAIL]${NC} issue reference check failed"
        failed=1
    else
        echo -e "${GREEN}[OK]${NC} issue reference (#<N>) found in subject"
    fi

    summarize

    if [[ $failed -ne 0 ]]; then
        exit 1
    fi
}

main "$@"
