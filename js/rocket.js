/* 
 * Rocket 
 */
function Rocket(data, dc) {
    this.partslist = data.parts;
    this.stagedata = data.stages;
    this.numstages = this.stagedata.parts.length;
    this.dc = dc;
    this.engine_fuel = [1];
    this.selpart = [];
    this.curstage = 0;

    this.fuel_style = 'overlay';
    this.drawmode = 'sprites';
    this.show_annotations = true;

    this.spritemap = data.sprites;
    this.sprite = new Image();
    this.sprite.src = data.spriteurl;

    //After some empirical calculations, I am assuming that the 
    //numbers in the engines (425, 170, 85) are the thrust
    //force in kilonewtons.  Using F = Ve*m, I calculated
    //Ve = F/m for the various engines, and for the three
    //largest Ve was consistently 3400.  Using Ve=g0*Isp,
    //given g0 of 9.798 (from SmolarSystem.xml), we can find Isp. 
    //Note: The Tiny 21 is actually 21.25kN, and its consumption
    //is lower than I would expect (should be ~6), so it's Isp may
    //be different.  DeltaVs may not be accurate for it yet.
    this.Ve = 3400;
    this.g0 = 9.798;
    this.Isp = this.Ve/this.Isp

    this.stagedata.deltaV = false;
    this.centroid = false;

    this.bb = false;

    //Build parts list
    this.parts = [];
    for(var i=0;i<this.partslist.length;i++) {
        this.parts.push(new Part(this, i));
    }
}

//Draw rocket
Rocket.prototype.draw = function() {
    this.dc.strokeStyle = "black";
    this.dc.lineWidth = 0.1;
    this.dc.fillStyle = "silver";
    $.each(this.parts, function(idx, part) {
        //Draw non-selected parts
        if(!part.selected()) {
            part.draw(true);
        }
    });
    //Draw selected parts last, so they show up on top
    for(var i=0; i<this.selpart.length; i++) {
        if(this.selpart[i]) {
            this.parts[i].draw(true);
        }
    }
}

Rocket.prototype.get_fuel = function(idx) {
    if(this.engine_fuel[idx] == undefined) {
        return this.engine_fuel[0];
    } else {
        return this.engine_fuel[idx];
    }
}

Rocket.prototype.set_fuel = function(value) {
    this.show_annotations = true;
	anysel = false;
	if(this.selpart.length == 1) { this.engine_fuel = [value]; }
	else {
		for(var i=0;i<this.selpart.length;i++) {
			if(this.selpart[i]) {
				this.engine_fuel[i] = value;
				anysel = true;
			}
		}
		if(!anysel) { this.engine_fuel = [value]; }
	}
    this.clear_calculated();
}

Rocket.prototype.get_centroid = function() {
    if(!this.centroid) {
        avgcentroid = [0,0];
        total_mass = 0;
        $.each(this.parts, function(idx, part) {
            if(part.is_active()) {
                centroid = part.get_abs('centroid');
                adj_mass = part.get_mass();

                avgcentroid[0] += centroid[0]*adj_mass;
                avgcentroid[1] += centroid[1]*adj_mass;
                total_mass += adj_mass;
            }
        });
        avgcentroid[0] = avgcentroid[0]/total_mass;
        avgcentroid[1] = avgcentroid[1]/total_mass;

        this.centroid = avgcentroid;
    }

    return this.centroid
}

Rocket.prototype.draw_centroid = function() {
    //Draw part centroid
    this.get_centroid();

    this.dc.strokeStyle = "black";
    this.dc.lineWidth = 0.4;
    this.dc.drawX(this.centroid[0],this.centroid[1],0.6);
    this.dc.strokeStyle = "yellow";
    this.dc.lineWidth = 0.2;
    this.dc.drawX(this.centroid[0],this.centroid[1],0.5);

    this.draw_balance();
}

