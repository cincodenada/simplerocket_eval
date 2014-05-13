from bottle import route, run, template, view, static_file, default_app, request
import json
import simplerockets as sr
import os
import logging

@route('/evaluate/<rocket_id:int>')
@route('/evaluate/')
@route('/evaluate')
@route('/')
@view('evaluate')
def evaluate(rocket_id = None):
    if(request.query.get('id')):
        rocket_id = request.query.get('id')

    ship = partbin.getShip()
    ship.set_cachedir(os.path.join(os.getcwd(),'cache'))
    
    if(rocket_id):
        ship.load(rocket_id)
    else:
        ship.load('OrbiterFull.xml')

    return {
        'error_info': {
            'error': ship.error,
            'type': ship.error_type,
            'traceback': ship.traceback,
        },
        'rocket_id': rocket_id,
        'rocket_data': ship.partlist,
        'stage_data': {
            'parts': ship.stage_parts,
            'detachers': ship.detacher_list,
        },
        'sprite_data': shipsprites.get_dict(),
    }

@route('/<type:re:(js|css|img|cache)>/<filename>')
@route('/<type:re:(js|css|img|cache)>/<subdir:path>/<filename>')
def server_static(type, filename, subdir = ''):
    return static_file(os.path.join(type, subdir, filename),'./')

def get_app():
    return default_app()

if(os.path.dirname(__file__)):
    os.chdir(os.path.dirname(__file__))
partbin = sr.PartsBin('PartList.xml')
shipsprites = sr.SpriteMap('img/sprites/ShipSprites.xml')
try:
    logging.basicConfig(filename='rocketcenter.log',level=logging.INFO)
except Exception, e:
    pass

if __name__ == "__main__":
    run(host='localhost',port=54321,reloader=True)
