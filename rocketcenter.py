from bottle import route, run, template, view, static_file, default_app
import json
import simplerockets as sr
import os

@route('/evaluate/<rocket_id:int>')
@route('/evaluate/')
@route('/')
@view('evaluate')
def evaluate(rocket_id = None):
    ship = partbin.getShip()
    if(rocket_id):
        ship.loadRemoteShip(rocket_id)
    else:
        ship.loadFile('OrbiterFull.xml')
    return {
        'rocket_id': rocket_id,
        'rocket_data': ship.partlist,
        'stage_data': {
            'parts': ship.stage_parts,
            'detachers': ship.detacher_list,
        },
        'sprite_data': shipsprites.get_dict(),
    }

@route('/<type:re:(js|css|img)>/<filename>')
@route('/<type:re:(js|css|img)>/<subdir:path>/<filename>')
def server_static(type, filename, subdir = ''):
    return static_file(os.path.join(type, subdir, filename),'./')

def get_app():
    return default_app()

os.chdir(os.path.dirname(__file__))
partbin = sr.PartsBin('PartList.xml')
shipsprites = sr.SpriteMap('img/sprites/ShipSprites.xml')

if __name__ == "__main__":
    run(host='localhost',port=54321,reloader=True)
