import errno
import os
from datetime import datetime


import logging
log = logging.getLogger('recorder.' + __name__)


FILENAME_DATE_FORMAT = '%Y.%m.%d-%H.%M.%S'


def generate_filename(settings, d=None):
    d = d or datetime.now()
    seconds_since_last_record = (d - settings.get('last_record_received', d)
            ).total_seconds()
    settings['last_record_received'] = d

    if (settings.get('current_trace_file', None) is None or
            seconds_since_last_record > settings['trace_file_switch_timeout']):
        settings['current_trace_file'] = os.path.join(settings['trace_folder'],
            "%s.json" % d.strftime(FILENAME_DATE_FORMAT))
        log.debug("Switching to a new trace file, %s",
                settings['current_trace_file'])
    else:
        log.debug("Received a record %d seconds ago, continuing to use same trace file, %s",
                seconds_since_last_record, settings['current_trace_file'])
    return settings['current_trace_file']

def make_trace_folder(settings):
    try:
        os.mkdir(settings['trace_folder'])
    except OSError as exc:
        if exc.errno == errno.EEXIST:
            pass
        else: raise
