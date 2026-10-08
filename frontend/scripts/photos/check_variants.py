"""Generator checks using temporary, synthetic photos. Requires Pillow.

Run: python frontend/scripts/photos/check_variants.py
"""

import contextlib
import importlib.util
import io
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image

SCRIPT = Path(__file__).with_name("make-variants.py")
SPEC = importlib.util.spec_from_file_location("make_variants", SCRIPT)
generator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(generator)


class PhotoVariantsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.owner = self.root / "site"
        self.photo(self.owner, "owner")

    def photo(self, site, name):
        originals = site / "photos" / "originals"
        originals.mkdir(parents=True, exist_ok=True)
        original = originals / f"{name}.jpg"
        Image.new("RGB", (640, 800), color=(50, 100, 150)).save(original, "JPEG")
        return original

    def run_generator(self, site_dir):
        env = dict(os.environ)
        env.pop("SITE_DIR", None)
        if site_dir is not None:
            env["SITE_DIR"] = str(site_dir)
        with patch.dict(os.environ, env, clear=True), patch.object(generator, "REPO_ROOT", self.root):
            with contextlib.redirect_stdout(io.StringIO()):
                generator.main()

    def assert_variants(self, site, name):
        output = site / "public" / "profile-photos"
        self.assertEqual(
            sorted(path.name for path in output.iterdir()),
            [f"{name}-{width}.webp" for width in (160, 320, 480)],
        )
        for width in (160, 320, 480):
            with Image.open(output / f"{name}-{width}.webp") as image:
                self.assertEqual(image.format, "WEBP")
                self.assertEqual(image.size, (width, width))

    def test_default_site_and_empty_setting(self):
        for setting in (None, ""):
            with self.subTest(setting=setting):
                original = self.owner / "photos" / "originals" / "owner.jpg"
                before = original.read_bytes()
                self.run_generator(setting)
                self.assert_variants(self.owner, "owner")
                self.assertEqual(original.read_bytes(), before)

    def test_absolute_and_repo_relative_site_dir_use_only_selected_site(self):
        for setting in ("alternate", self.root / "absolute"):
            with self.subTest(setting=setting):
                site = self.root / setting
                original = self.photo(site, "fixture")
                before = original.read_bytes()
                self.run_generator(setting)
                self.assert_variants(site, "fixture")
                self.assertEqual(original.read_bytes(), before)
                self.assertFalse((self.owner / "public").exists())

    def test_site_without_originals_never_falls_back_to_owner(self):
        example = self.root / "site.example"
        example.mkdir()
        self.run_generator("site.example")
        self.assertEqual(list(example.iterdir()), [])
        self.assertFalse((self.owner / "public").exists())


if __name__ == "__main__":
    unittest.main()
