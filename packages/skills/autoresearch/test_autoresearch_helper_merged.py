import os
import sys
import unittest

# Improve Python path handling to ensure relative/robust imports
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    from .autoresearch_helper import compute_mad, find_baseline
except (ImportError, ValueError):
    from autoresearch_helper import compute_mad, find_baseline


class TestAutoresearchHelper(unittest.TestCase):
    def test_compute_mad_empty(self):
        """Test with an empty list."""
        self.assertEqual(compute_mad([]), 0.0)

    def test_compute_mad_single_element(self):
        """Test with a single element list."""
        self.assertEqual(compute_mad([1]), 0.0)

    def test_compute_mad_multiple_elements(self):
        """Test with multiple elements."""
        # values: [1, 1, 2, 2, 4, 6, 9]
        # median: 2
        # deviations: [1, 1, 0, 0, 2, 4, 7]
        # sorted deviations: [0, 0, 1, 1, 2, 4, 7]
        # median of deviations: 1
        self.assertEqual(compute_mad([1, 1, 2, 2, 4, 6, 9]), 1.0)

    def test_compute_mad_even_elements(self):
        """Test with an even number of elements."""
        # values: [1, 2, 3, 4]
        # median: 2.5
        # deviations: [1.5, 0.5, 0.5, 1.5]
        # sorted deviations: [0.5, 0.5, 1.5, 1.5]
        # median of deviations: 1.0
        self.assertEqual(compute_mad([1, 2, 3, 4]), 1.0)

    def test_compute_mad_negative_numbers(self):
        """Test with negative numbers."""
        # values: [-5, -2, -1, 0, 2]
        # median: -1
        # deviations: [4, 1, 0, 1, 3]
        # sorted deviations: [0, 1, 1, 3, 4]
        # median of deviations: 1
        self.assertEqual(compute_mad([-5, -2, -1, 0, 2]), 1.0)

    def test_compute_mad_floats(self):
        """Test with floating point numbers."""
        # values: [1.5, 2.5, 3.5, 4.5]
        # median: 3.0
        # deviations: [1.5, 0.5, 0.5, 1.5]
        # sorted deviations: [0.5, 0.5, 1.5, 1.5]
        # median of deviations: 1.0
        self.assertEqual(compute_mad([1.5, 2.5, 3.5, 4.5]), 1.0)

    def test_find_baseline_empty_results(self):
        """Test with empty results."""
        self.assertIsNone(find_baseline([], 0))

    def test_find_baseline_no_segment_match(self):
        """Test when no results match the segment."""
        results = [{"segment": 1, "metric": 10.0}, {"segment": 1, "metric": 12.0}]
        self.assertIsNone(find_baseline(results, 0))

    def test_find_baseline_with_matching_segment(self):
        """Test finding the baseline in the correct segment."""
        results = [
            {"segment": 0, "metric": 10.0},
            {"segment": 0, "metric": 9.0},
            {"segment": 1, "metric": 5.0},
            {"segment": 1, "metric": 4.0},
        ]
        # Baseline is the first experiment in the current segment
        self.assertEqual(find_baseline(results, 0), 10.0)
        self.assertEqual(find_baseline(results, 1), 5.0)

    def test_find_baseline_missing_segment_key(self):
        """Test when results are missing the 'segment' key (defaults to 0)."""
        results = [
            {"metric": 15.0},  # Defaults to segment 0
            {"segment": 0, "metric": 14.0},
            {"segment": 1, "metric": 8.0},
        ]
        self.assertEqual(find_baseline(results, 0), 15.0)


if __name__ == "__main__":
    unittest.main()
