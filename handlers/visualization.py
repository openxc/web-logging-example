from handlers.base import BaseHandler
from settings import settings

import os
import logging
logger = logging.getLogger('recorder.' + __name__)


class VisualizationHandler(BaseHandler):
    def get(self):
        trace_filenames = [filename for filename in
                os.listdir(settings['trace_folder'])]
        self.render("visualization.html", trace_filenames=trace_filenames)
