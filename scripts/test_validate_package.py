import importlib.util
import io
import subprocess
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


class TestValidatePackage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.result = subprocess.run(
            ["python3", "scripts/validate-package.py"],
            cwd=str(ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
        cls.stdout = cls.result.stdout

    def test_required_files(self):
        self.assertIn("Required file: package.json", self.stdout)
        self.assertIn("Required file: extensions/pi-control/index.ts", self.stdout)
        self.assertIn("Required file: scripts/validate-package.py", self.stdout)
        self.assertIn("Required file: bin/tctl", self.stdout)

    def test_manifest_skills(self):
        self.assertIn("PI manifest: extensions", self.stdout)
        self.assertIn("PI manifest: skills", self.stdout)
        self.assertIn("Keyword: pi-package", self.stdout)
        self.assertIn("All 26 skills present", self.stdout)

    def test_system_dependencies(self):
        self.assertIn("Checking system dependencies...", self.stdout)
        self.assertIn("Binary: python3", self.stdout)
        self.assertIn("Binary: ruff", self.stdout)
        self.assertIn("Binary: ffmpeg", self.stdout)


class TestValidatePackageCheckFunction(unittest.TestCase):
    def setUp(self):
        # We need to import the script as a module
        spec = importlib.util.spec_from_file_location(
            "validate_package", str(ROOT / "scripts" / "validate-package.py")
        )
        self.module = importlib.util.module_from_spec(spec)

        # Suppress output during import
        with patch("sys.stdout", new_callable=io.StringIO):
            spec.loader.exec_module(self.module)

        # Reset errors list for our tests
        self.module.errors = []

    @patch("sys.stdout", new_callable=io.StringIO)
    def test_check_success(self, mock_stdout):
        self.module.check("Everything is fine", True)
        self.assertIn("[OK] Everything is fine", mock_stdout.getvalue())
        self.assertEqual(len(self.module.errors), 0)

    @patch("sys.stdout", new_callable=io.StringIO)
    def test_check_failure(self, mock_stdout):
        self.module.check("Something went wrong", False)
        self.assertIn("[FAIL] Something went wrong", mock_stdout.getvalue())
        self.assertEqual(len(self.module.errors), 1)
        self.assertIn("Something went wrong", self.module.errors)


if __name__ == "__main__":
    unittest.main()
