# Evidence Schema

Every report should include:

```yaml
target: string
driver: tuistory | true-input | agent-browser
claim: string
result: CONFIRMED | REFUTED | INCONCLUSIVE
environment:
  os: string
  terminal_or_browser: string
  repo: string
  branch: string
  commit: string
evidence:
  - type: snapshot | screenshot | byte-dump | video | command-log
    path: string
    description: string
artifacts:
  video: string
  report: string
known_gaps:
  - string
```
