# Install — Pi Agent Control Extension

## Package install

```bash
cd pi-agent-control-extension
pi install .
```

Pi reads `package.json` and loads:

```json
{
  "pi": {
    "extensions": ["./extensions/pi-control/index.ts"],
    "skills": ["./skills"],
    "prompts": ["./prompts"]
  }
}
```

## Development install

Open the package root with Pi. The wrapper at `.pi/extensions/pi-control/index.ts` makes the extension project-local and hot-reloadable:

```text
/reload
```

## One-off test

```bash
pi -e ./extensions/pi-control/index.ts
```

## Validate

```bash
npm run doctor
```