Rocket.prototype.draw_balance = function() {
    rcs = [];
    for(idx in this.parts) {
        if(this.parts[idx].get('type') == 'rcs') {
            rcs.push(this.parts[idx]);
        }
    }

    center = this.get_centroid();
    torque = [];
    total_torque = [0,0,0,0];
    for(var i=0; i<rcs.length; i++) {
        relpos = [
            rcs[i].get('x') - center[0],
            rcs[i].get('y') - center[1]
        ];
        dist = Math.sqrt(Math.pow(relpos[0],2) + Math.pow(relpos[1],2));
        //I did my math assuming a positive angle
        //this lost sign is probably put back in down there somewhere
        //But this works too, which is all I care about.
        θ = Math.abs(Math.atan(relpos[1]/relpos[0]));
        //Force this engine contributes for each direction (up, right, down, left)
        f = [
            1,
            rcs[i].get('flippedX') ? 1 : 0,
            -1,
            rcs[i].get('flippedX') ? 0 : -1,
        ];

        //Get the torque direction
        torque_dir = $.map(relpos, function(val, i) {
            return val == 0 ? 0 : (val > 0 ? 1 : -1);
        });
            

        //f' = f sin θ, use 1 for f since it's as good as any
        torque[i] = [
            f[0]*Math.cos(θ)*dist*torque_dir[0],
            -f[1]*Math.sin(θ)*dist*torque_dir[1],
            f[2]*Math.cos(θ)*dist*torque_dir[0],
            -f[3]*Math.sin(θ)*dist*torque_dir[1],
        ];

        for(var j=0; j<4;j++) {
            total_torque[j] += torque[i][j];
        }
    }

    margin = 0.5;
    bb = this.get_bb();
    this.dc.beginPath();

    this.dc.moveTo(center[0],                   bb[0][1] - margin);
    this.dc.lineTo(center[0] + total_torque[0], bb[0][1] - margin);

    this.dc.moveTo(center[0],                   bb[1][1] + margin);
    this.dc.lineTo(center[0] - total_torque[2], bb[1][1] + margin);

    this.dc.moveTo(bb[1][0] + margin,center[1]);
    this.dc.lineTo(bb[1][0] + margin,center[1] + total_torque[1]);

    this.dc.moveTo(bb[0][0] - margin,center[1]);
    this.dc.lineTo(bb[0][0] - margin,center[1] - total_torque[3]);


    this.dc.strokeStyle = "black";
    this.dc.lineWidth = 0.5;
    this.dc.stroke();
    this.dc.strokeStyle = "red";
    this.dc.lineWidth = 0.3;
    this.dc.stroke();
}

Rocket.prototype.getClosestPart = function(clicked, maxdist) {
    var me = this;

    //Debug
    //this.dc.drawX(x,y,0.75);
    var insidelist = []

    mindist = 999999;
    minidx = null;
    $.each(this.parts, function(idx, part) {
        //Test for square bounds
        if(part.box_contains(clicked.x, clicked.y)) {
            insidelist.push(idx);
        }

        point = part.get_abs('centroid');
        dist = Math.sqrt(
            Math.pow(point[0] - clicked.x,2) +
            Math.pow(point[1] - clicked.y,2)
        );
        if(dist < mindist) {
            mindist = dist;
            minidx = idx;
        }
    });

    if(insidelist.length == 1) {
        return insidelist[0];
    } else if(!maxdist || mindist < maxdist) {
        return minidx;
    } else {
        return null;
    }
}

Rocket.prototype.select = function(idx) {
    this.selpart[idx] = true;
}

Rocket.prototype.deselect = function(idx) {
    this.selpart[idx] = false;
}

Rocket.prototype.toggle_selected = function(idx) {
    this.selpart[idx] = !this.selpart[idx];
}

Rocket.prototype.set_selected = function(idx) {
    this.selpart = [];
    this.selpart[idx] = true;
}

Rocket.prototype.render = function() {
    this.draw();
    this.draw_centroid();
}

Rocket.prototype.set_stage = function(stage) {
    this.curstage = parseInt(stage);
    this.clear_calculated(false);
}

Rocket.prototype.move_parts = function(x, y) {
    for(var i=0; i<this.selpart.length;i++) {
        if(this.selpart[i]) {
            this.parts[i].data.x += x;
            this.parts[i].data.y += y;
        }
    }
    this.clear_calculated(false);
}

