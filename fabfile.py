from fabric.api import *

env.hosts = ['fiesta.eecs.umich.edu']

def _annotate_hosts_with_ssh_config_info():
    from os.path import expanduser
    from paramiko.config import SSHConfig

    def hostinfo(host, config):
        hive = config.lookup(host)
        if 'hostname' in hive:
            host = hive['hostname']
        if 'user' in hive:
            host = '%s@%s' % (hive['user'], host)
        if 'port' in hive:
            host = '%s:%s' % (host, hive['port'])
        return host

    try:
        config_file = file(expanduser('~/.ssh/config'))
    except IOError:
        pass
    else:
        config = SSHConfig()
        config.parse(config_file)
        keys = [config.lookup(host).get('identityfile', None)
            for host in env.hosts]
        env.key_filename = [expanduser(key) for key in keys if key is not None]
        env.hosts = [hostinfo(host, config) for host in env.hosts]

_annotate_hosts_with_ssh_config_info()

def setup():
    """Installs all Python package dependencies."""
    local("pip install -r pip-requirements.txt")

def runserver():
    """Run the development web server."""
    local("gunicorn -b 0.0.0.0:5000 --workers=2 "
            "--worker-class=\"workers.GeventWebSocketWorker\" recorder:app")

def test():
    """Run the test suite."""
    clean()
    local("python tests.py")

def clean():
    """Clean up all .pyc files."""
    local("find . -name \"*.pyc\" -exec rm {} \;")
    local("rm -rf traces")

def deploy():
    local("git push")
    with cd("/var/www/recorder"):
        run("git pull")
        sudo("apachectl restart")

def run(command, forward_agent=True, use_sudo=False, **kwargs):
    require('hosts')
    if 'localhost' in env.hosts:
        return local(command)
    elif forward_agent:
        if not env.host:
            abort("At least one host is required")
        return sshagent_run(command, use_sudo=use_sudo)
    else:
        return fabric_run(command, **kwargs)

def sshagent_run(command, use_sudo=False):
    """
    Helper function.
    Runs a command with SSH agent forwarding enabled.

    Note:: Fabric (and paramiko) can't forward your SSH agent.
    This helper uses your system's ssh to do so.
    """

    if use_sudo:
        command = 'sudo %s' % command

    cwd = env.get('cwd', '')
    if cwd:
        cwd = 'cd %s && ' % cwd
    real_command = cwd + command

    with settings(cwd=''):
        if env.port:
            port = env.port
            host = env.host
        else:
            try:
                # catch the port number to pass to ssh
                host, port = env.host.split(':')
            except ValueError:
                port = None
                host = env.host

        if port:
            local('ssh -p %s -A %s "%s"' % (port, host, real_command))
        else:
            local('ssh -A %s "%s"' % (env.host, real_command))
