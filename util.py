import json
import errno
import os
from datetime import datetime
from functools import partial

from flask import Response, make_response, request


FILENAME_DATE_FORMAT = '%Y-%m-%d-%H'

def jsonify(**kwargs):
    return Response(json.dumps(kwargs), mimetype='application/json')


def make_status_response(status):
    response = make_response()
    response.status_code = status
    return response


def generate_filename(settings, d=None):
    d = d or datetime.now()
    return "%s/%s.json" % (settings['trace_folder'],
            d.strftime(FILENAME_DATE_FORMAT))


def massage_record(record, timestamp):
    record['timestamp'] = int(timestamp * 1000)
    return record


def make_trace_folder(settings):
    try:
        os.mkdir(settings['trace_folder'])
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
