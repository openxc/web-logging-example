from tornado.httpclient import HTTPRequest
import json
import os.path

from util import generate_filename
from settings import settings

from tests.base import BaseRecorderTestCase


class RecordTestCase(BaseRecorderTestCase):
    def _insert_records(self):
        data = {'records': [
            {'timestamp': 1332975697.078000, 'name': 'vehicle_speed',
                    'value': 42.0},
            {'timestamp': 1332975698.078000, 'name': 'vehicle_speed',
                    'value': 39.0},
            {'timestamp': 1332975699.078000, 'name': 'vehicle_speed',
                    'value': 31.0},
            {'timestamp': 1332975698.078000, 'name':
                'fuel_consumed_since_restart',
                    'value': 0.017},
            {'timestamp': 1332975699.078000, 'name':
                'fuel_consumed_since_restart',
                    'value': 0.02},
            {'timestamp': 1332975700.078000, 'name':
                'fuel_consumed_since_restart',
                    'value': 0.023},
            {'timestamp': 1332975697.078000, 'name': 'latitude',
                    'value': 42.0},
            {'timestamp': 1332975698.078000, 'name': 'longitude',
                    'value': -90.0}
        ]}
        self.http_client.fetch(HTTPRequest(self.get_url('/records'),
                'POST',
                headers=dict(content_type='application/json'),
                body=json.dumps(data)),
                self.stop)
        self.wait()

    def test_create_records(self):
        filename = generate_filename(settings)
        assert not os.path.exists(filename)
        self._insert_records()
        assert os.path.exists(filename)
        for line in open(filename):
            record = json.loads(line.split(':', 1)[1])
            assert record['name'] in ('vehicle_speed',
                    'fuel_consumed_since_restart',
                    'longitude', 'latitude')

