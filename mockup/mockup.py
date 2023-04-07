from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY as _422
from starlette.status import HTTP_204_NO_CONTENT as _204
from starlette.status import HTTP_201_CREATED as _201
from fastapi.exceptions import RequestValidationError
from concurrent.futures import ThreadPoolExecutor
from starlette.responses import FileResponse 
from fastapi.responses import JSONResponse
from starlette.requests import Request
from util import to_service, to_config
from state import set_state, to_state
from fastapi import Depends, FastAPI
from urllib.parse import parse_qs
from pydantic import BaseModel
from models import HasEvent
import requests
import asyncio
import json

# Construct mockup API
nationbuilder = FastAPI()
pool = ThreadPoolExecutor(max_workers=1)

# Call Nationbuilder (or local mockup)
@nationbuilder.on_event("startup")
def startup_event():
    async def startup(config):
        requests.get(to_service(config).authorize_url)
    # Submit request in parallel
    pool.submit(asyncio.run, startup(to_config()))

'''
Incidental helpers
'''
def to_token():
    session = to_state("session")
    if session is None: return None
    return session.token

class HasCode(BaseModel):
    code: str

'''
Client-side single page app
'''

@nationbuilder.get("/")
async def open_root():
    return FileResponse('static/index.html')

@nationbuilder.get("/index.js")
async def open_root():
    return FileResponse('static/index.js')

'''
Proxy to fetch real/mocked Nationbuilder endpoints
'''

@nationbuilder.get("/api")
def open_root(config=Depends(to_config)):
    oauth = to_service(config).oauth
    token = to_token()
    if token is None: return vars(config)
    return { **vars(config), "token": token }

@nationbuilder.post("/api/pages/events", status_code=_201)
async def create_event(e: HasEvent, config=Depends(to_config), token=to_token()):
    async def post_event():
        data = json.loads(e.json())
        await to_service(config).post_api(to_token(), '/pages/events', data)
    # Submit request in parallel
    pool.submit(asyncio.run, post_event())

@nationbuilder.get("/api/pages/events")
def list_events(config=Depends(to_config), token=to_token()):
    return to_service(config).get_api(to_token(), '/pages/events')

@nationbuilder.get("/api/pages/basic_pages")
def list_basic_pages(config=Depends(to_config), token=to_token()):
    return to_service(config).get_api(to_token(), '/pages/basic_pages')

@nationbuilder.post("/api/redirect")
async def handle_redirect(data: HasCode, config=Depends(to_config), status_code=_204):
    oauth = to_service(config).oauth
    async def get_token(**kwargs):
        token = oauth.get_access_token(**{
            "decoder": json.loads,
            "data": {
                **kwargs,
                "redirect_uri": config.redirect,
                "grant_type": "authorization_code"
            }
        })
        set_state('session', token=token)
    # Submit request in parallel
    pool.submit(asyncio.run, get_token(**vars(data)))

'''
For testing locally without credentials
'''

@nationbuilder.post("/mockup/api/v1/pages/events")
async def _create_event(request: Request):
    event = json.loads((await request.body()).decode('utf-8'))
    set_state('events', events=[event])

@nationbuilder.get("/mockup/api/v1/pages/events")
def _list_events(format: str):
    def to_events():
        events = to_state("events")
        if events is None: return []
        return events.events 
    return { "results": to_events() }

@nationbuilder.get("/mockup/api/v1/pages/basic_pages")
def _list_basic_pages(format: str):
    def to_pages():
        pages = to_state("pages")
        if pages is None: return []
        return pages.pages 
    return { "results": to_pages() }

# "Ask a nation's administrator for access"
@nationbuilder.get("/mockup/oauth/authorize", status_code=_204)
def _authorize_url(redirect_uri):
    data = { 'code': 'mockup-123456789' }
    requests.post(redirect_uri, json=data)

# "Exchange the code for an access token"
@nationbuilder.post("/mockup/oauth/token")
async def _get_access_token(request: Request):
    qs = parse_qs((await request.body()).decode('utf-8'))
    access_token = '-'.join(['token', 'for'] + qs['code'])
    return { 'access_token': access_token }

# Handle common FastAPI exceptions
@nationbuilder.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    content = {'status_code': 10422, 'data': None}
    print(f'{exc}'.replace('\n', ' ').replace('   ', ' '))
    return JSONResponse(content=content, status_code=_422)
