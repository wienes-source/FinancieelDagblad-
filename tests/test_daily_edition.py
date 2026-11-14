import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from datetime import datetime, timedelta, timezone
from email.utils import format_datetime
from io import BytesIO
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('content', 'scripts/update/content.py')
content = importlib.util.module_from_spec(spec)
spec.loader.exec_module(content)

class DailyEditionTest(unittest.TestCase):
    def test_feed_skips_old_undated_and_future_news(self):
        now = datetime.now(timezone.utc)
        old = format_datetime(now - timedelta(days=300), usegmt=True)
        current = format_datetime(now - timedelta(hours=2), usegmt=True)
        future = format_datetime(now + timedelta(days=1), usegmt=True)
        xml = f"""<rss><channel>
        <item><title>Oud bericht</title><pubDate>{old}</pubDate></item>
        <item><title>Zonder datum</title></item>
        <item><title>Toekomst</title><pubDate>{future}</pubDate></item>
        <item><title>Actueel - Bron</title><pubDate>{current}</pubDate><link>https://example.org/news</link></item>
        </channel></rss>""".encode()
        with patch.object(content.urllib.request, "urlopen", return_value=BytesIO(xml)):
            article = content.fetch_article("test", "Economie", "assets/test.jpg", "2026-11-14")
        self.assertEqual(article["title"], "Actueel")
        self.assertEqual(article["source"], "Bron")
        self.assertIn("publishedAt", article)
        with patch.object(content.urllib.request, "urlopen", return_value=BytesIO(f"<rss><channel><item><title>Oud</title><pubDate>{old}</pubDate></item></channel></rss>".encode())):
            self.assertIsNone(content.fetch_article("test", "Economie", "test", "2026-11-14"))

    def test_generation_and_rerun(self):
        with tempfile.TemporaryDirectory() as folder:
            articles = Path(folder) / 'articles.json'
            editions = Path(folder) / 'editions.json'
            articles.write_text('[]')
            editions.write_text('[]')
            def fake(query, section, image, today):
                return {'id': today + '-' + content.slug(section), 'date': today, 'title': query}
            with patch.object(content, 'fetch_exchange_rate', return_value={'date': '2026-09-10', 'base': 'EUR', 'quote': 'SRD', 'rate': 43.8575}), patch.object(content, 'ARTICLES_FILE', articles), patch.object(content, 'EDITIONS_FILE', editions), patch.object(content, 'fetch_article', side_effect=fake):
                content.main()
                first = json.loads(editions.read_text())
                content.main()
                current = json.loads(editions.read_text())
                rows = json.loads(articles.read_text())
                self.assertEqual(first, current)
                self.assertEqual(current[0]['articleIds'], [a['id'] for a in rows])
                with patch.object(content, 'fetch_article', return_value=None):
                    self.assertFalse(content.main())
                self.assertEqual(current, json.loads(editions.read_text()))
                self.assertEqual(rows, json.loads(articles.read_text()))
                articles.write_text('[]')
                editions.write_text('[]')
                with patch.object(content, 'fetch_article', return_value=None):
                    with self.assertRaises(RuntimeError):
                        content.main()

if __name__ == '__main__':
    unittest.main()

