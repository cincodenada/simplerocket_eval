from bottle import route, run, template, view
import requests
import xml.etree.ElementTree as ET
import json
from polyfunc import SimplePoly

ship_url = 'http://jundroo.com/service/SimpleRockets/DownloadRocket?id=%d'

@route('/evaluate/<rocket_id>')
@view('evaluate')
def evaluate(rocket_id):
    #ship = requests.get(ship_url % (int(rocket_id)))
    #TODO: Perhaps .parse() with ship.raw?
    #tree = ET.fromstring(ship.text)
    tree = ET.parse('OrbiterTop.xml');
    parts = tree.findall('./Parts/Part')
    partlist = []
    for p in parts:
        newpart = PartInstance(p)
        partlist.append(newpart.get_dict())
    return {'rocket_id': rocket_id, 'rocket_data': partlist}

class PartInstance:
    def __init__(self, element):
        self.elem = element
        self.part = part_dict[self.elem.get('partType')]

    def get_dict(self):
        retdict = self.part.get_dict()
        retdict.update({k: float(v)
            for k, v in self.elem.attrib.iteritems()
            if k in ('x','y','editorAngle')
        })
        return retdict

    def __dict__():
        return retdict


class ShipPart:
    def __init__(self, element):
        self.elem = element

    def get_centroid(self):
        if(self.is_poly()):
            poly = SimplePoly(self.get_shape())
            return poly.centroid()
        else:
            return (float(self.elem.get('width'))/2,float(self.elem.get('height'))/2)
    
    def get_mass(self):
        return float(self.elem.get('mass'))

    #Return a tuple of (width, height)
    def get_size(self):
        return (float(self.elem.get('width')),float(self.elem.get('height')))

    def get_fuel_mass(self):
        tank = self.elem.find('Tank')
        if(tank is None):
            return 0
        else:
            return float(tank.get('fuel'))*fuel_mass_per_liter

    def is_poly(self):
        return (self.elem.find('Shape') is None)

    def get_shape(self):
        shape = self.elem.find('Shape')
        if(shape is None):
            halfsize = tuple(x/2 for x in self.get_size())
            return (
                (halfsize[0],halfsize[1]),
                (-halfsize[0],halfsize[1]),
                (-halfsize[0],-halfsize[1]),
                (halfsize[0],-halfsize[1])
            )
        else:
            return tuple(
                (float(v.get('x')),float(v.get('y')))
                for vert in shape.findall('./Vertex')
            )


    def get_dict(self):
        return {
            'centroid': self.get_centroid(),
            'mass': self.get_mass(),
            'fuel_mass': self.get_fuel_mass(),
            'size': self.get_size(),
            'shape': self.get_shape()
        }

part_dict = {}
fuel_mass_per_liter = 0.002
#Parse the PartsList XML
parts_xml = ET.ElementTree()
parts_xml.parse('PartList.xml')
#Fucking namespaces...
for part in parts_xml.findall('./*'):
    part_dict[part.get('id')] = ShipPart(part)

run(host='localhost',port=54321)
