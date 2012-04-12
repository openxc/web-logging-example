#!/usr/bin/env python

import tornado.httpserver
import tornado.ioloop
import tornado.web
import threading
from tornado.options import options

from settings import settings
from urls import url_patterns

from util import make_trace_folder

class DataRecorder(tornado.web.Application):
    def __init__(self):
        tornado.web.Application.__init__(self, url_patterns, **settings)


def main():
    from handlers.records import queue_listener
    event_thread = threading.Thread(target=queue_listener)
    event_thread.daemon = True
    event_thread.start()

    make_trace_folder(settings)

    app = DataRecorder()
    http_server = tornado.httpserver.HTTPServer(app)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
