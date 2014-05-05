/* 
 * Rocket 
 */
function Rocket(data, dc) {
    this.partslist = data.parts;
    this.stagedata = data.stages;
    this.dc = dc;
    this.engine_fuel = [1];
    this.selpart = [];
    this.curstage = 0;

    this.fuel_style = 'overlay';
    this.drawmode = 'wireframe';

    this.spritemap = data.sprites;
    this.sprite = new Image();
    this.sprite.src = data.spriteurl;

    //Build parts list
    this.parts = [];
    for(var i=0;i<this.partslist.length;i++) {
        this.parts.push(new Part(this, i));
    }
}

//Draw rocket
Rocket.prototype.draw = function() {
    var me = this;

    me.dc.strokeStyle = "black";
    me.dc.lineWidth = 0.1;
    me.dc.fillStyle = "silver";
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
    //Clear cached centroid
    this.centroid = false;
}

Rocket.prototype.draw_centroid = function() {
    var me = this;
    if(!me.centroid) {
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

        me.centroid = avgcentroid;
    }

    //Draw part centroid
    me.dc.strokeStyle = "black";
    me.dc.lineWidth = 0.4;
    me.dc.drawX(me.centroid[0],me.centroid[1],0.6);
    me.dc.strokeStyle = "yellow";
    me.dc.lineWidth = 0.2;
    me.dc.drawX(me.centroid[0],me.centroid[1],0.5);
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
    this.curstage = stage;
    this.centroid = false;
}

Rocket.prototype.move_parts = function(x, y) {
    for(var i=0; i<this.selpart.length;i++) {
        if(this.selpart[i]) {
            this.parts[i].data.x += x;
            this.parts[i].data.y += y;
        }
    }
    this.centroid = false;
}


/*
 * Rocket Part
 */
function Part(rocket, idx) {
    this.idx = idx;
    this.rocket = rocket;

    this.data = this.rocket.partslist[idx];
    this.dc = this.rocket.dc;

    //Find our stage
    if(this.rocket.stagedata.detachers.length == 0) {
        this.stage = 0;
    } else {
        if(this.data.type == 'detacher') {
            for(s=0;s<this.rocket.stagedata.detachers.length;s++) {
                for(p=0;p<this.rocket.stagedata.detachers[s][1].length;p++) {
                    if(this.rocket.stagedata.detachers[s][1][p] == this.data.id) {
                        this.stage = s;
                        break;
                    }
                }
            }
        } else {
            for(s=0;s<this.rocket.stagedata.parts.length;s++) {
                for(p=0;p<this.rocket.stagedata.parts[s].length;p++) {
                    if(this.rocket.stagedata.parts[s][p] == this.data.id) {
                        this.stage = s;
                        break;
                    }
                }
            }
        }
    }

    //Pull in our sprite data
    this.spritedata = this.rocket.spritemap[this.data.sprite.toLowerCase()];
}

Part.prototype.get = function(attr) {
    switch(attr) {
    case "x":
    case "y":
        return this.data[attr]*2;
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
    if(this.rocket.curstage == null) {
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

    switch(this.rocket.drawmode) {
    case 'sprites':
        //Draw sprite
        this.dc.gt().save()
        this.dc.gt().rotate(Math.PI);
        this.dc.drawImage(this.rocket.sprite, 
            this.spritedata.x, this.spritedata.y, this.spritedata.w, this.spritedata.h,
            -this.data.size[0]/2, -this.data.size[1]/2, this.data.size[0], this.data.size[1]
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

    //If selected, make selected style
    if(this.selected()) {
        this.dc.strokeStyle = "blue";
        this.dc.lineWidth = 0.3;
        this.draw_path();
        this.dc.stroke();
    }

    if(with_centroid) {
        this.draw_centroid()
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
    this.dc.fillStyle = "red";
    this.dc.beginPath()

    //Draw part centroid
    adj_mass = this.data.mass - this.data.fuel_mass*(1-this.get_fuel());
    this.dc.arc(
        this.data.centroid[0],this.data.centroid[1],
        0.25*adj_mass,0,Math.PI*2,false
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
