from bottle import route, run, template, view, static_file, default_app, request
import json
import simplerockets as sr
import os
import logging
from glob import glob

demo_id = 119304

@route('/evaluate/<rocket_id:int>')
@route('/evaluate/')
@route('/evaluate')
@route('/ViewShip.html')
@route('/')
@view('evaluate')
def evaluate(rocket_id = None):
    if(request.query.get('id')):
        rocket_id = int(request.query.get('id'))

    ship = sr.Ship(ship_assets)
    ship.set_cachedir(os.path.join(os.getcwd(),'cache'))
    
    if(not rocket_id):
        rocket_id = demo_id

    ship.load(rocket_id)

    if ship.name:
        rocket_name = ship.name
    elif rocket_id == demo_id:
        rocket_name = 'Demo rocket'
    elif rocket_id:
        rocket_name = 'rocket %d' % (rocket_id)
    else:
        rocket_name = 'Unknown rocket'

    return {
        'error_info': {
            'error': ship.error,
            'type': ship.error_type,
            'traceback': ship.traceback,
        },
        'rocket_id': rocket_id,
        'rocket_name': rocket_name,
        'rocket_data': ship.partlist,
        'stage_data': {
            'parts': ship.stage_parts,
            'detachers': ship.detacher_list,
        },
        'sprite_data': ship_assets.getSprites(),
    }

@route('/<type:re:(js|css|img|cache)>/<filename>')
@route('/<type:re:(js|css|img|cache)>/<subdir:path>/<filename>')
def server_static(type, filename, subdir = ''):
    return static_file(os.path.join(type, subdir, filename),'./')

def get_app():
    return default_app()

try:
    logging.basicConfig(filename='rocketcenter.log',level=logging.DEBUG)
except Exception, e:
    pass

if(os.path.dirname(__file__)):
    os.chdir(os.path.dirname(__file__))

ship_assets = sr.AssetBin(
    'PartList.xml',
    'img/sprites/ShipSprites.xml'
)

# Load mods
for modfile in glob('mods/*.srmod'):
    ship_assets.addModfile(modfile)

if __name__ == "__main__":
    run(host='localhost',port=54321,reloader=True)
