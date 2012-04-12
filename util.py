import errno
import os
from datetime import datetime
from functools import partial


FILENAME_DATE_FORMAT = '%Y-%m-%d-%H'


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
