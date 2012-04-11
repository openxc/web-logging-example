from handlers.base import BaseHandler

import logging
logger = logging.getLogger('recorder.' + __name__)


class VisualizationHandler(BaseHandler):
    def get(self):
        self.render("visualization.html")
