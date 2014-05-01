from bottle import route, run, template

@route('/evaluate/<rocket_id>')
def evaluate(rocket_id):
    return template('Evaluating rocket id {{rocket_id}}...', rocket_id=rocket_id)

run(host='localhost',port=54321)
