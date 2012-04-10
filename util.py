import json
import errno
import os
from datetime import datetime
from collections import deque
from functools import partial

from flask import Response, make_response, request

FILENAME_DATE_FORMAT = '%Y-%m-%d-%H'
RECORDS_QUEUE = deque(maxlen=1000)

def jsonify(**kwargs):
    return Response(json.dumps(kwargs), mimetype='application/json')


def make_status_response(status):
    response = make_response()
    response.status_code = status
    return response


def generate_filename(config, d=None):
    d = d or datetime.now()
    return "%s/%s.json" % (config['TRACE_FOLDER'],
            d.strftime(FILENAME_DATE_FORMAT))


def massage_record(record, timestamp):
    record['timestamp'] = int(timestamp * 1000)
    return record


def prime_records_queue(app, q):
    filename = generate_filename(app.config)
    try:
        with open(filename, 'r') as trace_file:
            for line in trace_file:
                if len(RECORDS_QUEUE) == RECORDS_QUEUE.maxlen:
                    break
                timestamp, record = line.split(':', 1)
                record = massage_record(json.loads(record), float(timestamp))
                RECORDS_QUEUE.append(record)
    except IOError:
        app.logger.warn("No active trace file found at %s" % filename)


def make_trace_folder(app):
    try:
        os.mkdir(app.config['TRACE_FOLDER'])
    except OSError as exc:
        if exc.errno == errno.EEXIST:
            pass
        else: raise


def request_wants(mimetype):
    best = request.accept_mimetypes \
        .best_match([mimetype, 'text/html'])
    return best == mimetype and \
        request.accept_mimetypes[best] > \
        request.accept_mimetypes['text/html']

request_wants_json = partial(request_wants, 'application/json')
