import json

from flask import request, render_template
from flask import current_app as app, abort

from util import make_status_response, generate_filename, jsonify


def add_record():
    if not request.json:
        app.logger.error("Expected JSON, but POSTed data was %s", request.data)
        return abort(400)

    records = request.json.get('records', None)
    if records is None or not hasattr(records, '__iter__'):
        app.logger.error("Expected JSON, but POSTed data was %s", request.data)
        return abort(400)

    with open(generate_filename(app.config), 'a') as trace_file:
        for record in records:
            timestamp = record.pop('timestamp')
            trace_file.write("%s: %s\r\n" % (timestamp, json.dumps(record)))
    return make_status_response(201)


def show_records():
    return jsonify(records=[{'name': 'vehicle_speed'}])


def visualization():
    return render_template('visualization.html')
