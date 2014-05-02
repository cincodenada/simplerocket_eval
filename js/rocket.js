function Rocket(partslist, dc) {
    this.partslist = partslist;
    this.fuel_level = 1;
    this.dc = dc;
}

//Draw rocket
Rocket.prototype.draw = function() {
    var me = this;
    $.each(this.partslist, function(idx, part) {
        //Draw part
        me.dc.strokeStyle = "black";
        me.dc.fillStyle = "white";
        me.draw_part(part);

        me.dc.fillStyle = "red";
        me.dc.beginPath()

        //Draw part centroid
        centroid = me.part_abs(part, 'centroid');
        me.dc.arc(
            centroid[0],centroid[1],
            0.25*part.mass,0,Math.PI*2,false
        );
        me.dc.fill();
    });

    this.draw_centroid();
}

Rocket.prototype.draw_part = function(part) {
    this.dc.beginPath()
    startpoint = this.part_abs(part, 'shape', 0);
    this.dc.moveTo(startpoint[0], startpoint[1]);
    for(i=1;i<part.shape.length;i++) {
        curpoint = this.part_abs(part, 'shape', i);
        this.dc.lineTo(curpoint[0], curpoint[1]);
    }
    this.dc.closePath();
    this.dc.stroke();
}

Rocket.prototype.draw_centroid = function() {
    var me = this;
    avgcentroid = [0,0];
    total_mass = 0;
    $.each(this.partslist, function(idx, part) {
        centroid = me.part_abs(part, 'centroid');

        adj_mass = part.mass - part.fuel_mass*(1-me.fuel_level);

        avgcentroid[0] += centroid[0]*adj_mass;
        avgcentroid[1] += centroid[1]*adj_mass;

        total_mass += adj_mass;
    });
    avgcentroid[0] = avgcentroid[0]/total_mass;
    avgcentroid[1] = avgcentroid[1]/total_mass;

    me.dc.strokeStyle = "green";
    me.dc.lineWidth = 0.2;

    //Draw part centroid
    hairsize = 0.5;
    me.dc.drawX(avgcentroid[0],avgcentroid[1],0.5);
}

Rocket.prototype.part_abs = function(part, property, index) {
    prop = part[property];
    if(index != undefined) {
        prop = prop[index];
    }
    return [
        part.x*2 + prop[0],
        part.y*2 + prop[1]
    ]
}

Rocket.prototype.getClosestPart = function(mouseevt) {
    var me = this;
    var x = mouseevt.pageX - this.dc.canvas.offsetLeft;
    var y = mouseevt.pageY - this.dc.canvas.offsetTop;

    x = (x - this.dc.canvas.clientWidth/2)/10;
    y = -(y - this.dc.canvas.clientHeight/2)/10;

    //Debug
    //this.dc.drawX(x,y,0.75);

    mindist = 999999;
    minidx = null;
    $.each(this.partslist, function(idx, part) {
        point = me.part_abs(part, 'centroid');
        dist = Math.sqrt(
            Math.pow(point[0] - x,2) +
            Math.pow(point[1] - y,2)
        );
        if(dist < mindist) {
            mindist = dist;
            minidx = idx;
        }
    });

    return this.partslist[minidx];
}
