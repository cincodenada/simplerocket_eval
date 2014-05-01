%import json
<html>
<head>
<script type="text/javascript">
var rocketdata = {{!json.dumps(rocket_data)}};
</script>
<style>
#rocketview {
}
</style>
</head>
<body>
Rocket {{rocket_id}}:
<div id="rocketview">
</div>
<script type="text/javascript">
</script>
</body>
</html>
