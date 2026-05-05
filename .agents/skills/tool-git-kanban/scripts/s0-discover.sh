#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_lib.sh"

#-----------------------------------------
# overview: discover repository and GitHub Project metadata for kanban sync
#
# @param: --owner OWNER           GitHub user/org that owns the project, optional
# @param: --project-number NUM    GitHub Projects v2 number, optional
# @output: JSON with repo owner/name, project candidates or selected project fields
# @return: 0 on success
#-----------------------------------------
function main {
  local project_owner=""
  local project_number=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --owner)
        project_owner="${2:-}"
        shift 2
        ;;
      --project-number)
        project_number="${2:-}"
        shift 2
        ;;
      -h|--help)
        usage_error "usage: s0-discover.sh [--owner OWNER] [--project-number NUM]"
        ;;
      *)
        usage_error "unknown argument: $1"
        ;;
    esac
  done

  require_gh_project_auth

  local repo_json repo_owner repo_name
  repo_json="$(gh repo view --json owner,name)"
  repo_owner="$(jq -r '.owner.login' <<<"$repo_json")"
  repo_name="$(jq -r '.name' <<<"$repo_json")"

  if [[ -z "$project_owner" ]]; then
    project_owner="$repo_owner"
  fi

  if [[ -z "$project_number" ]]; then
    local projects
    # Use GraphQL to avoid needing read:org scope for project listing
    projects="$(gh api graphql -f query='
      query {
        viewer {
          projectsV2(first: 20) {
            nodes {
              number
              title
              id
              shortDescription
              url
            }
          }
        }
      }
    ' | jq '[.data.viewer.projectsV2.nodes[] | {number: .number, title: .title}]')" || {
      # Fallback to gh project list (requires read:org scope)
      projects="$(gh project list --owner "$project_owner" --format json 2>/dev/null || echo '[]')"
    }
    jq -n \
      --arg repoOwner "$repo_owner" \
      --arg repoName "$repo_name" \
      --arg projectOwner "$project_owner" \
      --argjson projects "$projects" \
      '{repo:{owner:$repoOwner,name:$repoName}, project_owner:$projectOwner, projects:$projects}'
    return 0
  fi

  local fields
  # Use viewer-based GraphQL query (avoids needing read:org scope)
  # User projects are accessed via viewer, not repository
  fields="$(gh api graphql -f query="
    query {
      viewer {
        projectV2(number: $project_number) {
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                }
              }
              ... on ProjectV2Field {
                id
                name
              }
            }
          }
        }
      }
    }
  " | jq '[.data.viewer.projectV2.fields.nodes[]]')" || {
    # Fallback to gh project field-list (requires read:org scope)
    fields="$(gh project field-list "$project_number" --owner "$project_owner" --format json 2>/dev/null || echo '[]')"
  }
  jq -n \
    --arg repoOwner "$repo_owner" \
    --arg repoName "$repo_name" \
    --arg projectOwner "$project_owner" \
    --arg projectNumber "$project_number" \
    --argjson fields "$fields" \
    '{repo:{owner:$repoOwner,name:$repoName}, project:{owner:$projectOwner, number:($projectNumber|tonumber), fields:$fields}}'
}

main "$@"
