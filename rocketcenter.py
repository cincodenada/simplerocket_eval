from bottle import route, run, template, view, static_file
import json
import simplerockets as sr
import os

@route('/evaluate/<rocket_id:int>')
@route('/evaluate/')
@view('evaluate')
def evaluate(rocket_id = None):
    ship = partbin.getShip()
    if(rocket_id):
        ship.loadRemoteShip(rocket_id)
    else:
        ship.loadFile('OrbiterTop.xml')
    return {'rocket_id': rocket_id, 'rocket_data': ship.partlist}

@route('/<type:re:(js|css|img)>/<filename>')
def server_static(type, filename):
    return static_file(os.path.join(type, filename),'./')

partbin = sr.PartsBin('PartList.xml')

run(host='localhost',port=54321,reloader=True)
