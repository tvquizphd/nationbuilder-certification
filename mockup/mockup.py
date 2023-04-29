from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY as _422
from starlette.status import HTTP_204_NO_CONTENT as _204
from starlette.status import HTTP_201_CREATED as _201
from fastapi.exceptions import RequestValidationError
from concurrent.futures import ThreadPoolExecutor
from fastapi.exceptions import HTTPException
from starlette.responses import FileResponse 
from fastapi.responses import JSONResponse
from starlette.requests import Request
from util import to_service, to_config
from state import set_state, to_state
from fastapi import Depends, FastAPI
from urllib.parse import parse_qs
from pydantic import BaseModel
from models import HasBasicPage
from models import HasContact
from models import HasSurvey
from models import HasPerson
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
async def open_root_html():
    return FileResponse('static/index.html')

@nationbuilder.get("/index.js")
async def open_root_js():
    return FileResponse('static/index.js')

@nationbuilder.get("/country_code.js")
async def open_country_code():
    return FileResponse('static/country_code.js')

'''
Proxy to fetch real/mocked Nationbuilder endpoints
'''

@nationbuilder.get("/api")
def open_root_api(config=Depends(to_config)):
    oauth = to_service(config).oauth
    token = to_token()
    if token is None: return vars(config)
    return { **vars(config), "token": token }

'''
Person
'''

@nationbuilder.delete("/api/people/{who}", status_code=_204)
async def delete_person(
        who: int, config=Depends(to_config), token=to_token()
    ):
    async def delete_person():
        url = f'/people/{who}'
        await to_service(config).delete_api(to_token(), url)
    # Submit request in parallel
    pool.submit(asyncio.run, delete_person())

@nationbuilder.put("/api/people/{who}")
async def update_person(
        who: int, e: HasPerson, config=Depends(to_config), token=to_token()
    ):
    async def put_person():
        url = f'/people/{who}'
        data = json.loads(e.json())
        await to_service(config).put_api(to_token(), url, data)
    # Submit request in parallel
    pool.submit(asyncio.run, put_person())

@nationbuilder.post("/api/people", status_code=_201)
async def create_person(
        e: HasPerson, config=Depends(to_config), token=to_token()
    ):
    async def post_person():
        url = '/people'
        data = json.loads(e.json())
        await to_service(config).post_api(to_token(), url, data)
    # Submit request in parallel
    pool.submit(asyncio.run, post_person())

@nationbuilder.get("/api/people")
def list_persons(config=Depends(to_config), token=to_token()):
    return to_service(config).get_api(to_token(), '/people')

'''
Survey
'''

@nationbuilder.post("/api/surveys", status_code=_201)
async def create_survey(
        e: HasSurvey, config=Depends(to_config), token=to_token()
    ):
    async def post_survey():
        url = '/sites/foobar-fake-site/pages/surveys'
        data = json.loads(e.json())
        await to_service(config).post_api(to_token(), url, data)
    # Submit request in parallel
    pool.submit(asyncio.run, post_survey())


@nationbuilder.get("/api/surveys")
def list_surveys(config=Depends(to_config), token=to_token()):
    url = '/sites/foobar-fake-site/pages/surveys'
    return to_service(config).get_api(to_token(), url)


'''
Basic Page
'''

@nationbuilder.post("/api/basic_pages", status_code=_201)
async def create_basic_page(
        e: HasBasicPage, config=Depends(to_config), token=to_token()
    ):
    async def post_basic_page():
        url = '/sites/foobar-fake-site/pages/basic_pages'
        data = json.loads(e.json())
        await to_service(config).post_api(to_token(), url, data)
    # Submit request in parallel
    pool.submit(asyncio.run, post_basic_page())

@nationbuilder.get("/api/basic_pages")
def list_basic_pages(config=Depends(to_config), token=to_token()):
    url = '/sites/foobar-fake-site/pages/basic_pages'
    return to_service(config).get_api(to_token(), url)


'''
Contact
'''

@nationbuilder.post("/api/people/{who}/contacts", status_code=_201)
async def create_contact(
        who: int, e: HasContact, config=Depends(to_config), token=to_token()
    ):
    async def post_contact():
        url = f'/people/{who}/contacts'
        data = json.loads(e.json())
        await to_service(config).post_api(to_token(), url, data)
    # Submit request in parallel
    pool.submit(asyncio.run, post_contact())


'''
Event
'''

@nationbuilder.put("/api/pages/events/{ev}")
async def update_event(
        ev: int, e: HasEvent, config=Depends(to_config), token=to_token()
    ):
    async def put_event():
        url = f'/pages/events/{ev}'
        data = json.loads(e.json())
        await to_service(config).put_api(to_token(), url, data)
    # Submit request in parallel
    pool.submit(asyncio.run, put_event())

@nationbuilder.post("/api/pages/events", status_code=_201)
async def create_event(
        e: HasEvent, config=Depends(to_config), token=to_token()
    ):
    async def post_event():
        url = '/pages/events'
        data = json.loads(e.json())
        await to_service(config).post_api(to_token(), url, data)
    # Submit request in parallel
    pool.submit(asyncio.run, post_event())

