#!/usr/bin/env python
from gevent.pywsgi import WSGIServer
from flask import Flask

import views
from handler import PatchedWebSocketHandler
from util import generate_filename, massage_record, make_trace_folder


def setup_routes(app):
    app.add_url_rule('/', 'index', views.visualization, methods=['GET'])
    app.add_url_rule('/visualization', 'visualization', views.visualization,
            methods=['GET'])
    app.add_url_rule('/records', 'add_record', views.add_record,
            methods=['POST'])
    app.add_url_rule('/records', 'show_records', views.show_records,
            methods=['GET'])


def create_app(config=None):
    app = Flask(__name__)
    app.config.from_pyfile("settings.py")
    if config:
        app.config.update(config)
    setup_routes(app)
    make_trace_folder(app)
    return app


app = create_app()

if __name__ == '__main__':
    app = create_app()
    server = WSGIServer(('', 5000), app, handler_class=PatchedWebSocketHandler)
    server.serve_forever()
