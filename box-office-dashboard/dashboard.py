from flask import Flask, render_template, jsonify
from flask_basicauth import BasicAuth, Response, request, wraps
from flask_restful import Api, Resource
import csv, bcrypt, os

movies = []

app = Flask(__name__)
app.secret_key = "Thanks for the semester!"
api = Api(app, prefix="/api")

auth_user = []

basic_auth = BasicAuth(app)

## Auth Decorator and Helpers

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth:
            return authenticate()
        if not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated

def check_auth(username, password):
    print(auth_user)
    users = [u for u in auth_user if u["name"] == str(username)]
    print(users)
    if users:
        creds = [u for u in users if check_password(password, u["password"])]
        if creds:
            return True
    return False

def authenticate():
    return Response('Could not verify your access level for that URL.\n'
    'You have to login with proper credentials', 401,
    {'WWW-Authenticate': 'Basic realm="Login Required"'})

def hash_password(plain_text_pw):
    return bcrypt.hashpw(plain_text_pw.encode('utf-8'), bcrypt.gensalt())

def check_password(plain_text, hashed):
    return bcrypt.checkpw(plain_text.encode('utf-8'), hashed)


## initialize auth_user
auth_user.append({    
    "name": "admin",
    "password": hash_password("plaintextboo") 
})


## Flask Routes

@app.route("/")
@requires_auth
def landing():
    return render_template("base.html")


## Flask-RESTful Resources and Routes

# Create Movie Collection Resource
class MovieListResource(Resource):
    def get(self):
        return jsonify(movies)


# Create Movie Item Resource
class MovieResource(Resource):
    def get(self, movie_id=None):
        movie = [m for m in movies if m["id"] == movie_id][0]
        return jsonify(movie)


api.add_resource(MovieListResource, "/movies/", endpoint="movies")
api.add_resource(MovieResource, "/movies/<int:movie_id>", endpoint="movie")

## Populate Movie List from CSV
with open("./data/bo.csv", "r") as bo:
    read_bo = csv.DictReader(bo, delimiter=",")
    for m in read_bo:
        try:
            ot = int(m["Opening Theaters"].replace(",", ""))
        except:
            ot = None
        try:
            tt = int(m["Theaters"].replace(",", ""))
        except:
            tt = None
        try:
            tg = float(m["Total Gross"].strip().replace("$", "").replace(",", ""))
        except:
            tg = None
        try:
            og = float(m["Opening"].strip().replace("$", "").replace(",", ""))
        except:
            og = None
        movies.append(
            {
                "id": int(m["ID"]),
                "title": m["Movie Title"],
                "studio": m["Studio"],
                "total_gross": tg,
                "total_theaters": tt,
                "opening_gross": og,
                "opening_theaters": ot,
            }
        )

if __name__ == "__main__":
    app.run()
