import json
import os
import sys


def cmd_normalize_props():
    output_file = sys.argv[2]
    fidelity_override = sys.argv[3]
    props_source = sys.argv[4]
    raw_props = os.environ["PROPS_JSON"]

    if not raw_props.strip():
        raise SystemExit(f"error: props JSON is empty: {props_source}")

    try:
        props = json.loads(raw_props)
    except json.JSONDecodeError as error:
        raise SystemExit(
            f"error: props JSON is invalid: {props_source}: {error.msg} at line {error.lineno} column {error.colno}"
        ) from error

    if fidelity_override != "auto":
        props["fidelity"] = fidelity_override

    fidelity = props.get("fidelity")
    if fidelity is None:
        fidelity = "standard"
        props["fidelity"] = fidelity

    if props.get("width") is None:
        props["width"] = 2560 if fidelity == "inspect" else 1920
    if props.get("height") is None:
        props["height"] = 1440 if fidelity == "inspect" else 1080

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(props, f)

    print(fidelity)


def cmd_props_number():
    key = sys.argv[2]
    value = json.loads(os.environ["PROPS_JSON"]).get(key)
    print("" if value is None else value)


def cmd_rewrite_props_clips():
    props = json.loads(os.environ["PROPS_JSON"])
    props["clips"] = list(sys.argv[2:])
    print(json.dumps(props))


def cmd_cast_dimensions():
    with open(sys.argv[2], "r", encoding="utf-8") as f:
        header = json.loads(f.readline())
    print(header.get("width", 120), header.get("height", 36))


def cmd_get_clip_duration():
    d = json.load(sys.stdin)
    print("yes" if d.get("clipDuration") else "no")


def cmd_set_clip_duration():
    dur = sys.argv[2]
    d = json.load(sys.stdin)
    d["clipDuration"] = round(float(dur), 2)
    json.dump(d, sys.stdout)


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "normalize_props":
        cmd_normalize_props()
    elif cmd == "props_number":
        cmd_props_number()
    elif cmd == "rewrite_props_clips":
        cmd_rewrite_props_clips()
    elif cmd == "cast_dimensions":
        cmd_cast_dimensions()
    elif cmd == "get_clip_duration":
        cmd_get_clip_duration()
    elif cmd == "set_clip_duration":
        cmd_set_clip_duration()
    else:
        raise SystemExit(f"error: unknown command {cmd}")