Rocket.prototype.deltaV = function(stage) {
    if(!this.stagedata.deltaV) {
        stage_masses = [];
        final_masses = [];
        for(var s=0;s<this.numstages;s++) {
            stage_masses[s] = 0;
            final_masses[s] = 0;
        }
        for(var idx in this.parts) {
            part = this.parts[idx];
            for(var s=0;s<=part.stage;s++) {
                var curmass = part.get_mass();
                stage_masses[s] += curmass;
                final_masses[s] += curmass;
            }
            if(part.data.type=="tank" && part.data.category != 'Satellite') {
                final_masses[part.stage] -= part.get_fuel_mass()
            }
        }

        this.stagedata.deltaV = [];
        for(var s=0; s<this.numstages;s++) {
            //Tsiolkovsky rocket equation
            this.stagedata.deltaV[s] =
                this.Ve*Math.log(stage_masses[s]/final_masses[s])/Math.log(2);
        }
    }

    if(typeof stage == 'undefined') {
        return this.stagedata.deltaV;
    } else {
        return this.stagedata.deltaV[stage];
    }
}

//min, max/x, y
Rocket.prototype.get_bb = function() {
    var me = this;
    if(!this.bb) {
        this.bb = [
            [null,null],
            [null,null],
        ];
        $.each(this.parts, function(idx, part) {
            if(part.is_active()) {
                pos = part.get('position');
                halfsize = $.map(part.get('size'), function(x) { return x/2; });

                //Extend bounding box for our rocket
                for(var minmax = 0; minmax < 2; minmax++) {
                    posneg = minmax*2-1;
                    for(var xy = 0; xy < 2; xy++) {
                        compval = pos[xy] + (halfsize[xy] * posneg);
                        if(me.bb[minmax][xy] == null ||
                            posneg*compval > posneg*me.bb[minmax][xy]) {
                            me.bb[minmax][xy] = compval;
                        }
                    }
                }
            }
        });
    }
    return this.bb;
}

Rocket.prototype.clear_calculated = function(stagedata) {
    if(typeof stagedata == 'undefined') { stagedata = true; }
    this.centroid = false;
    this.bb = false;
    if(stagedata) {
        this.stagedata.deltaV = false;
    }
}


/*
 * Rocket Part
 */
function Part(rocket, idx) {
    this.idx = idx;
    this.rocket = rocket;

    this.data = this.rocket.partslist[idx];
    this.dc = this.rocket.dc;

    this.stage = this.get_stage();

    //Pull in our sprite data
    this.spritedata = this.rocket.spritemap[this.data.sprite.toLowerCase()];
}

Part.prototype.get_stage = function() {
    //Find our stage
    if(this.rocket.stagedata.detachers.length == 0) {
        //If we have no detachers, everything is stage 0
        return 0;
    } else {
        if(this.data.type == 'detacher') {
            for(s=0;s<this.rocket.stagedata.detachers.length;s++) {
                for(p=0;p<this.rocket.stagedata.detachers[s][0].length;p++) {
                    if(this.rocket.stagedata.detachers[s][0][p] == this.data.id) {
                        return s;
                    }
                }
            }
        } else {
            for(s=0;s<this.rocket.stagedata.parts.length;s++) {
                for(p=0;p<this.rocket.stagedata.parts[s].length;p++) {
                    if(this.rocket.stagedata.parts[s][p] == this.data.id) {
                        return s;
                    }
                }
            }
        }
    }
}

Part.prototype.get = function(attr) {
    switch(attr) {
    case "x":
    case "y":
        return this.data[attr]*2;
    case "position":
        return [this.data.x*2,this.data.y*2];
    default:
        return this.data[attr];
    }
}

Part.prototype.set = function(attr, val) {
    switch(attr) {
    case "x":
    case "y":
        return this.data[attr] = val/2;
    default:
        return this.data[attr] = val;
    }
}

Part.prototype.selected = function() {
    return this.rocket.selpart[this.idx];
}

Part.prototype.is_active = function() {
    if(!this.rocket.curstage) {
        return true;
    } else {
        return (this.stage >= this.rocket.curstage);
    }
}

