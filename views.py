import json
from Queue import Queue

from flask import request, render_template
from flask import current_app as app, abort

from util import make_status_response, generate_filename, jsonify
from util import massage_record, request_wants_json


LIVESTREAM_QUEUE = Queue()


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
            record = massage_record(record, float(timestamp))
            LIVESTREAM_QUEUE.put(record)
    return make_status_response(201)


def show_records():
    ws = request.environ.get('wsgi.websocket', None)
    if request_wants_json():
        return jsonify(records=[])
    elif ws is not None:
        while True:
            records = [LIVESTREAM_QUEUE.get()]
            current_size = LIVESTREAM_QUEUE.qsize()
            records += [LIVESTREAM_QUEUE.get(1) for _ in range(current_size)]
            ws.send(json.dumps({"records": records}))
    return make_status_response(400)


def visualization():
    return render_template('visualization.html')
