import importlib.util
import os
import sys
import unittest

# Safely import autoresearch_helper
file_path = os.path.join(os.path.dirname(__file__), "autoresearch_helper.py")
spec = importlib.util.spec_from_file_location("autoresearch_helper", file_path)
helper = importlib.util.module_from_spec(spec)
sys.modules["autoresearch_helper"] = helper
spec.loader.exec_module(helper)


class TestIsBetter(unittest.TestCase):
    def test_is_better_lower_direction(self):
        # direction = "lower"
        # current < best should return True
        self.assertTrue(helper.is_better(10, 20, "lower"))

        # current > best should return False
        self.assertFalse(helper.is_better(30, 20, "lower"))

        # current == best should return False
        self.assertFalse(helper.is_better(20, 20, "lower"))

    def test_is_better_higher_direction(self):
        # direction = "higher"
        # current > best should return True
        self.assertTrue(helper.is_better(30, 20, "higher"))

        # current < best should return False
        self.assertFalse(helper.is_better(10, 20, "higher"))

        # current == best should return False
        self.assertFalse(helper.is_better(20, 20, "higher"))


if __name__ == "__main__":
    unittest.main()
