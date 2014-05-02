function Rocket() {
    this.partslist = rocketdata;
    this.fuel_level = 1;
}

//Draw rocket
Rocket.prototype.draw = function() {
    var me = this;
    $.each(rocketdata, function(idx, part) {
        //Draw part
        ctx.fillStyle = "white";
        ctx.beginPath()
        startpoint = me.part_abs(part, 'shape', 0);
        ctx.moveTo(startpoint[0], startpoint[1]);
        for(i=1;i<part.shape.length;i++) {
            curpoint = me.part_abs(part, 'shape', i);
            ctx.lineTo(curpoint[0], curpoint[1]);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = "red";
        ctx.beginPath()

        //Draw part centroid
        centroid = me.part_abs(part, 'centroid');
        ctx.arc(
            centroid[0],centroid[1],
            0.25*part.mass,0,Math.PI*2,false
        );
        ctx.fill();
    });

    this.draw_centroid();
}

Rocket.prototype.draw_centroid = function() {
    var me = this;
    avgcentroid = [0,0];
    total_mass = 0;
    $.each(rocketdata, function(idx, part) {
        centroid = me.part_abs(part, 'centroid');

        adj_mass = part.mass - part.fuel_mass*(1-me.fuel_level);

        avgcentroid[0] += centroid[0]*adj_mass;
        avgcentroid[1] += centroid[1]*adj_mass;

        total_mass += adj_mass;
    });
    avgcentroid[0] = avgcentroid[0]/total_mass;
    avgcentroid[1] = avgcentroid[1]/total_mass;

    ctx.strokeStyle = "green";
    ctx.lineWidth = 0.2;
    ctx.beginPath()

    //Draw part centroid
    hairsize = 0.5;
    ctx.moveTo(avgcentroid[0]-hairsize,avgcentroid[1]-hairsize);
    ctx.lineTo(avgcentroid[0]+hairsize,avgcentroid[1]+hairsize);
    ctx.moveTo(avgcentroid[0]-hairsize,avgcentroid[1]+hairsize);
    ctx.lineTo(avgcentroid[0]+hairsize,avgcentroid[1]-hairsize);
    ctx.stroke();
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