Part.prototype.box_contains = function(x, y) {
    return (
        (this.get('x') - this.data.size[0]/2) < x &&
        (this.get('x') + this.data.size[0]/2) > x &&
        (this.get('y') - this.data.size[1]/2) < y &&
        (this.get('y') + this.data.size[1]/2) > y
    );
}

Part.prototype.draw = function(with_centroid) {
    if(typeof with_centroid == "undefined") { with_centroid = true; }

    if(!this.is_active()) { return false; } 

    this.dc.gt().save();
    this.dc.gt().translate(this.get('x'),this.get('y'));
    this.dc.gt().rotate(this.get('editorAngle')*Math.PI/2);
    this.dc.gt().scale(this.data.flippedX*2-1,1-this.data.flippedY*2);

    switch(this.rocket.drawmode) {
    case 'sprites':
        //Scale image down
        aspect = Math.max(this.spritedata.w/this.data.actual_size[0], this.spritedata.h/this.data.actual_size[1])
        spritesize = [this.spritedata.w/aspect,this.spritedata.h/aspect];
        //Draw sprite
        this.dc.gt().save()
        this.dc.gt().rotate(Math.PI);
        this.dc.drawImage(this.rocket.sprite, 
            this.spritedata.x, this.spritedata.y, this.spritedata.w, this.spritedata.h,
            -spritesize[0]/2, -spritesize[1]/2, spritesize[0], spritesize[1]
        );
        this.dc.gt().restore()
        break;
    default:
    case 'wireframe':
        this.dc.fillStyle = "silver";
        this.dc.strokeStyle = "black";
        this.dc.lineWidth = 0.1;
        this.draw_path();
        this.dc.stroke();
        this.dc.fill();
        break;
    }

    if(this.rocket.show_annotations) {
        //Draw fuel
        if(this.data.type == 'tank') {
            fuel_height = (this.data.size[1] * this.get_fuel());
            switch(this.rocket.fuel_style) {
            case 'bar':
                this.dc.fillStyle = 'rgb(0,128,0)';
                this.dc.fillRect(
                    -this.data.size[0]/2,
                    -this.data.size[1]/2,
                    0.5,
                    fuel_height
                );
                break;
            default:
            case 'overlay':
                this.dc.fillStyle = 'rgba(0,255,0,0.25)';
                this.dc.fillRect(
                    -this.data.size[0]/2,
                    -this.data.size[1]/2,
                    this.data.size[0],
                    fuel_height
                );
                break;
            }
        }

        if(with_centroid) {
            this.draw_centroid()
        }
    }


    //If selected, make selected style
    this.dc.fillStyle = "silver";
    if(this.selected()) {
        this.dc.strokeStyle = "blue";
        this.dc.lineWidth = 0.3;
        this.draw_path();
        this.dc.stroke();
    }


    this.dc.gt().restore();
}

Part.prototype.draw_path = function() {
    this.dc.beginPath()
    this.dc.moveTo(this.data.shape[0][0], this.data.shape[0][1]);
    for(var i=1;i<this.data.shape.length;i++) {
        this.dc.lineTo(this.data.shape[i][0], this.data.shape[i][1]);
    }
    this.dc.closePath();
}

Part.prototype.draw_centroid = function() {
    this.dc.fillStyle = "green";
    this.dc.beginPath()

    //Draw part centroid
    adj_mass = this.data.mass - this.data.fuel_mass*(1-this.get_fuel());
    this.dc.arc(
        this.data.centroid[0],this.data.centroid[1],
        Math.sqrt(0.25*adj_mass/Math.PI),0,Math.PI*2,false
    );
    this.dc.fill();
}

Part.prototype.get_abs = function(attr, index) {
    prop = this.data[attr];
    if(index != undefined) {
        prop = prop[index];
    }
    return [
        this.data.x*2 + prop[0],
        this.data.y*2 + prop[1]
    ];
}

Part.prototype.get_mass = function() {
    return this.data.mass - this.data.fuel_mass*(1-this.get_fuel());
}

Part.prototype.get_fuel = function() {
    return this.rocket.get_fuel(this.idx);
}

Part.prototype.get_fuel_mass = function() {
    return this.data.fuel_mass*this.get_fuel();
}
