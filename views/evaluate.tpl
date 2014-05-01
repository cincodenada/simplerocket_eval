%import json
<html>
<head>
<script type="text/javascript">
var rocketdata = {{!json.dumps(rocket_data)}};
</script>
<script type="text/javascript" src="//code.jquery.com/jquery-1.11.0.min.js"></script>
<style>
#rocketview {
height: 90%;
}
</style>
</head>
<body>
Rocket {{rocket_id}}:
<canvas id="rocketview" width="100" height="50">
</canvas>
<script type="text/javascript">
var canvelm = document.getElementById('rocketview');
var ctx = canvelm.getContext("2d");
var scale = 10;
ctx.canvas.width = canvelm.clientWidth;
ctx.canvas.height = canvelm.clientHeight;
ctx.translate(ctx.canvas.width/2,ctx.canvas.height/2);
for (var x = 0.5; x < ctx.canvas.width; x += 10) {
  ctx.moveTo(x, 0);
  ctx.lineTo(x, ctx.canvas.height);
} 
for (var y = 0.5; y < ctx.canvas.width; y += 10) {
  ctx.moveTo(0, y);
  ctx.lineTo(ctx.canvas.width, y);
}
ctx.stroke();
ctx.scale(scale,-scale);
ctx.lineWidth = 0.1;
$.each(rocketdata, function(idx, part) {
    ctx.fillStyle = "white";
    ctx.beginPath()
    ctx.moveTo(
        part.x*2 + part.shape[0][0],
        part.y*2 + part.shape[0][1]
    );
    for(i=1;i<part.shape.length;i++) {
        ctx.lineTo(
            part.x*2 + part.shape[i][0],
            part.y*2 + part.shape[i][1]
        );
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "red";
    ctx.beginPath()
    ctx.arc(
        part.x*2+part.centroid[0],
        part.y*2+part.centroid[1],
        0.25,0,Math.PI*2,false
    );
    ctx.fill();
});
</script>
</body>
</html>
