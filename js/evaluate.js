$(document).ready(function() {
    //Set up canvas
    var scale = 10;
    var scalestep = 0.25;
    var deltasV = null;    //Cached

    CanvasRenderingContext2D.prototype.drawX = function(x,y,hairsize) {
        this.beginPath()
        this.moveTo(x-hairsize,y-hairsize);
        this.lineTo(x+hairsize,y+hairsize);
        this.moveTo(x-hairsize,y+hairsize);
        this.lineTo(x+hairsize,y-hairsize);
        this.stroke();
    }

    CanvasRenderingContext2D.prototype.gt = function() {
        if(!this.useful_transformations) {
            this.useful_transformations = new Transform(this);
        }
        return this.useful_transformations;
    }

    var canvelm = document.getElementById('rocketview');
    var ctx = canvelm.getContext("2d");
    ctx.canvas.width = canvelm.clientWidth;
    ctx.canvas.height = canvelm.clientHeight;

    //Prevent the browser resizing the canvas...
    ctx.canvas.style.width = ctx.canvas.width;
    ctx.canvas.style.height = ctx.canvas.height;

    rocket = new Rocket({
        'parts':rocketdata,
        'stages':stagedata,
        'sprites':spritedata,
        'spriteurl': 'http://proj.this.com/RocketCenter' + '/mods/' + spritemod + '/ShipSprites.png'
    }, ctx);
    rocket.sprite.onload = function() {
        resetview();
        render();
    };

    if(error_info.error) {
        $('#errorbox .message').html(
            '<h2>Error loading rocket!</h2>' +
            '<p>We had trouble either parsing your rocket, ' +
            'or getting it from the server in the first place. ' +
            'The link may have expired, or the servers may be ' +
            'having issues.</p>' +
            '<p>Perhaps try again later, or if the ship loads fine ' +
            'in SimpleRockets, <a href="http://www.reddit.com/message/compose/?to=cincodenada">send me a message</a> ' +
            'with your rocket ID or URL and I\'ll take a look.</p>'
        ).append(
            '<p>Error type: ' + error_info.type + '<br/>' + error_info.error + '</p>'
        ).parent().show();
        console.log(error_info.traceback.join(''))
    }

    slidermax = 10000;
    $('#fuelslider').slider({
        min: 0,
        max: slidermax,
        value: slidermax,
        slide: function(evt, ui) {
            $('#evaluate').prop('checked',true);
            rocket.set_fuel(ui.value/slidermax);
            render();
        }
    });

    $(canvelm).on('click',function(evt) {
        //De-focus the inputs
        $('input, select, .ui-slider-handle').blur();

        relpoint = getCanvasPoint(evt);
        idx = rocket.getClosestPart(relpoint, 10);
        if(evt.shiftKey) {
            rocket.toggle_selected(idx);
        } else {
            rocket.set_selected(idx);
        }
        
        render();

        $('#fuelslider')
            .slider('value',rocket.get_fuel(idx)*slidermax)
            .data('cur_engine',idx);
    });

    $(canvelm).on('dblclick',function(evt) {
        relpoint = getCanvasPoint(evt);
        zoom(scalestep, evt);
    });

    $(canvelm).on('drag',function(evt, dragdrop) {
        ctx.gt().translate(
            (dragdrop.deltaX - dragdrop.lastX)/scale,
            -(dragdrop.deltaY - dragdrop.lastY)/scale
        );
        dragdrop.lastX = dragdrop.deltaX;
        dragdrop.lastY = dragdrop.deltaY;
        render();
    });

    $(canvelm).on('mousewheel',function(evt) {
        zoom(scalestep*evt.deltaY, evt);
        evt.preventDefault();
    });

    $('body').on('keyup', function(evt) {
        var directions = {
            37: {'move': [-1,0]},
            38: {'move': [0,1]},
            39: {'move': [1,0]},
            40: {'move': [0,-1]},
            46: {'delete': true},
        }
        var moveamt = 0.25;
        for(keycode in directions) {
            if(evt.which == keycode) {
                evt.preventDefault();
                evt.stopPropagation();

                for(action in directions[keycode]) {
                    val = directions[keycode][action];
                    switch(action) {
                    case 'move':
                        rocket.move_parts(
                            val[0]*moveamt,
                            val[1]*moveamt
                        );
                        break;
                    case 'delete':
                        if(evt.shiftKey) {
                            rocket.undelete_parts();
                        } else {
                            rocket.delete_parts();
                        }
                        break;
                    }
                }
                render();
                break;
            }
        }
    });

    $('#load_button').click(function() {
        var endnums = /\d+$/;
        var shipurl = $('#load_rocket').val()
        var rocket_id = endnums.exec(shipurl);
        window.location.href = '/evaluate/' + rocket_id[0];
    });

    $('.closebtn').on('click',function(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        $(this).parent().toggleClass('closed');
    })

    $('#viewmore').on('click',function(evt) {
        $('#tips').addClass('more');
    });

    $('#zoom').on('click','button',function() {
        switch(this.value) {
            case '+':
                curscale = scalestep;
                break;
            case '-':
                curscale = -scalestep;
                break;
            case 'reset':
                curscale = 0;
                resetview();
                break;
        }
        zoom(curscale);
    });

    $('#stage').empty();
    for(i=0;i<stagedata.parts.length;i++) {
        $('#stage').append('<option value="' + i + '">Stage ' + (i+1) + '</option>');
    }
    $('#stage')
        .prop('disabled',false)
        .on('change',function() {
            rocket.set_stage($(this).val());
            render();
        });

    $('#evaluate').on('change',function() {
        rocket.show_annotations = $(this).prop('checked');
        render();
    });

    function zoom(relpct, mouseevt) {
        if(mouseevt) { prevpoint = getCanvasPoint(mouseevt); }
        ctx.gt().scale(1+relpct,1+relpct);
        if(mouseevt) {
            newpoint = getCanvasPoint(mouseevt);
            ctx.gt().translate((newpoint.x - prevpoint.x),(newpoint.y - prevpoint.y));
        }
        scale += scale*relpct;
        render();
    }

    function resetview() {
        scale = 10;
        ctx.gt().setTransform(1,0,0,1,0,0);
        ctx.gt().translate(ctx.canvas.width/2,ctx.canvas.height/2);
        ctx.gt().scale(scale,-scale);

        var bb = rocket.get_bb();

        //Zoom to rocket
        var viewsize = ctx.gt().detransformPoint(ctx.canvas.width,ctx.canvas.height);
        var zoomx = Math.abs(viewsize.x/(bb[1][0]-bb[0][0]));
        var zoomy = Math.abs(viewsize.y/(bb[1][1]-bb[0][1]));
        //Not sure why I'm off by a factor of two, but eh
        var zoom = (Math.min(zoomx, zoomy)*2)/1.2;
        ctx.gt().scale(zoom, zoom);
        scale *= zoom;

        //Center rocket
        offsetx = ((bb[1][0]+bb[0][0])/2);
        offsety = ((bb[1][1]+bb[0][1])/2);
        ctx.gt().translate(-offsetx, -offsety);

        render();
    }

    function render() {
        ctx.gt().save();
        ctx.gt().setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
        ctx.gt().restore();

        rocket.render();
        update_deltaV();
    }

    function update_deltaV() {
        var lastV = deltasV;
        deltasV = rocket.deltaV();
        var is_same = true;
        if(lastV == null) {
            is_same = false;
        } else {
            for(var s=0; s<deltasV.length;s++) { 
                if(lastV[s] != deltasV[s]) { is_same = false; } 
            }
        }

        if(!is_same || lastV == null) {
            $stats = $('#stats');
            $stats.empty();
            $stats.append('<h3>Δv (beta!):</h3>');
            totalDv = 0;
            for(var s=0; s<deltasV.length;s++) {
                $stats.append('Stage ' + (s+1) + ': ' + dv_text(deltasV[s]) + '<br/>');
                totalDv += deltasV[s];
            }
            $stats.append('Total: ' + dv_text(totalDv) + '<br/>');
            $stats.append('<br/>Ship mass: ' + Math.round(rocket.get_mass()*500) + ' kg');
        }
    }

    function dv_text(val, suffix) {
        return Math.round(val*100)/100 + ' m/s'
    }

    function getCanvasPoint(mouseevt) {
        var canvaspos = $(ctx.canvas).offset();
        var x = mouseevt.pageX - canvaspos.left;
        var y = mouseevt.pageY - canvaspos.top;

        return ctx.gt().detransformPoint(x, y);
    }
});

