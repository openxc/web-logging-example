from fabric.api import *

def setup():
    """Installs all Python package dependencies."""
    local("pip install -r pip-requirements.txt")

def runserver():
    """Run the development web server."""
    local("python recorder.py")

def test():
    """Run the test suite."""
    clean()
    local('python -m tornado.autoreload tests/run_tests.py')

def clean():
    """Clean up all .pyc files."""
    local("find . -name \"*.pyc\" -exec rm {} \;")
    local("rm -rf traces")

def deploy():
    local("git push")
    with cd("/var/www/recorder"):
        run("git pull")
        sudo("apachectl restart")

def send_test_data(filename):
    """
    Send the records from a trace value to a local visualization server
    """
    import requests
    import time
    import json

    def send_records(records):
        data = {"records": records}
        print "Sending %s" % data
        headers = {'content-type': 'application/json'}
        r = requests.post('http://localhost:5000/records',
                data=json.dumps(data), headers=headers)
        print r

    def wait_for_next_record(starting_time, first_timestamp,timestamp):
        target_time = starting_time + (timestamp - first_timestamp)
        sleep_duration = target_time - time.time()
        if sleep_duration > 0:
            time.sleep(sleep_duration + 1)

    while True:
        starting_time = time.time()
        first_timestamp = None
        try:
            records = []
            with open(filename, 'r') as trace_file:
                for line in trace_file:
                    record = json.loads(line)

                    if first_timestamp is None:
                        first_timestamp = record['timestamp']
                    wait_for_next_record(starting_time, first_timestamp,
                            record['timestamp'])
                    records.append(record)

                    if len(records) == 25:
                        send_records(records)
                        time.sleep(.5)
                        records = []
        except IOError:
            print("No active trace file found at %s" % filename)
