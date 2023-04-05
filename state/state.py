from pydantic import BaseSettings
from typing import Dict, List
from threading import Lock
from pathlib import Path
import json
import os

class Session(BaseSettings):
    token: str

class Events(BaseSettings):
    events: List[Dict[str, str]]

class Pages(BaseSettings):
    pages: List[Dict[str, str]]

TYPES = {
    "events": Events,
    "pages": Pages,
    "session": Session
}
LOCKS = { k: Lock() for k in TYPES.keys() }
DIR = Path(__file__).parent.resolve()

def to_file(key):
    return DIR.joinpath(f'{key}.json')

def to_lock(key):
    return LOCKS[key]

def to_state(key):
    filename = to_file(key)
    if not os.path.exists(filename):
        return None
    with open(filename, 'r') as f:
        return TYPES[key](**json.loads(f.read()))

def set_state(key, **kwargs):
    lock = to_lock(key)
    lock.acquire()
    with open(to_file(key), 'w') as f:
        f.write(json.dumps(kwargs)) 
    lock.release()