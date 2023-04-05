from rauth import OAuth2Service
import json

class Service():
    def __init__(self, config, service):
        self.authorize_url = service.get_authorize_url(**{
            "redirect_uri": config.redirect,
            "response_type": "code"
        })
        self.oauth = service
        self.config = config

    async def post_api(self, token, endpoint, data):
        if token is None: return
        headers = {'content-type': 'application/json'}
        session = self.oauth.get_session(token)
        target = self.config.api_url + endpoint
        session.post(target, json=data, headers=headers)

    def get_api(self, token, endpoint):
        if token is None: return dict()
        params = {'format': 'json'}
        headers = {'content-type': 'application/json'}
        session = self.oauth.get_session(token)
        target = self.config.api_url + endpoint
        r = session.get(target, params=params, headers=headers)
        return json.loads(r._content.decode('utf-8')) 


def to_service(config):
    service = OAuth2Service(
            name = config.nation,
            base_url = config.base_url,
            client_id = config.client_id,
            client_secret = config.client_secret,
            authorize_url = config.authorize_url,
            access_token_url = config.access_token_url)

    return Service(config, service)
