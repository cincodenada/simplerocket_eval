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
        self.tree = tree
        parts = tree.findall('./Parts/Part')
        for p in parts:
            newpart = PartInstance(p, self)
            self.partlist.append(newpart.get_dict())
        self.stage_parts = self.findStages()

    def findStages(self):
        steps = self.tree.findall("./Parts/Part/Pod/Staging/Step")
        stages = []
        for s in steps:
            cur_detachers = []
            for part in s.findall("./Activate"):
                relpart = self.tree.find("./Parts/Part[@id='%s']" % (part.get('Id')))
                nameparts = relpart.get('partType').split('-',2)
                if(nameparts[0] == 'detacher'):
                    cur_detachers.append(relpart.get('id'))
            if(len(cur_detachers)):
                stages.append(cur_detachers)

        self.detacher_list = []
        for s in range(len(stages)):
            good = []
            bad = []
            for subs in range(len(stages)):
                if(subs < s):
                    good.extend(stages[subs])
                else:
                    bad.extend(stages[subs])
            self.detacher_list.append([good,bad])

        curstage = 0
        pod_id = self.tree.find("./Parts/Part[@partType='pod-1']").get('id')
        stage_parts = []
        pod_parts = []
        for s in stages:
            print "Next stage..."
            cur_parts = []
            for d in s:
                parent = self.tree.find("./Connections/Connection[@childPart='%s']" % (d))
                child = self.tree.find("./Connections/Connection[@parentPart='%s']" % (d))
                sides = [
                    self.getCurrentStage(parent.get('parentPart'), [], d, curstage,0),
                    self.getCurrentStage(child.get('childPart'), [], d, curstage,0)
                ]
                if(sides[0] and sides[1]):
                    if(pod_id in sides[0]):
                        pod_parts.extend(sides[0])
                        cur_parts.extend(sides[1])
                    elif(pod_id in sides[1]):
                        pod_parts.extend(sides[1])
                        cur_parts.extend(sides[0])
                else:
                    cur_parts.extend(sides[0] if sides[0] else sides[1])
            stage_parts.append(list(set(cur_parts)))
            curstage += 1

        stage_parts.append(list(set(pod_parts)))

        return stage_parts

    def getCurrentStage(self, from_id, part_pool, cur_detacher, curstage, depth):
        if(depth > 50):
            return False

        parents = self.tree.findall("./Connections/Connection[@childPart='%s']" % (from_id))
        parent_ids = [p.get('parentPart') for p in parents]
        children = self.tree.findall("./Connections/Connection[@parentPart='%s']" % (from_id))
        child_ids = [c.get('childPart') for c in children]

        part_pool.append(from_id)
        #print " "*depth + "Found parts connected to %s..." % (from_id)
        for connected in (parent_ids + child_ids):
            if((connected in part_pool) or (connected == cur_detacher)):
                #print " "*depth + "Already dealt with part %s" % (connected)
                continue
            elif(connected in self.detacher_list[curstage][0]):
                #print " "*depth + "Part %s is previous connector, ignoring" % (connected)
                continue
            elif(connected in self.detacher_list[curstage][1]):
                #print " "*depth + "Part %s is new connector, collapsing!" % (connected)
                return False
            else:
                #print " "*depth + "Part %s looks good, adding..." % (connected)
                new_parts = self.getCurrentStage(connected, part_pool, cur_detacher, curstage, depth+1)
                if(new_parts):
                    part_pool.extend(new_parts)
                else:
                    return False

        return part_pool

class PartInstance:
    def __init__(self, element, ship):
        self.elem = element
        self.ship = ship
        self.part = ship.partsbin[self.elem.get('partType')]

    def get_dict(self):
        retdict = self.part.get_dict()
        retdict.update({k: float(v)
            for k, v in self.elem.attrib.iteritems()
            if k in ('x','y','editorAngle','id')
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
            'shape': self.get_shape(),
            'type': self.elem.get('type'),
            'id': self.elem.get('id'),
            'name': self.elem.get('name'),
        }

