import subprocess
import unittest
from pathlib import Path

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
        self.assertIn("All 17 skills present", self.stdout)

    def test_system_dependencies(self):
        self.assertIn("Checking system dependencies...", self.stdout)
        self.assertIn("Binary: python3", self.stdout)
        self.assertIn("Binary: ruff", self.stdout)
        self.assertIn("Binary: ffmpeg", self.stdout)


if __name__ == "__main__":
    unittest.main()
