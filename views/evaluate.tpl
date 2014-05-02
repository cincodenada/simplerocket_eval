%import json
<html>
<head>
<script type="text/javascript">
var rocketdata = {{!json.dumps(rocket_data)}};
</script>
<script type="text/javascript" src="//code.jquery.com/jquery-1.11.0.min.js"></script>
<script type="text/javascript" src="//code.jquery.com/ui/1.10.4/jquery-ui.min.js"></script>
<link rel="stylesheet" href="//code.jquery.com/ui/1.10.4/themes/dark-hive/jquery-ui.css"/>
<script type="text/javascript" src="/js/rocket.js"></script>
<style>
#rocketview {
    height: 90%;
}
body {
    background: #111 url('/img/stars_tile.jpg');
    color: white;
}
</style>
</head>
<body>
Rocket {{rocket_id}}:<br/>
<div id="fuelslider"></div>
<canvas id="rocketview" width="100" height="50">
</canvas>
<script type="text/javascript">
$(document).ready(function() {
    //Set up canvas
    var canvelm = document.getElementById('rocketview');
    var ctx = canvelm.getContext("2d");
    var scale = 10;
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
        ctx.fillStyle = "white";
        rocket.draw();
        ctx.fillStyle = "goldenrod";
        ctx.lineWidth = 0.2;
        rocket.draw_part(idx);
        rocket.draw_centroid();

        $('#fuelslider')
            .slider('value',rocket.get_fuel(idx)*slidermax)
            .data('cur_engine',idx);
    });
});
</script>
</body>
</html>
