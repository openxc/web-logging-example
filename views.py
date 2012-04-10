import json
import time
from xml.etree import ElementTree as ET
from Queue import Queue

from flask import request, render_template, Response
from flask import current_app as app, abort

from util import make_status_response, generate_filename, jsonify
from util import massage_record, request_wants_json


LIVESTREAM_QUEUE = Queue(maxsize=1000)


def _generate_gpx(records):
    root = ET.Element("gpx")

    track = ET.SubElement(root, "trk")
    number = ET.SubElement(track, "number")
    number.text = "1"

    segment = ET.SubElement(track, "trkseg")

    latitude = longitude = None
    for record in records:
        value = record['value']
        if record['name'] == "latitude":
            latitude = value
        elif record['name'] == "longitude":
            longitude = value
        if latitude is not None and longitude is not None:
            point = ET.SubElement(segment, "trkpt")
            point.set('lat', str(latitude))
            point.set('lon', str(longitude))
            latitude = longitude = None
    return ET.ElementTree(root)


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
            record = massage_record(record, timestamp)
            LIVESTREAM_QUEUE.put(record)
    return make_status_response(201)


def show_records():
    ws = request.environ.get('wsgi.websocket', None)
    if request_wants_json():
        return jsonify(records=[])
    elif ws is not None:
        while True:
            ws.send(json.dumps(LIVESTREAM_QUEUE.get()))
    return make_status_response(400)


def visualization():
    return render_template('visualization.html')
