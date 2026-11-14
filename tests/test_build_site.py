import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("build_site", "scripts/build_site.py")
site = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site)

class BuildSiteTest(unittest.TestCase):
    def test_only_current_articles_and_active_files_are_published(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for name in site.PAGES + site.SCRIPTS:
                (root / name).write_text("test")
            for name in ("assets", "js", "data"):
                (root / name).mkdir()
            editions = [{"date":"2026-11-14", "articleIds":["new"]}, {"date":"2026-11-13", "articleIds":["old"]}]
            articles = [{"id":"new", "date":"2026-11-14"}, {"id":"old", "date":"2026-11-13", "body":["private"]}]
            for name, value in (("editions",editions),("articles",articles),("columns",[]),("markets",{})):
                (root / "data" / (name + ".json")).write_text(json.dumps(value))
            (root / "content.json").write_text("old content")
            (root / "toegang-config.js").write_text("obsolete config")
            site.build(root, root / "output")
            published = json.loads((root / "output/data/articles.json").read_text())
            self.assertEqual([a["id"] for a in published], ["new"])
            self.assertFalse((root / "output/content.json").exists())
            self.assertFalse((root / "output/toegang-config.js").exists())
            self.assertTrue((root / "output/.nojekyll").exists())
            (root / "data/articles.json").write_text("[]")
            with self.assertRaises(ValueError):
                site.build(root, root / "output")
            self.assertEqual(json.loads((root / "output/data/articles.json").read_text()), published)
