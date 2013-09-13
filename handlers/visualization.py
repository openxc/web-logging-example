from handlers.base import BaseHandler
from settings import settings

import os
import logging
logger = logging.getLogger('recorder.' + __name__)


class VisualizationHandler(BaseHandler):
    def get(self):
        trace_filenames = [os.path.join(settings['trace_folder'], filename)
                for filename in os.listdir(settings['trace_folder'])]
        trace_filenames.sort(key=lambda x: os.path.getmtime(x), reverse=True)
        trace_filenames = [trace_filename.split('/')[1] for trace_filename in
                trace_filenames]
        self.render("visualization.html", trace_filenames=trace_filenames)
