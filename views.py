import json

from flask import request
from flask import current_app as app, abort

from util import make_status_response
from util import generate_filename


def add_vehicle():
    if not request.json:
        app.logger.error("Expected JSON, but POSTed data was %s", request.data)
        return abort(400)

    records = request.json.get('records', None)
    if records is None or not hasattr(records, '__iter__'):
        app.logger.error("Expected JSON, but POSTed data was %s", request.data)
        return abort(400)

    with open(generate_filename(app.config), 'a') as trace_file:
        for record in records:
            trace_file.write(json.dumps(record))
    return make_status_response(201)
