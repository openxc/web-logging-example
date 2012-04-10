from geventwebsocket.handler import WebSocketHandler

class PatchedWebSocketHandler(WebSocketHandler):
    def log_request(self):
        log = self.server.log
        if log:
            if hasattr(log, "info"):
                log.info(self.format_request() + '\n')
            else:
                log.write(self.format_request() + '\n')
