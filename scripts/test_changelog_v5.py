#!/usr/bin/env python3
"""Tests for CHANGELOG-v5.md content and structure."""
from __future__ import annotations
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHANGELOG_PATH = ROOT / "CHANGELOG-v5.md"

EXPECTED_FEATURES = [
    "Usage & Observability (/usage)",
    "Enhanced Guardrails",
    "Control Hub",
    "Targeted Parallel QA",
]


class TestChangelogV5Exists(unittest.TestCase):
    """File-level presence and readability checks."""

    def test_file_exists(self):
        """CHANGELOG-v5.md must be present at the repository root."""
        self.assertTrue(CHANGELOG_PATH.exists(), f"{CHANGELOG_PATH} not found")

    def test_file_is_not_empty(self):
        """File must contain at least some content."""
        self.assertGreater(CHANGELOG_PATH.stat().st_size, 0)

    def test_file_is_valid_utf8(self):
        """File must be decodable as UTF-8 (required for emoji support)."""
        try:
            content = CHANGELOG_PATH.read_text(encoding="utf-8")
        except UnicodeDecodeError as exc:
            self.fail(f"CHANGELOG-v5.md is not valid UTF-8: {exc}")
        self.assertIsInstance(content, str)


class TestChangelogV5Header(unittest.TestCase):
    """Version header format and value checks."""

    def setUp(self):
        self.content = CHANGELOG_PATH.read_text(encoding="utf-8")
        self.lines = self.content.splitlines()

    def test_first_line_is_version_header(self):
        """First line must be the H1 version header."""
        self.assertEqual(self.lines[0], "# v5.1 - Enhanced Control Layer")

    def test_version_is_v5_1(self):
        """Header must reference version v5.1, not any other version."""
        self.assertIn("v5.1", self.lines[0])

    def test_header_not_v4(self):
        """Regression: header must not still carry the v4 version string."""
        self.assertNotIn("v4", self.lines[0])

    def test_header_not_v5_0(self):
        """Header must not reference v5.0 — this changelog is for v5.1."""
        self.assertNotIn("v5.0", self.lines[0])

    def test_header_uses_h1_markdown(self):
        """Version header must use H1 markdown syntax (single '#')."""
        self.assertTrue(self.lines[0].startswith("# "))


class TestChangelogV5FeaturesSection(unittest.TestCase):
    """Features section structure and content checks."""

    def setUp(self):
        self.content = CHANGELOG_PATH.read_text(encoding="utf-8")
        self.lines = self.content.splitlines()

    def test_features_section_present(self):
        """File must contain a '## Features' section header."""
        self.assertIn("## Features", self.content)

    def test_features_section_uses_h2_markdown(self):
        """Features section header must use H2 markdown syntax."""
        self.assertIn("## Features", self.lines)

    def test_all_four_features_present(self):
        """All four expected features must appear in the changelog."""
        for feature in EXPECTED_FEATURES:
            with self.subTest(feature=feature):
                self.assertIn(feature, self.content)

    def test_features_use_bullet_syntax(self):
        """Each feature must be written as a markdown list item starting with '- '."""
        bullet_lines = [ln for ln in self.lines if ln.startswith("- ")]
        feature_bullets = [ln[2:] for ln in bullet_lines]
        for feature in EXPECTED_FEATURES:
            with self.subTest(feature=feature):
                self.assertIn(feature, feature_bullets)

    def test_exactly_four_feature_bullets(self):
        """There must be exactly four bullet items — no more, no fewer."""
        bullet_lines = [ln for ln in self.lines if ln.startswith("- ")]
        self.assertEqual(
            len(bullet_lines),
            4,
            f"Expected 4 feature bullets, found {len(bullet_lines)}: {bullet_lines}",
        )

    def test_usage_observability_includes_slash_command(self):
        """Usage & Observability feature must include the '/usage' command reference."""
        self.assertIn("/usage", self.content)

    def test_enhanced_guardrails_feature(self):
        """Enhanced Guardrails feature must be listed."""
        self.assertIn("Enhanced Guardrails", self.content)

    def test_control_hub_feature(self):
        """Control Hub feature must be listed."""
        self.assertIn("Control Hub", self.content)

    def test_targeted_parallel_qa_feature(self):
        """Targeted Parallel QA feature must be listed."""
        self.assertIn("Targeted Parallel QA", self.content)


