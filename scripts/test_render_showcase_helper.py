import importlib.util
import json
import os
import subprocess
import sys
import tempfile
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

    def test_partial_dimensions_fill_only_the_missing_axis(self):
        # A half-specified pair must keep the given axis and fill the other one
        # from the chosen profile, not overwrite both with the default pair.
        cases = [
            ('{"fidelity": "inspect", "width": 1920}', 1920, 1440),
            ('{"fidelity": "inspect", "height": 1080}', 2560, 1080),
            ('{"fidelity": "standard", "width": 1280}', 1280, 1080),
            ('{"fidelity": "inspect", "width": 1920, "height": null}', 1920, 1440),
        ]
        for props_json, expected_width, expected_height in cases:
            with self.subTest(props_json=props_json):
                with patch.object(
                    sys,
                    "argv",
                    ["script", "normalize_props", "out.json", "auto", "test_source"],
                ):
                    with patch.dict(os.environ, {"PROPS_JSON": props_json}):
                        with (
                            patch("builtins.open", mock_open()) as m,
                            patch("builtins.print"),
                        ):
                            helper.cmd_normalize_props()

                            handle = m()
                            written = "".join(
                                call.args[0] for call in handle.write.mock_calls
                            )
                            props = json.loads(written)
                            self.assertEqual(props["width"], expected_width)
                            self.assertEqual(props["height"], expected_height)


class TestResolveFidelity(unittest.TestCase):
    def test_auto_override_picks_inspect_for_side_by_side(self):
        self.assertEqual(
            helper.resolve_fidelity({"layout": "side-by-side"}, "auto"), "inspect"
        )

    def test_auto_override_picks_standard_for_single(self):
        props = {"layout": "single"}
        self.assertEqual(helper.resolve_fidelity(props, "auto"), "standard")

    def test_props_auto_picks_inspect_for_side_by_side(self):
        props = {"layout": "side-by-side", "fidelity": "auto"}
        self.assertEqual(helper.resolve_fidelity(props, "auto"), "inspect")

    def test_props_auto_picks_standard_for_single(self):
        props = {"layout": "single", "fidelity": "auto"}
        self.assertEqual(helper.resolve_fidelity(props, "auto"), "standard")

    def test_omitted_fidelity_matches_auto(self):
        omitted = {"layout": "side-by-side"}
        explicit = {"layout": "side-by-side", "fidelity": "auto"}
        self.assertEqual(
            helper.resolve_fidelity(omitted, "auto"),
            helper.resolve_fidelity(explicit, "auto"),
        )

    def test_explicit_props_fidelity_wins_over_auto(self):
        props = {"layout": "side-by-side", "fidelity": "compact"}
        self.assertEqual(helper.resolve_fidelity(props, "auto"), "compact")

    def test_explicit_override_wins_over_props(self):
        auto_props = {"layout": "side-by-side", "fidelity": "auto"}
        self.assertEqual(helper.resolve_fidelity(auto_props, "standard"), "standard")
        compact_props = {"layout": "single", "fidelity": "compact"}
        self.assertEqual(helper.resolve_fidelity(compact_props, "inspect"), "inspect")

    def test_unknown_profile_is_passed_through_unchanged(self):
        # The shell wrapper owns rejection of unknown profiles; the helper must
        # not silently reinterpret anything other than `auto`.
        self.assertEqual(helper.resolve_fidelity({}, "bogus"), "bogus")
        props = {"layout": "side-by-side", "fidelity": "bogus"}
        self.assertEqual(helper.resolve_fidelity(props, "auto"), "bogus")


class TestNormalizePropsAutoEndToEnd(unittest.TestCase):
    """Runs the helper's CLI entry point so `fidelity: auto` from the compose
    skill's props template can never reach the shell as an unsupported profile."""

    def _run(self, props_json, fidelity_override="auto"):
        tmp = tempfile.NamedTemporaryFile("r", suffix=".json", delete=False)
        tmp.close()
        self.addCleanup(os.unlink, tmp.name)
        env = dict(os.environ, PROPS_JSON=props_json)
        result = subprocess.run(
            [
                sys.executable,
                str(SCRIPT_PATH),
                "normalize_props",
                tmp.name,
                fidelity_override,
                "inline",
            ],
            env=env,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        with open(tmp.name, encoding="utf-8") as f:
            return result.stdout.strip(), json.load(f)

    def test_cli_resolves_auto_for_side_by_side(self):
        props_json = (
            '{"layout": "side-by-side", "fidelity": "auto",'
            ' "clips": ["a.cast", "b.cast"]}'
        )
        printed, props = self._run(props_json)
        self.assertEqual(printed, "inspect")
        self.assertEqual(props["fidelity"], "inspect")
        self.assertEqual(props["width"], 2560)
        self.assertEqual(props["height"], 1440)

    def test_cli_resolves_auto_for_single(self):
        printed, props = self._run('{"layout": "single", "fidelity": "auto"}')
        self.assertEqual(printed, "standard")
        self.assertEqual(props["fidelity"], "standard")
        self.assertEqual(props["width"], 1920)
        self.assertEqual(props["height"], 1080)

    def test_cli_preserves_explicit_profiles(self):
        for profile in ("compact", "standard", "inspect"):
            with self.subTest(profile=profile):
                printed, props = self._run(
                    '{"layout": "side-by-side", "fidelity": "%s"}' % profile
                )
                self.assertEqual(printed, profile)
                self.assertEqual(props["fidelity"], profile)

    def test_cli_fidelity_override_drives_dimension_defaults(self):
        # The --fidelity flag wins over the props, so it also decides which
        # profile default fills a missing height.
        printed, props = self._run(
            '{"layout": "single", "fidelity": "standard", "width": 1920}',
            fidelity_override="inspect",
        )
        self.assertEqual(printed, "inspect")
        self.assertEqual(props["fidelity"], "inspect")
        self.assertEqual(props["width"], 1920)
        self.assertEqual(props["height"], 1440)


if __name__ == "__main__":
    unittest.main()
