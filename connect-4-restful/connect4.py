from flask import Flask, request, session, render_template, abort, redirect, url_for, jsonify
from flask_restful import Api
from sqlalchemy import or_
from models import db, Player, Game
from resources import GameListResource, GameResource
from requests.auth import HTTPBasicAuth
import datetime, os, requests

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(
    app.root_path, "connect4.db"
)
# Suppress deprecation warning
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

api = Api(app, prefix="/api")
db.init_app(app)

# key for session data
app.secret_key = "Absolutely terrible secret key"

# add specified resources as endpoints
api.add_resource(GameListResource, "/games/")
api.add_resource(GameResource, "/games/")

@app.route("/")
def home():
    if "username" in session:
        player = db.session.query(Player).filter_by(username=session["username"]).first()
        if player:
            print(session["username"])
            session["id"] = player.id
            games = player.games()
            return render_template("landing.html", auth=True, player_id=player.id)
    else:
        return render_template("landing.html", auth=False)

@app.route("/game/<game_id>/")
def game(game_id=None):
    print("in game front end")
    if "username" in session:
        if game_id:
            game = db.session.query(Game).get(game_id)
            return render_template("game.html", game=game)

    return render_template("landing.html", auth=False)



@app.route("/login/", methods=["GET", "POST"])
def login():
    print("in login")

    # if player logged in
    if "username" in session:
        return redirect(url_for("home"))

    # if player NOT logged in
    elif request.method == "POST":
        username=request.form["user"]
        password=request.form["pass"]
        action = request.form["submit_button"]

        # if attempting to login to existing account
        if action == "Login":
            player = Player.query.filter_by(username=username).first()
            if player and player.password == password:
                session["username"] = username
                session["id"] = player.id
                return redirect(url_for("home"))

        # if attempting to create a player account
        elif action == "New Player":
            print("Wants to create a new player")
            return render_template("login.html", username=username, password=password, create=True)
        
        # if submitting a new player info for creation
        elif action == "Create Player":
            print("Submit Creation")
            username=request.form["user"]
            password=request.form["pass"]
            birthday=request.form["bday"]
            created = create_player(username, password, birthday)
            if created:
                print("created")
                session["username"] = username
                session["id"] = created.id
                print(created.username)
                return redirect(url_for("home"))
            else:
                print("Not Created")
                return render_template("login.html")

    print("welp... w're here")
    # Redirect to login page
    return render_template("login.html")

@app.route("/logout/")
def logout():
	# if logged in, log out, otherwise offer to log in
	if "username" in session:
		# note, here were calling the .clear() method for the python dictionary builtin
		session.clear()
		return render_template("logoutPage.html")
	else:
		return redirect(url_for("login"))

#  Helper Methods
def create_player(un, pw, bd):
    try:
        player = Player(username=un, password=pw, birthday=datetime.datetime.strptime('05/14/1984', '%m/%d/%Y').date())
        db.session.add(player)
        db.session.commit()
        return player
    except:
        print("Error: Failure to create row in table 'Player'")
        return None





# CLI Commands
@app.cli.command("initdb")
def init_db():
    """Initializes database and any model objects necessary for assignment"""
    db.drop_all()
    db.create_all()

    print("Initialized Connect 4 Database.")


@app.cli.command("devinit")
def init_dev_data():
    """Initializes database with data for development and testing"""
    db.drop_all()
    db.create_all()
    print("Initialized Connect 4 Database.")

    g = Game()
    g1 = Game()
    g2 = Game()
    db.session.add(g)
    db.session.add(g1)
    db.session.add(g2)

    p1 = Player(username="tow", password="passtow", birthday=datetime.datetime.strptime('11/06/1991', '%m/%d/%Y').date())
    p2 = Player(username="twaits", password="passtwaits", birthday=datetime.datetime.strptime('01/14/1987', '%m/%d/%Y').date())
    p3 = Player(username="Josh", password="passJosh", birthday=datetime.datetime.strptime('01/11/1984', '%m/%d/%Y').date())
    p4 = Player(username="Leah", password="passLeah", birthday=datetime.datetime.strptime('05/14/1984', '%m/%d/%Y').date())

    db.session.add(p1)
    print("Created %s" % p1.username)
    db.session.add(p2)
    print("Created %s" % p2.username)
    db.session.add(p3)
    print("Created %s" % p3.username)
    db.session.add(p4)
    print("Created %s" % p4.username)

    g2.player_one = p1
    g2.player_two = p2
    g2.game_title()

    g1.player_one = p3
    g1.player_two = p1
    g1.game_title()

    g.player_one = p1
    g.player_two = p2
    g.game_title()

    db.session.commit()
    print("Added dummy data.")


if __name__ == "__main__":
    app.run(host='0.0.0.0', threaded=True)
    init_db()
    init_dev_data()


