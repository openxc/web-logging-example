#!/usr/bin/env python
import os
import errno

from flask import Flask

import views


def setup_routes(app):
    app.add_url_rule('/records', 'add_record', views.add_record,
            methods=['POST'])

def create_app(config=None):
    app = Flask(__name__)
    app.config.from_pyfile("settings.py")
    if config:
        app.config.update(config)
    setup_routes(app)

    try:
        os.mkdir(app.config['TRACE_FOLDER'])
    except OSError as exc:
        if exc.errno == errno.EEXIST:
            pass
        else: raise

    return app

app = create_app()

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0')
