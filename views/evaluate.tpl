%import json
<html>
<head>
<script type="text/javascript">
var rocketdata = {{!json.dumps(rocket_data)}};
</script>
<script type="text/javascript" src="//code.jquery.com/jquery-1.11.0.min.js"></script>
<script type="text/javascript" src="/js/rocket.js"></script>
<style>
#rocketview {
height: 90%;
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

    $(canvelm).on('click',function(evt) {
        part = rocket.getClosestPart(evt);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 0.1;
        ctx.fillStyle = "white";
        rocket.draw();
        ctx.fillStyle = "green";
        ctx.lineWidth = 0.2;
        rocket.draw_part(part);
    });
});
</script>
</body>
</html>
