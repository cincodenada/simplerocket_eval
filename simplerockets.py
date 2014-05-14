import xml.etree.ElementTree as ET
from polyfunc import SimplePoly
import requests
import sys, traceback
import os
import logging
from logging import debug, info, warning, error, critical

ship_url = 'http://jundroo.com/service/SimpleRockets/DownloadRocket?id=%d'
traceback_depth = None 

class PartsBin:
    def __init__(self, xmlfile):
        self.part_dict = {}
        self.fuel_mass_per_liter = 0.002

        #Parse the PartsList XML
        self.tree = ET.ElementTree()
        self.tree.parse(xmlfile)

        #Fucking namespaces...
        for part in self.tree.findall('./*'):
            self.part_dict[part.get('id')] = ShipPart(part, self)

    def getShip(self):
        return Ship(self)

    def __getitem__(self, idx):
        return self.part_dict[idx]

class Ship:
    maxdepth = 100
    cache_dir = 'cache'

    def __init__(self, partsbin):
        self.partsbin = partsbin
        self.partlist = []
        self.stage_parts = []
        self.detacher_list = []
        self.error = None
        self.error_type = None
        self.traceback = None
        self.name = ''

    def set_cachedir(self, newdir):
        self.cachedir = newdir

    def get_cachepath(self, shipid):
        return os.path.join(self.cache_dir, '%d.xml' % (shipid))

    def load(self, fromwhat):
        try:
            try:
                shipid = int(fromwhat)
                #Try loading from cache
                info("Trying cache...")
                try:
                    self.loadFile(self.get_cachepath(shipid))
                    info("Loaded from cache.")
                except (ET.ParseError, IOError):
                    info("Cache failed, getting live...")
                    self.loadRemoteShip(shipid)
            except ValueError:
                self.loadFile(fromwhat)

        except (ET.ParseError, IOError), e:
            self.error_type = "FileLoad"
            self.error = "Error loading file: " + str(e)
            return False
        except KeyError:
            self.error_type = "FileParse"
            self.error = "Error reading ship file.  The most likely cause is the ship using parts from a mod that the parser isn't familiar with, or if it was simply too big for the parser as-is."
            return False
        except MemoryError:
            self.error_type = "FileParse"
            self.error = "Ran out of memory loading your ship.  This is likely because you have lots of stages/detachers, and my parser isn't very good at that yet.  Sorry - I'm working on it!"
            return False
        except Exception, e:
            self.error_type = "Unknown"
            self.error = "Unknown error loading ship file.  Get me a ship ID and I can look through my error logs.  Details: " + str(e)
            etyp, eval, etb = sys.exc_info()
            self.traceback = traceback.format_exception(Exception,e,etb)
            return False

        return True

    def loadFile(self, xmlfile):
        self.parseFile(ET.parse(xmlfile));

    def loadRemoteShip(self, shipid):
        shipfile = requests.get(ship_url % (int(shipid)))
        #Try saving to cache
        try:
            with open(self.get_cachepath(shipid), 'wb') as fd:
                fd.write(shipfile.content)
                fd.close()
        except IOError:
            warning("Failed to cache ship!")

        self.parseFile(ET.fromstring(shipfile.text))

    def parseFile(self, tree):
        self.detacher_list = []
        self.partlist = []
        self.tree = tree
        parts = tree.findall('./Parts/Part')
        for p in parts:
            newpart = PartInstance(p, self)
            newpart.adjust()
            self.partlist.append(newpart.get_dict())
        self.stage_parts = self.findStages()

    def findStages(self):
        steps = self.tree.findall("./Parts/Part/Pod/Staging/Step")
        stages = []
        for s in steps:
            debug('Next stage...')
            debug(str(s))
            cur_detachers = []
            for part in s.findall("./Activate"):
                partid = part.get('Id');
                debug('Looking up part %s...' % (partid))
                relpart = self.tree.find("./Parts/Part[@id='%s']" % (partid))
                part_type = self.partsbin[relpart.get('partType')]['type']
                if(part_type == 'detacher'):
                    cur_detachers.append(partid)
            if(len(cur_detachers)):
                stages.append(cur_detachers)

        for s in range(len(stages)):
            good = []
            bad = []
            for subs in range(len(stages)):
                if(subs <= s):
                    good.extend(stages[subs])
                else:
                    bad.extend(stages[subs])
            self.detacher_list.append([good,bad])
        debug('Stage list: ' + str(self.detacher_list))

        curstage = 0
        try:
            pod = self.tree.find("./Parts/Part[@partType='pod-1']")
            pod_id = pod.get('id')
            self.name = pod.find("./Pod").get('name')
        except:
            raise KeyError, 'Pod not found!'
        findresult = [[],[]]

        stage_parts = []
        pod_parts = []
        for s in stages:
            debug("Finding parts for stage...")
            debug(str(s))
            cur_parts = []
            for d in s:
                debug("Scanning part %s..." % (d))
                sidebin = [[],[]]

                curside = self.tree.find("./Connections/Connection[@childPart='%s']" % (d))
                findresult[0] = [curside.get('parentPart')] if curside is not None else False
                curside = self.tree.find("./Connections/Connection[@parentPart='%s']" % (d))
                findresult[1] = [curside.get('childPart')] if curside is not None else False

                debug(str(findresult))
                cycle = 0
                while(findresult[0] or findresult[1]):
                    if(findresult[0]):
                        findresult[0] = self.getMoreParts(findresult[0], sidebin[0], curstage, cycle)
                    if(findresult[1]):
                        findresult[1] = self.getMoreParts(findresult[1], sidebin[1], curstage, cycle)
                    cycle += 1

                debug(str(sidebin))

                if(findresult[0] != False and findresult[1] != False):
                    if(pod_id in sidebin[0]):
                        pod_parts.extend(sidebin[0])
                        cur_parts.extend(sidebin[1])
                    elif(pod_id in sidebin[1]):
                        pod_parts.extend(sidebin[1])
                        cur_parts.extend(sidebin[0])
                elif(findresult[0] != False or findresult[1] != False):
                    cur_parts.extend(sidebin[0] if (findresult[0] != False) else sidebin[1])
            stage_parts.append(list(set(cur_parts)))
            curstage += 1

        stage_parts.append(list(set(pod_parts)))

        return stage_parts

    def getMoreParts(self, from_ids, part_pool, curstage, depth):
        debug(" "*depth + "Examining parts %s..." % (','.join(from_ids)))
        part_pool.extend(from_ids)
        debug(part_pool)
        next_parts = []

        for curid in from_ids:
            parent_ids = [p.get('parentPart') for p in self.tree.findall("./Connections/Connection[@childPart='%s']" % (curid))]
            child_ids = [c.get('childPart') for c in self.tree.findall("./Connections/Connection[@parentPart='%s']" % (curid))]
            debug(" "*depth + "Found parts connected to %s..." % (curid))
            debug(parent_ids + child_ids)
            for connected in (parent_ids + child_ids):
                if(connected in part_pool):
                    debug(" "*depth + "Already dealt with part %s" % (connected))
                    continue
                elif(connected in self.detacher_list[curstage][0]):
                    debug(" "*depth + "Part %s is previous connector, ignoring" % (connected))
                    continue
                elif(connected in self.detacher_list[curstage][1]):
                    debug(" "*depth + "Part %s is new connector, collapsing!" % (connected))
                    return False
                else:
                    debug(" "*depth + "Part %s looks good, adding..." % (connected))
                    next_parts.append(connected)

        return next_parts

