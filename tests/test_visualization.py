from tornado.httpclient import HTTPRequest
import json
import os.path
import json
import shutil
from xml.etree import ElementTree as ET

from util import generate_filename
from util import make_trace_folder

from tests.base import BaseRecorderTestCase


class VisualizationTestCase(BaseRecorderTestCase):
    def test_no_data(self):
        self.http_client.fetch(self.get_url('/visualization'), self.stop)
        response = self.wait()
        assert 'class="vehicle"' in response.body
