#!/usr/bin/env python
import requests
import datetime
import time
import json

import random
from random import choice

random.seed(datetime.datetime.now())

names = ("vehicle_speed", "fuel_consumed_since_restart", "latitude",
        "longitude")

while True:
    data = {"records": [
        {"timestamp": time.time() * 1000,
        "name": choice(names),
        "value": random.randint(0, 100)}
    ]}
    print "Sending %s" % data
    headers = {'content-type': 'application/json'}
    r = requests.post('http://localhost:5000/records', data=json.dumps(data),
            headers=headers)
    print r
    time.sleep(.1)
