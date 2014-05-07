%import json
<html>
<head>
<meta property="og:image" content="/img/thumbnail.png"/>
<script type="text/javascript">
var rocketdata = {{!json.dumps(rocket_data)}};
var stagedata = {{!json.dumps(stage_data)}};
var spritedata = {{!json.dumps(sprite_data)}};
</script>
<script type="text/javascript" src="//code.jquery.com/jquery-1.11.0.min.js"></script>
<script type="text/javascript" src="//code.jquery.com/ui/1.10.4/jquery-ui.min.js"></script>
<link rel="stylesheet" href="//code.jquery.com/ui/1.10.4/themes/dark-hive/jquery-ui.css"/>
<script type="text/javascript" src="/js/rocket.js"></script>
<script type="text/javascript" src="/js/jquery.event.drag-2.2.js"></script>
<script type="text/javascript" src="/js/jquery.mousewheel.min.js"></script>
<script type="text/javascript" src="/js/transform-tracker.js"></script>
<style>
#rocketview {
    height: 90%;
    width: 100%;
}
body {
    background: #111 url('/img/stars_tile.jpg');
    color: white;
    font-family: sans-serif;
    overflow: hidden;
}
header {
    font-weight: bold;
    line-height: 1.5em;
    text-shadow: 1px 1px #333; 
    padding: 0px 10px;
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
    overflow: hidden;
}
#tips ul {
    margin-bottom: 0px;
}
#tips li {
    margin: 5px 0px;
}
#tips.closed {
    height: 10px;
}
#tips #moretips {
    margin-top: 0px;
    display: none;
}
#tips.more #moretips {
    display: block;
}
#tips #viewmore {
    display: block;
    text-align: right;
}
#tips.more #viewmore {
    display: none;
}
#tips .attrib {
    margin-top: 10px;
}
#zoom {
    position: absolute;
    bottom: 0px;
    left: 0px;
    text-align: center;
    width: 100%;
}
#zoom button {
    font-size: 150%;
    font-weight: bold;
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
<select id="stage" name="stage" disabled>
<option value="1">Stage 1</option>
</select>
<label>
<input type="checkbox" id="evaluate" checked="checked"/>
Show detailed analysis
</label>
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
<div id="zoom">
<button value="+">+</button>
<button value="reset">Reset</button>
<button value="-">–</button>
</div>
<div id="tips">
<a href="#" class="closebtn"></a>
<h2>Tips:</h2>
<ul>
    <li>Paste a ship URL in the "Load Rocket" box (or play around with the demo ship)</li>
    <li>Red dots are centers of mass of individual parts, yellow X is center of mass of the whole ship</li>
    <li>Click on a part to select it.  You can then use the fuel level slider to adjust that tank's fuel.</li>
    <li>To adjust all fuel tanks at once, click on the command pod.  The slider will then adjust all tanks.</li>
</ul>
<ul id="moretips">
    <li>Hold the <b>shift</b> key to select multiple parts</li>
    <li>For minor adjustments, use the arrow keys to move selected parts around one editor grid unit at a time</li>
    <li>You can zoom with the buttons, scroll wheel, or double-clicking</li>
    <li>Use the dropdown menu on the upper left to select just a specific stage for evaluation</li>
</ul>
<a href="#" id="viewmore">View more >></a>
<div class="attrib">
Built by <a href="http://portfolio.cincodenada.com/">Joel Bradshaw</a> aka <a href="http://www.reddit.com/user/cincodenada">cincodenada</a><br/>
Graphics from Andrew Garrison, with permission
</div>
</div>
<a href="https://github.com/cincodenada/simplerocket_eval"><img style="position: absolute; bottom: -50; left: -50; border: 0;" src="https://camo.githubusercontent.com/52760788cde945287fbb584134c4cbc2bc36f904/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f77686974655f6666666666662e706e67" alt="Fork me on GitHub" data-canonical-src="https://s3.amazonaws.com/github/ribbons/forkme_right_white_ffffff.png"></a>
<script type="text/javascript" src="/js/evaluate.js"></script>
<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-XXXXXX-XX', 'example.com');
  ga('send', 'pageview');

</script>
</body>
</html>
