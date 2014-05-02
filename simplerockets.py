import xml.etree.ElementTree as ET
from polyfunc import SimplePoly
import requests

ship_url = 'http://jundroo.com/service/SimpleRockets/DownloadRocket?id=%d'

class PartsBin:
    def __init__(self, xmlfile):
        self.part_dict = {}
        self.fuel_mass_per_liter = 0.002

        #Parse the PartsList XML
        parts_xml = ET.ElementTree()
        parts_xml.parse(xmlfile)

        #Fucking namespaces...
        for part in parts_xml.findall('./*'):
            self.part_dict[part.get('id')] = ShipPart(part, self)

    def getShip(self):
        return Ship(self)

    def __getitem__(self, idx):
        return self.part_dict[idx]

class Ship:
    def __init__(self, partsbin):
        self.partsbin = partsbin
        self.partlist = []

    def loadFile(self, xmlfile):
        return self.parseFile(ET.parse(xmlfile));

    def loadRemoteShip(self, shipid):
        shipfile = requests.get(ship_url % (int(shipid)))
        #TODO: Perhaps .parse() with ship.raw?
        return self.parseFile(ET.fromstring(shipfile.text))

    def parseFile(self, tree):
        self.partlist = []
        parts = tree.findall('./Parts/Part')
        for p in parts:
            newpart = PartInstance(p, self)
            self.partlist.append(newpart.get_dict())

class PartInstance:
    def __init__(self, element, ship):
        self.elem = element
        self.ship = ship
        self.part = ship.partsbin[self.elem.get('partType')]

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
    centroid = None

    def __init__(self, element, partsbin):
        self.elem = element
        self.partsbin = partsbin

    def get_centroid(self):
        if(self.centroid is not None):
            return self.centroid
        else:
            if(self.is_poly()):
                poly = SimplePoly(self.get_shape())
                return poly.centroid()
            else:
                return (0,0)
    
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
            return float(tank.get('fuel'))*self.partsbin.fuel_mass_per_liter

    def is_poly(self):
        return (self.elem.find('Shape') is not None)

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
                for v in shape.findall('./Vertex')
            )


    def get_dict(self):
        return {
            'centroid': self.get_centroid(),
            'mass': self.get_mass(),
            'fuel_mass': self.get_fuel_mass(),
            'size': self.get_size(),
            'shape': self.get_shape()
        }

