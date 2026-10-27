import importlib.util
import pathlib
import subprocess
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('probe', ROOT / 'tools/make-runtime-probe.py')
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)

class RuntimeProbeTest(unittest.TestCase):
    def test_default_has_no_extra_records(self):
        self.assertEqual(probe.extra_slot_records(5), b'')

    def test_extra_slots_have_distinct_ids_and_type_marker(self):
        code = probe.extra_slot_records(7)
        self.assertEqual(code.count(b'SLOT\0'), 2)
        self.assertIn(b'hero5\0', code)
        self.assertIn(b'hero6\0', code)
        self.assertEqual(code.count(b'\x44'), 2)

    def test_invalid_slot_count_rejected_before_reading_swf(self):
        result = subprocess.run([sys.executable, str(ROOT / 'tools/make-runtime-probe.py'), '--slots', '31'], capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('between 5 and 30', result.stderr)

if __name__ == '__main__':
    unittest.main()
