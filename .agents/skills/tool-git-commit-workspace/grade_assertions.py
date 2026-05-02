#!/usr/bin/env python3
"""
Auto-grader for tool-git-commit skill.
Checks generated commit messages against structural assertions.
"""
import re
import sys
import json

def check_assertions(msg_file):
    with open(msg_file) as f:
        msg = f.read()

    lines = msg.strip().split('\n')
    subject = lines[0] if lines else ''
    body = '\n'.join(lines[1:]) if len(lines) > 1 else ''

    VALID_TYPES = {'feat','fix','docs','style','refactor','perf','test','chore','ci','build','revert'}

    results = []

    # 1. Conventional Commits subject format (#N or #? placeholder)
    m = re.match(r'^(\w+)(\([^)]+\))?:\s+#(\d+|\?)\s+.+', subject)
    passed = bool(m)
    results.append({
        "text": "Subject matches format: type(scope?): #N description",
        "passed": passed,
        "evidence": f"Subject: '{subject}'"
    })

    # 2. Valid type
    if m:
        t = m.group(1)
        passed = t in VALID_TYPES
    else:
        passed = False
    results.append({
        "text": "Type is a valid Conventional Commits type",
        "passed": passed,
        "evidence": f"Type from subject: '{m.group(1) if m else 'N/A'}'"
    })

    # 3. Issue ref in subject (#N or #? placeholder)
    passed = bool(re.search(r':\s*#(\d+|\?)\s', subject))
    results.append({
        "text": "Subject contains '#<N>' issue reference (or '#?' placeholder) after the colon",
        "passed": passed,
        "evidence": f"Subject: '{subject}'"
    })

    # 4. Subject no trailing period
    passed = not subject.rstrip().endswith('.')
    results.append({
        "text": "Subject does not end with a period",
        "passed": passed,
        "evidence": f"Subject ends with: '{subject[-1] if subject else ''}'"
    })

    # 5. DESC header present
    passed = 'DESC' in body and '===' in body
    results.append({
        "text": "Body contains 'DESC' header followed by '==='",
        "passed": passed,
        "evidence": "DESC/=== found" if passed else "DESC/=== missing"
    })

    # 6. code: subsection
    passed = bool(re.search(r'^code:\s*$', body, re.MULTILINE))
    results.append({
        "text": "Body contains 'code:' subsection",
        "passed": passed,
        "evidence": "'code:' section found" if passed else "'code:' section missing"
    })

    # 7. test: subsection
    passed = bool(re.search(r'^test:\s*$', body, re.MULTILINE))
    results.append({
        "text": "Body contains 'test:' subsection",
        "passed": passed,
        "evidence": "'test:' section found" if passed else "'test:' section missing"
    })

    # 8. summarize: subsection
    passed = bool(re.search(r'^summarize:\s*$', body, re.MULTILINE))
    results.append({
        "text": "Body contains 'summarize:' subsection",
        "passed": passed,
        "evidence": "'summarize:' section found" if passed else "'summarize:' section missing"
    })

    # 9. Co-Authored-By footer
    passed = 'Co-Authored-By:' in body
    results.append({
        "text": "Footer includes 'Co-Authored-By: Claude Opus' line",
        "passed": passed,
        "evidence": "Co-Authored-By found" if passed else "Co-Authored-By missing"
    })

    # 10. Body line length under 200
    long_lines = [l for l in lines[1:] if len(l) > 200]
    passed = len(long_lines) == 0
    results.append({
        "text": "All body lines are under 200 characters",
        "passed": passed,
        "evidence": f"{len(long_lines)} lines over 200" if long_lines else "All lines OK"
    })

    # 11. Subject description is non-empty after issue ref
    m2 = re.match(r'^\w+(\([^)]+\))?:\s*#(\d+|\?)\s+(.+)', subject)
    passed = bool(m2 and m2.group(2).strip())
    results.append({
        "text": "Subject has a non-empty description after the issue reference",
        "passed": passed,
        "evidence": f"Description: '{m2.group(2).strip() if m2 else 'N/A'}'"
    })

    return results

def main():
    msg_file = sys.argv[1]
    results = check_assertions(msg_file)

    passed = sum(1 for r in results if r['passed'])
    total = len(results)

    grading = {
        "expectations": results,
        "summary": {
            "passed": passed,
            "failed": total - passed,
            "total": total,
            "pass_rate": round(passed / total, 2) if total > 0 else 0
        }
    }
    json.dump(grading, sys.stdout, indent=2)

if __name__ == '__main__':
    main()
