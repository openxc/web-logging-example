#!/usr/bin/env python
import requests
import datetime
import time
import json
import sys

from util import massage_record


names = ("vehicle_speed", "fuel_consumed_since_restart", "latitude",
        "longitude")

def send_records(records):
    data = {"records": records}
    print "Sending %s" % data
    headers = {'content-type': 'application/json'}
    r = requests.post('http://localhost:5000/records', data=json.dumps(data),
            headers=headers)
    print r
    time.sleep(1)

while True:
    filename = sys.argv[1]
    try:
        records = []
        with open(filename, 'r') as trace_file:
            for line in trace_file:
                timestamp, record = line.split(':', 1)
                record = massage_record(json.loads(record), float(timestamp))
                records.append(record)

                if len(records) == 25:
                    send_records(records)
                    records = []
    except IOError:
        print("No active trace file found at %s" % filename)
