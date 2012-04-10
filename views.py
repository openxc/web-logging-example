import json
from collections import deque

from flask import request, render_template
from flask import current_app as app, abort

from util import make_status_response, generate_filename, jsonify


RECORDS_QUEUE = deque(maxlen=100)

def _prime_records_queue(q):
    filename = generate_filename(app.config)
    try:
        with open(filename, 'r') as trace_file:
            for line in trace_file:
                if len(RECORDS_QUEUE) == RECORDS_QUEUE.maxlen:
                    break
                timestamp, record = line.split(':', 1)
                record = _massage_record(json.loads(record), float(timestamp))
                RECORDS_QUEUE.append(record)
    except IOError:
        app.logger.warn("No active trace file found at %s" % filename)


def _massage_record(record, timestamp):
    record['timestamp'] = int(timestamp * 1000)
    return record



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
            record = _massage_record(record, timestamp)
            RECORDS_QUEUE.append(record)
    return make_status_response(201)


def show_records():
    _prime_records_queue(RECORDS_QUEUE)
    return jsonify(records=list(RECORDS_QUEUE))


def visualization():
    return render_template('visualization.html')
