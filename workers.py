from gunicorn.workers.ggevent import GeventPyWSGIWorker

from handler import PatchedWebSocketHandler

class GeventWebSocketWorker(GeventPyWSGIWorker):
    wsgi_handler = PatchedWebSocketHandler
