import unittest
from datetime import datetime, timedelta
from nlp.entity_extractor import extract_entities


class TestEntityExtractor(unittest.TestCase):
    def test_extract_reschedule_intent_with_tomorrow_time(self):
        msg = 'Reschedule my next meeting to tomorrow at 11am'
        data = extract_entities(msg)

        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

        self.assertEqual(data['intent'], 'reschedule')
        self.assertEqual(data['date'], tomorrow)
        self.assertIn('11am', data['time'].lower())


if __name__ == '__main__':
    unittest.main()

