$(document).ready(function() {
    //Set up canvas
    var canvelm = document.getElementById('rocketview');
    var ctx = canvelm.getContext("2d");
    var scale = 10;
    var scalestep = 0.25;
    ctx.canvas.width = canvelm.clientWidth;
    ctx.canvas.height = canvelm.clientHeight;
    ctx.translate(ctx.canvas.width/2,ctx.canvas.height/2);
    ctx.scale(scale,-scale);
    ctx.lineWidth = 0.1;

    CanvasRenderingContext2D.prototype.drawX = function(x,y,hairsize) {
        this.beginPath()
        this.moveTo(x-hairsize,y-hairsize);
        this.lineTo(x+hairsize,y+hairsize);
        this.moveTo(x-hairsize,y+hairsize);
        this.lineTo(x+hairsize,y-hairsize);
        this.stroke();
    }

    rocket = new Rocket(rocketdata, ctx);
    rocket.draw();
    rocket.draw_centroid();

    slidermax = 10000;
    $('#fuelslider').slider({
        min: 0,
        max: slidermax,
        value: slidermax,
        slide: function(evt, ui) {
            curidx = $(this).data('cur_engine');
            if(curidx == undefined) { curidx = 0; }
            rocket.set_fuel(curidx, ui.value/slidermax);
            rocket.draw();
            ctx.fillStyle = "goldenrod";
            ctx.lineWidth = 0.2;
            rocket.draw_part(curidx);
            rocket.draw_centroid();
        }
    });

    $(canvelm).on('click',function(evt) {
        idx = rocket.getClosestPart(evt);
        
        ctx.strokeStyle = "black";
        ctx.lineWidth = 0.1;
        ctx.fillStyle = "silver";
        rocket.draw();
        ctx.fillStyle = "goldenrod";
        ctx.lineWidth = 0.2;
        rocket.draw_part(idx);
        rocket.draw_centroid();

        $('#fuelslider')
            .slider('value',rocket.get_fuel(idx)*slidermax)
            .data('cur_engine',idx);
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
                curscale = (1 + scalestep);
                break;
            case '-':
                curscale = (1 - scalestep);
                break;
        }
        ctx.save();
        ctx.setTransform(1,0,0,1,0,0)
        ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
        ctx.restore();
        ctx.scale(curscale,curscale);
        rocket.draw();
        rocket.draw_centroid();
    });
});
