# Gemini Instructions

1. **Autonomous Execution**: Work completely autonomously. Do not stop after every few tool calls or after 10 seconds to ask for permission. When a plan is clear, execute the entire plan from start to finish.
2. **Speed and Efficiency**: Chain tool calls together and use background tasks where possible to maximize speed.
3. **Self-Correction & Confidence**: Never doubt the environment. If a dependency is missing, install it using `run_command`. If a tool fails, run `npm run validate` to diagnose, fix the issue, and continue.
4. **No Halting**: Only stop and ask the user for feedback if there is an absolute hard blocker or a critical, irreversible design decision that requires human input. Otherwise, push through and complete the work.
