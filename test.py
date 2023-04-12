from argparse import ArgumentParser
from signal import SIGINT, SIGTERM
from util import set_config
import asyncio
import uvicorn

PORT = 8080
NATION = "greenrainbow"

def to_help(label):
    if label == 'L': return 'local testing, without credentials'
    if label == 'URL': return 'custom live app redirect URL'
    return f'API Client {label} for "{NATION}"'

parser = ArgumentParser(
                    prog='Nationbuilder Certification',
                    description='Test of Nationbuilder API',
                    epilog=f'Using the "{NATION}" nation')
parser.add_argument('redirect', nargs='?', help=to_help('URL'))
parser.add_argument('client_id', nargs='?', help=to_help('ID'))
parser.add_argument('client_secret', nargs='?', help=to_help('Secret'))
parser.add_argument('-L', '--local', help=to_help('L'), action='store_true')

async def mockup():
    uvicorn.run(**{
        "port": PORT,
        "reload": True,
        "host": "0.0.0.0",
        "app": "mockup:nationbuilder"
    })

if __name__ == "__main__":

    local_redirect = f'http://localhost:{PORT}'
    args = parser.parse_args()
    args.protocol = "https://"
    # Allow local mockup testing
    if args.local:
        args.redirect = local_redirect
        args.client_secret = 'local'
        args.client_id = 'local'
        args.protocol = "http://"
    # Ensure redirect has protocol
    if args.redirect:
        if not args.redirect.startswith('http'):
            args.redirect = f'{protocol}{args.redirect}'
        args.redirect = f'{args.redirect}/api/redirect'
    # Configure API
    set_config(**{
        **vars(args), "port": PORT, "nation": NATION
    })

    # Test the API
    if not args.redirect: print(f'test.py -L to run without credentials, or see test.py -h')
    elif not args.client_id: print(f'Missing {to_help("ID")}')
    elif not args.client_secret: print(f'Missing {to_help("Secret")}')
    else:
        # Run API server + client
        loop = asyncio.get_event_loop()
        main_task = asyncio.ensure_future(mockup())
        for signal in [SIGINT, SIGTERM]:
            loop.add_signal_handler(signal, main_task.cancel)
        try:
            loop.run_until_complete(main_task)
        finally:
            loop.close()
