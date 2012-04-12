from tests.base import BaseRecorderTestCase


class VisualizationTestCase(BaseRecorderTestCase):
    def test_no_data(self):
        self.http_client.fetch(self.get_url('/visualization'), self.stop)
        response = self.wait()
        assert "measurement" in response.body
