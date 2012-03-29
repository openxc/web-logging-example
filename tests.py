#!/usr/bin/env bash
import unittest2 as unittest
import os.path
import json

from util import generate_filename
from recorder import create_app


class BaseRecorderTestCase(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config.from_pyfile("test_settings.py")
        self.client = self.app.test_client()
        self.app.test_request_context().push()


class RecordTestCase(BaseRecorderTestCase):
    def test_create_records(self):
        data = {'records': [
            {'timestamp': 1332975697.078000, 'name': 'steering_wheel_angle',
                    'value': 42.0},
            {'timestamp': 1332975698.078000, 'name': 'steering_wheel_angle',
                    'value': 38.0}
        ]}
        filename = generate_filename(self.app.config)
        assert not os.path.exists(filename)
        self.client.post('/records', data=json.dumps(data),
                content_type='application/json')
        assert os.path.exists(filename)
        for line in open(filename):
            record = json.loads(line.split(':', 1)[1])
            assert record['name'] == 'steering_wheel_angle'

if __name__ == '__main__':
    unittest.main()