@nationbuilder.get("/api/pages/events")
def list_events(config=Depends(to_config), token=to_token()):
    return to_service(config).get_api(to_token(), '/pages/events')

@nationbuilder.get("/api/pages/basic_pages")
def list_basic_pages(config=Depends(to_config), token=to_token()):
    return to_service(config).get_api(to_token(), '/pages/basic_pages')

@nationbuilder.post("/api/redirect", status_code=_201)
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
Basic Pages, mocked
'''

def to_basic_pages():
    basic_pages = to_state("basic_pages")
    if basic_pages is None: return []
    return basic_pages.basic_pages

@nationbuilder.get("/mockup/api/v1/sites/{site}/pages/basic_pages")
def _list_basic_pages(format: str, site: str):
    results = [e.basic_page for e in to_basic_pages()] 
    return { "results": results }

@nationbuilder.post("/mockup/api/v1/sites/{site}/pages/basic_pages", status_code=_201)
async def _create_basic_page(request: Request):
    basic_page = json.loads((await request.body()).decode('utf-8'))
    basic_pages = [e.dict() for e in to_basic_pages()]
    basic_page["basic_page"]["id"] = len(basic_pages)
    set_state('basic_pages', basic_pages=[basic_page, *basic_pages])

'''
Contact, mocked
'''

def to_contacts():
    contacts = to_state("contacts")
    if contacts is None: return []
    return contacts.contacts

@nationbuilder.post("/mockup/api/v1/people/{who}/contacts", status_code=_201)
async def _create_contact(who: int, request: Request):
    contact = json.loads((await request.body()).decode('utf-8'))
    contacts = [e.dict() for e in to_contacts()]
    set_state('contacts', contacts=[contact, *contacts])

'''
Person, mocked
'''

def to_persons():
    persons = to_state("persons")
    if persons is None: return []
    return persons.persons

def is_who(e, who):
    return e["person"]["id"] == who

def update_who(e, who, person):
    if is_who(e, who):
        e["person"].update(person["person"])
        return True
    return False

@nationbuilder.delete("/mockup/api/v1/people/{who}", status_code=_204)
async def _delete_person(who: int, request: Request):
    persons = [e.dict() for e in to_persons()]
    persons = [e for e in persons if not is_who(e, who)]
    set_state('persons', persons=persons)

@nationbuilder.put("/mockup/api/v1/people/{who}", status_code=_201)
async def _update_person(who: int, request: Request):
    person = json.loads((await request.body()).decode('utf-8'))
    person["person"].pop("id", None)
    persons = [e.dict() for e in to_persons()]
    next(e for e in persons if update_who(e, who, person))
    set_state('persons', persons=persons)

@nationbuilder.post("/mockup/api/v1/people", status_code=_201)
async def _create_person(request: Request):
    person = json.loads((await request.body()).decode('utf-8'))
    persons = [e.dict() for e in to_persons()]
    person["person"]["id"] = len(persons)
    set_state('persons', persons=[person, *persons])

@nationbuilder.get("/mockup/api/v1/people")
def _list_persons(format: str):
    results = [e.person for e in to_persons()] 
    return { "results": results }

'''
Survey, mocked
'''

def to_surveys():
    surveys = to_state("surveys")
    if surveys is None: return []
    return surveys.surveys

@nationbuilder.post("/mockup/api/v1/sites/{site}/pages/surveys", status_code=_201)
async def _create_survey(request: Request):
    survey = json.loads((await request.body()).decode('utf-8'))
    surveys = [e.dict() for e in to_surveys()]
    survey["survey"]["id"] = len(surveys)
    set_state('surveys', surveys=[survey, *surveys])

@nationbuilder.get("/mockup/api/v1/sites/{site}/pages/surveys")
def _list_surveys(format: str):
    results = [e.survey for e in to_surveys()] 
    return { "results": results }


'''
Event, mocked
'''

def to_events():
    events = to_state("events")
    if events is None: return []
    return events.events

def update_ev(e, ev, event):
    if e["event"]["id"] == ev:
        e["event"].update(event["event"])
        return True
    return False

@nationbuilder.put("/mockup/api/v1/pages/events/{ev}", status_code=_201)
async def _update_event(ev: int, request: Request):
    event = json.loads((await request.body()).decode('utf-8'))
    event["event"].pop("id", None)
    events = [e.dict() for e in to_events()]
    next(e for e in events if update_ev(e, ev, event))
    set_state('events', events=events)

@nationbuilder.post("/mockup/api/v1/pages/events", status_code=_201)
async def _create_event(request: Request):
    event = json.loads((await request.body()).decode('utf-8'))
    events = [e.dict() for e in to_events()]
    event["event"]["id"] = len(events)
    set_state('events', events=[event, *events])

@nationbuilder.get("/mockup/api/v1/pages/events")
def _list_events(format: str):
    results = [e.event for e in to_events()] 
    return { "results": results }

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
