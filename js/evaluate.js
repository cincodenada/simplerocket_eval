$(document).ready(function() {
    //Set up canvas
    var scale = 10;
    var scalestep = 0.25;

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

    ctx.gt().translate(ctx.canvas.width/2,ctx.canvas.height/2);
    ctx.gt().scale(scale,-scale);
    ctx.lineWidth = 0.1;


    rocket = new Rocket({
        'parts':rocketdata,
        'stages':stagedata,
        'sprites':spritedata,
        'spriteurl': '/img/sprites/ShipSprites.png'
    }, ctx);
    rocket.sprite.onload = function() {
        rocket.render();
    };

    slidermax = 10000;
    $('#fuelslider').slider({
        min: 0,
        max: slidermax,
        value: slidermax,
        slide: function(evt, ui) {
            rocket.set_fuel(ui.value/slidermax);
            render();
        }
    });

    $(canvelm).on('click',function(evt) {
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
        render();
    }

    function render() {
        ctx.gt().save();
        ctx.gt().setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
        ctx.gt().restore();

        rocket.render();
    }

    function getCanvasPoint(mouseevt) {
        var x = mouseevt.pageX - ctx.canvas.offsetLeft;
        var y = mouseevt.pageY - ctx.canvas.offsetTop;

        return ctx.gt().detransformPoint(x, y);
    }
});

