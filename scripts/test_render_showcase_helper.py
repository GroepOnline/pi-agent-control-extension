import importlib.util
import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import mock_open, patch

ROOT = Path(__file__).resolve().parents[1]
SCRIPT_PATH = ROOT / "scripts" / "render-showcase-helper.py"

spec = importlib.util.spec_from_file_location("render_showcase_helper", str(SCRIPT_PATH))
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


class TestNormalizeProps(unittest.TestCase):
    def test_empty_props(self):
        with patch.object(
            sys, "argv", ["script", "normalize_props", "out.json", "auto", "test_source"]
        ):
            with patch.dict(os.environ, {"PROPS_JSON": "   "}):
                with self.assertRaises(SystemExit) as cm:
                    helper.cmd_normalize_props()
                self.assertEqual(str(cm.exception), "error: props JSON is empty: test_source")

    def test_invalid_json(self):
        with patch.object(
            sys, "argv", ["script", "normalize_props", "out.json", "auto", "test_source"]
        ):
            with patch.dict(os.environ, {"PROPS_JSON": "{invalid_json}"}):
                with self.assertRaises(SystemExit) as cm:
                    helper.cmd_normalize_props()
                self.assertTrue(
                    str(cm.exception).startswith("error: props JSON is invalid: test_source:")
                )

    def test_auto_fidelity_fallback(self):
        with patch.object(
            sys, "argv", ["script", "normalize_props", "out.json", "auto", "test_source"]
        ):
            with patch.dict(os.environ, {"PROPS_JSON": "{}"}):
                with (
                    patch("builtins.open", mock_open()) as m,
                    patch("builtins.print") as mock_print,
                ):
                    helper.cmd_normalize_props()

                    # Verify output JSON
                    handle = m()
                    written = "".join(call.args[0] for call in handle.write.mock_calls)
                    props = json.loads(written)
                    self.assertEqual(props["fidelity"], "standard")
                    self.assertEqual(props["width"], 1920)
                    self.assertEqual(props["height"], 1080)

                    # Verify print output
                    mock_print.assert_called_once_with("standard")

    def test_explicit_fidelity_override(self):
        with patch.object(
            sys, "argv", ["script", "normalize_props", "out.json", "inspect", "test_source"]
        ):
            with patch.dict(os.environ, {"PROPS_JSON": '{"fidelity": "standard"}'}):
                with (
                    patch("builtins.open", mock_open()) as m,
                    patch("builtins.print") as mock_print,
                ):
                    helper.cmd_normalize_props()

                    # Verify output JSON
                    handle = m()
                    written = "".join(call.args[0] for call in handle.write.mock_calls)
                    props = json.loads(written)
                    self.assertEqual(props["fidelity"], "inspect")
                    self.assertEqual(props["width"], 2560)
                    self.assertEqual(props["height"], 1440)

                    # Verify print output
                    mock_print.assert_called_once_with("inspect")

    def test_custom_dimensions(self):
        with patch.object(
            sys, "argv", ["script", "normalize_props", "out.json", "auto", "test_source"]
        ):
            with patch.dict(os.environ, {"PROPS_JSON": '{"width": 100, "height": 200}'}):
                with (
                    patch("builtins.open", mock_open()) as m,
                    patch("builtins.print") as mock_print,
                ):
                    helper.cmd_normalize_props()

                    # Verify output JSON
                    handle = m()
                    written = "".join(call.args[0] for call in handle.write.mock_calls)
                    props = json.loads(written)
                    self.assertEqual(props["fidelity"], "standard")
                    self.assertEqual(props["width"], 100)
                    self.assertEqual(props["height"], 200)

                    # Verify print output
                    mock_print.assert_called_once_with("standard")


if __name__ == "__main__":
    unittest.main()
