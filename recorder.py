#!/usr/bin/env python
from flask import Flask

import views
from util import generate_filename, massage_record, prime_records_queue
from util import RECORDS_QUEUE, make_trace_folder


def setup_routes(app):
    app.add_url_rule('/', 'index', views.visualization, methods=['GET'])
    app.add_url_rule('/visualization', 'visualization', views.visualization,
            methods=['GET'])
    app.add_url_rule('/records', 'add_record', views.add_record,
            methods=['POST'])
    app.add_url_rule('/records', 'show_records', views.show_records,
            methods=['GET'])
    app.add_url_rule('/gpx', 'show_gpx', views.show_gpx,
            methods=['GET'])


def create_app(config=None):
    app = Flask(__name__)
    app.config.from_pyfile("settings.py")
    if config:
        app.config.update(config)
    setup_routes(app)
    make_trace_folder(app)
    prime_records_queue(app, RECORDS_QUEUE)
    return app


app = create_app()

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0')
