import json
from datetime import datetime

from flask import Response, make_response

FILENAME_DATE_FORMAT = '%Y-%m-%d-%H'

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
