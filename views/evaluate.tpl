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
    font-family: sans-serif;
}
header {
    font-weight: bold;
    line-height: 1.5em;
    text-shadow: 1px 1px #333; 
}
input { opacity: 0.5; }
button { opacity: 0.75; }
a { text-decoration: none; }
h2 { margin-top: 0px; }
#tips {
    position: absolute;
    bottom: 0px;
    right: 0px;
    background: rgba(255,255,255,0.75);
    border: 2px solid darkgray;
    padding: 10px;
    color: #333;
    max-width: 350px;
}
#tips li {
    margin: 5px 0px;
}
#tips.closed {
    height: 10px;
}
.closebtn {
    border-top: 10px solid black;
    border-right: 10px solid transparent;
    border-left: 10px solid transparent;
    display: inline-block;
    float: right;
}
.closed .closebtn {
    border-top: none;
    border-bottom: 10px solid black;
}
</style>
</head>
<body>
<header>
Load rocket: <input type="text" id="load_rocket"/><button id="load_button">Load</button>
<span style="float: right">
Showing
%if rocket_id:
rocket {{rocket_id}}:
%else:
demo rocket
%end
</span>
<br/>
Fuel level:
<div id="fuelslider"></div>
</header>
<canvas id="rocketview" width="100" height="50">
</canvas>
<div id="tips">
<a href="#" class="closebtn"></a>
<h2>Tips:</h2>
<ul>
    <li>Paste a ship URL in the "Load Rocket" box (or play around with the demo ship)</li>
    <li>Red dots are centers of weight of individual parts, green X is center of weight of the whole ship</li>
    <li>Click on a part to select it.  You can then use the fuel level slider to adjust that tank's fuel.</li>
    <li>To adjust all fuel tanks at once, click on the command pod.  The slider will then adjust all tanks.</li>
</ul>
Built by <a href="http://portfolio.cincodenada.com/">Joel Bradshaw</a> aka <a href="http://www.reddit.com/user/cincodenada">cincodenada</a>
</div>
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
});
</script>
</body>
</html>
