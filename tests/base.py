import tornado.testing
import shutil

import recorder
from util import make_trace_folder
from settings import settings

class BaseRecorderTestCase(tornado.testing.AsyncHTTPTestCase):
    def get_app(self):
        return recorder.DataRecorder()

    def setUp(self):
        super(BaseRecorderTestCase, self).setUp()
        make_trace_folder(settings)

    def tearDown(self):
        super(BaseRecorderTestCase, self).tearDown()
        print "erasing %s " % settings['trace_folder']
        shutil.rmtree(settings['trace_folder'])
