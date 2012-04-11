#!/usr/bin/env bash
import unittest2 as unittest
import os.path
import json
import shutil
from xml.etree import ElementTree as ET

from flask import url_for

from util import generate_filename
from recorder import create_app, make_trace_folder


class BaseRecorderTestCase(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.app.config.from_pyfile("test_settings.py")
        make_trace_folder(self.app)
        self.client = self.app.test_client()
        self.app.test_request_context().push()

    def tearDown(self):
        print "erasing %s " % self.app.config['TRACE_FOLDER']
        shutil.rmtree(self.app.config['TRACE_FOLDER'])


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
        self.client.post('/records', data=json.dumps(data),
                content_type='application/json')

    def test_create_records(self):
        filename = generate_filename(self.app.config)
        assert not os.path.exists(filename)
        self._insert_records()
        assert os.path.exists(filename)
        for line in open(filename):
            record = json.loads(line.split(':', 1)[1])
            assert record['name'] in ('vehicle_speed',
                    'fuel_consumed_since_restart',
                    'longitude', 'latitude')

    def test_retreive_records(self):
        self._insert_records()
        response = self.client.get(url_for('show_records'),
                headers=[('Accept', 'application/json')])
        assert 'records' in response.data
        data = json.loads(response.data)
        record = data['records'][0]
        assert record['name'] in ('vehicle_speed',
                'fuel_consumed_since_restart', 'longitude', 'latitude')


class VisualizationTestCase(BaseRecorderTestCase):

    def test_no_data(self):
        response = self.client.get(url_for('visualization'))
        assert 'class="vehicle"' in response.data


if __name__ == '__main__':
    unittest.main()
