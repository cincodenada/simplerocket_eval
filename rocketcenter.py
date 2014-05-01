from bottle import route, run, template
import requests
import xml.etree.ElementTree as ET

ship_url = 'http://jundroo.com/service/SimpleRockets/DownloadRocket?id=%d'

@route('/evaluate/<rocket_id>')
def evaluate(rocket_id):
    #ship = requests.get(ship_url % (int(rocket_id)))
    #TODO: Perhaps .parse() with ship.raw?
    #tree = ET.fromstring(ship.text)
    tree = ET.parse('OrbiterTop.xml');
    for part in tree.findall('./Parts/Part'):
        curpart = part_dict[part.get('partType')]
        print curpart.get_mass()
    return template('Evaluating rocket id {{rocket_id}}...', rocket_id=rocket_id)

class ShipPart:
    def __init__(self, element):
        self.elem = element

    def get_centroid(self):
        return (int(self.elem.get('width'))/2,int(self.elem.get('height'))/2)
    
    def get_mass(self):
        return float(self.elem.get('mass'))

part_dict = {}
#Parse the PartsList XML
parts_xml = ET.ElementTree()
parts_xml.parse('PartList.xml')
#Fucking namespaces...
for part in parts_xml.findall('./*'):
    part_dict[part.get('id')] = ShipPart(part)

run(host='localhost',port=54321)