class PartInstance:
    def __init__(self, element, ship):
        self.elem = element
        self.ship = ship
        self.part = ship.partsbin[self.elem.get('partType')]
        self.parent = ship.tree.find("./Connections/Connection[@childPart='%s']" % (self['id']))
        self.children = ship.tree.findall("./Connections/Connection[@parentPart='%s']" % (self['id']))

    def get_dict(self):
        retdict = self.part.get_dict()
        retdict.update({k: float(v)
            for k, v in self.elem.attrib.iteritems()
            if k in ('x','y','editorAngle','flippedX','flippedY','id')
        })
        return retdict

    def __dict__(self):
        return self.get_dict()

    def __getitem__(self, key):
        return self.elem.get(key)

    def adjust(self):
        #Flip lander struts for display
        if(self.part['type'] in ('lander')):
            if((self.parent is not None) and int(self.parent.get('childAttachPoint')) == 1):
                self.elem.set('flippedX',1-int(self['flippedX']))

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

    def get_actual_size(self, shape):
        maxx = maxy = 0
        for curpoint in shape:
            if(abs(curpoint[0]) > maxx):
                maxx = abs(curpoint[0])
            if(abs(curpoint[1]) > maxy):
                maxy = abs(curpoint[1])
        return (maxx*2,maxy*2)


    def get_dict(self):
        shape = self.get_shape();
        data = {k: v for k, v in self.elem.attrib.iteritems() if k not in('id')};
        data.update({
            'centroid': self.get_centroid(),
            'mass': self.get_mass(),
            'fuel_mass': self.get_fuel_mass(),
            'size': self.get_size(),
            'shape': shape,
            'actual_size': self.get_actual_size(shape),
        })
        return data

    def __getitem__(self, key):
        return self.elem.get(key)

class SpriteMap:
    def __init__(self, xmlfile):
        sprite_xml = ET.ElementTree()
        sprite_xml.parse(xmlfile)
        self.sprite_list = {}

        for sprite in sprite_xml.findall('./sprite'):
            self.sprite_list[sprite.get('n').lower()] = sprite.attrib

    def get_dict(self):
        return self.sprite_list
