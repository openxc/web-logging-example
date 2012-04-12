from handlers.visualization import VisualizationHandler
from handlers.records import RecordsHandler, RecordsWebSocketHandler

url_patterns = [
    (r'/', VisualizationHandler),
    (r'/visualization', VisualizationHandler),
    (r'/records', RecordsHandler),
    (r'/records.ws', RecordsWebSocketHandler),
]
