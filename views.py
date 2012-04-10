import json
from xml.etree import ElementTree as ET

from flask import request, render_template, Response
from flask import current_app as app, abort

from util import make_status_response, generate_filename, jsonify
from util import massage_record, RECORDS_QUEUE


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


def show_gpx():
    return Response("<?xml version=\"1.0\" ?>" +
            ET.tostring(_generate_gpx(RECORDS_QUEUE).getroot()),
            mimetype='application/xml')

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
            RECORDS_QUEUE.append(record)
    return make_status_response(201)


def show_records():
    return jsonify(records=list(RECORDS_QUEUE))


def visualization():
    return render_template('visualization.html')
