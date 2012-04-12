import Queue
import json
import collections

from util import generate_filename
from util import massage_record
from settings import settings
from handlers.base import BaseHandler, BaseWebSocketHandler

import logging
log = logging.getLogger('recorder.' + __name__)


LISTENERS = collections.deque()
RECORD_QUEUE = Queue.Queue()


def queue_listener():
    while True:
        records = [RECORD_QUEUE.get()]
        current_size = RECORD_QUEUE.qsize()
        records += [RECORD_QUEUE.get(1) for _ in range(current_size)]
        data = json.dumps({"records": records})
        for client in LISTENERS:
            log.debug("Sending %s to %s", records, client)
            client.write_message(unicode(data))


class RecordsHandler(BaseHandler):
    def post(self):
        records = self.get_json_argument('records', None)
        with open(generate_filename(settings), 'a') as trace_file:
            for record in records:
                timestamp = record.pop('timestamp')
                trace_file.write("%s: %s\r\n" % (timestamp, json.dumps(record)))
                record = massage_record(record, float(timestamp))
                RECORD_QUEUE.put(record)
        self.set_status(201)


class RecordsWebSocketHandler(BaseWebSocketHandler):
    def open(self):
        log.debug("Websocket opened on %s", self.request.remote_ip)
        LISTENERS.append(self)

    def on_close(self):
        log.debug("Websocket closed on %s", self.request.remote_ip)
        LISTENERS.remove(self)