class TestChangelogV5Attribution(unittest.TestCase):
    """Attribution line checks."""

    def setUp(self):
        self.content = CHANGELOG_PATH.read_text(encoding="utf-8")
        self.lines = self.content.splitlines()

    def test_attribution_line_present(self):
        """File must contain the 'Prepared by Code Legend' attribution."""
        self.assertIn("Prepared by Code Legend", self.content)

    def test_attribution_includes_emoji(self):
        """Attribution line must include the fire emoji (🔥)."""
        self.assertIn("🔥", self.content)

    def test_attribution_is_last_line(self):
        """Attribution must appear on the last line of the file."""
        last_line = self.lines[-1]
        self.assertIn("Prepared by Code Legend", last_line)

    def test_attribution_exact_text(self):
        """Attribution line must match the exact expected text."""
        self.assertIn("Prepared by Code Legend 🔥", self.lines[-1])


class TestChangelogV5Structure(unittest.TestCase):
    """Overall document structure and formatting checks."""

    def setUp(self):
        self.raw = CHANGELOG_PATH.read_bytes()
        self.content = self.raw.decode("utf-8")
        self.lines = self.content.splitlines()

    def test_line_count(self):
        """File must have exactly 9 lines (matching the PR stub)."""
        self.assertEqual(len(self.lines), 9)

    def test_no_trailing_newline(self):
        """File must not end with a trailing newline character."""
        self.assertFalse(
            self.raw.endswith(b"\n"),
            "CHANGELOG-v5.md should not have a trailing newline",
        )

    def test_features_section_appears_after_header(self):
        """'## Features' section must come after the H1 header line."""
        header_idx = next(
            (i for i, ln in enumerate(self.lines) if ln.startswith("# ")), None
        )
        features_idx = next(
            (i for i, ln in enumerate(self.lines) if ln == "## Features"), None
        )
        self.assertIsNotNone(header_idx, "H1 header not found")
        self.assertIsNotNone(features_idx, "## Features not found")
        self.assertGreater(features_idx, header_idx)

    def test_attribution_appears_after_features(self):
        """Attribution line must come after the features section."""
        features_idx = next(
            (i for i, ln in enumerate(self.lines) if ln == "## Features"), None
        )
        attribution_idx = next(
            (i for i, ln in enumerate(self.lines) if "Prepared by Code Legend" in ln),
            None,
        )
        self.assertIsNotNone(features_idx, "## Features not found")
        self.assertIsNotNone(attribution_idx, "Attribution line not found")
        self.assertGreater(attribution_idx, features_idx)

    def test_blank_line_between_header_and_features(self):
        """There must be a blank line between the H1 header and the Features section."""
        header_idx = next(
            (i for i, ln in enumerate(self.lines) if ln.startswith("# ")), None
        )
        self.assertIsNotNone(header_idx)
        self.assertEqual(
            self.lines[header_idx + 1],
            "",
            "Expected blank line immediately after the H1 header",
        )

    def test_blank_line_before_attribution(self):
        """There must be a blank line before the attribution line."""
        attribution_idx = next(
            (i for i, ln in enumerate(self.lines) if "Prepared by Code Legend" in ln),
            None,
        )
        self.assertIsNotNone(attribution_idx)
        self.assertGreater(attribution_idx, 0)
        self.assertEqual(
            self.lines[attribution_idx - 1],
            "",
            "Expected blank line immediately before the attribution line",
        )

    # --- Regression / negative tests ---

    def test_does_not_contain_todo_or_placeholder(self):
        """File must not contain common placeholder markers (TODO, TBD, FIXME, WIP)."""
        for marker in ("TODO", "TBD", "FIXME", "WIP"):
            with self.subTest(marker=marker):
                self.assertNotIn(marker, self.content.upper())

    def test_does_not_reference_v4_features(self):
        """File must not inadvertently include v4-specific feature text."""
        v4_only_terms = ["Extension-First", "pi-control/index.ts", "/reload"]
        for term in v4_only_terms:
            with self.subTest(term=term):
                self.assertNotIn(term, self.content)


if __name__ == "__main__":
    unittest.main(verbosity=2)
