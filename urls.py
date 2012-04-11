from handlers.visualization import VisualizationHandler
from handlers.records import RecordsHandler

url_patterns = [
    (r'/', VisualizationHandler),
    (r'/visualization', VisualizationHandler),
    (r'/records', RecordsHandler),
]
