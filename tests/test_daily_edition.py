import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('content', 'scripts/update/content.py')
content = importlib.util.module_from_spec(spec)
spec.loader.exec_module(content)

class DailyEditionTest(unittest.TestCase):
    def test_generation_and_rerun(self):
        with tempfile.TemporaryDirectory() as folder:
            articles = Path(folder) / 'articles.json'
            editions = Path(folder) / 'editions.json'
            articles.write_text('[]')
            editions.write_text('[]')
            def fake(query, section, image, today):
                return {'id': today + '-' + content.slug(section), 'date': today, 'title': query}
            with patch.object(content, 'ARTICLES_FILE', articles), patch.object(content, 'EDITIONS_FILE', editions), patch.object(content, 'fetch_article', side_effect=fake):
                content.main()
                first = json.loads(editions.read_text())
                content.main()
                current = json.loads(editions.read_text())
                rows = json.loads(articles.read_text())
                self.assertEqual(first, current)
                self.assertEqual(current[0]['articleIds'], [a['id'] for a in rows])
                with patch.object(content, 'fetch_article', return_value=None):
                    with self.assertRaises(RuntimeError):
                        content.main()
                self.assertEqual(current, json.loads(editions.read_text()))

if __name__ == '__main__':
    unittest.main()
