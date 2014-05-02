from bottle import route, run, template, view
import json
import simplerockets as sr

@route('/evaluate/<rocket_id>')
@view('evaluate')
def evaluate(rocket_id):
    ship = partbin.getShip()
    ship.loadFile('OrbiterTop.xml')
    return {'rocket_id': rocket_id, 'rocket_data': ship.partlist}

partbin = sr.PartsBin('PartList.xml')

run(host='localhost',port=54321,reloader=True)
