from flask import Flask, request, abort, url_for, flash, redirect, session, render_template
from flask_sqlalchemy import SQLAlchemy
import datetime, ast

### init

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///salon.db'
db = SQLAlchemy(app)

# hardcoded model

class Owner(db.Model):
	__tablename__='Owner'
	id = db.Column(db.Integer, primary_key=True)
	username = db.Column(db.String(50), unique=True)
	password = db.Column(db.String(50))
	role = db.Column(db.String(50))

	def __init__(self, username, password, role):
		self.username = username
		self.password = password
		self.role = role

	def __repr__(self):
		return '<Owner %r>' % self.username

### models

class User(db.Model):
	__tablename__ = 'User'
	id = db.Column(db.Integer, primary_key=True)
	username = db.Column(db.String(50), unique=True)
	password = db.Column(db.String(50))
	role = db.Column(db.String(10))

	def __init__(self, username, password, role):
		self.username = username
		self.password = password
		self.role = role

	def __repr__(self):
		return '<Name %r>' % self.username

class Appointment(db.Model):
	__tablename__ = 'Appointment'
	id = db.Column(db.Integer, primary_key=True)
	stylist_id = db.Column(db.Integer, db.ForeignKey('User.id'), nullable=False)
	patron_id = db.Column(db.Integer, db.ForeignKey('User.id'), nullable=False)
	date = db.Column(db.DateTime(), default=None)
	stylist = db.relationship('User', backref='sylist_appointments', foreign_keys=[stylist_id])
	patron = db.relationship('User', backref='patron_appointments', foreign_keys=[patron_id])

	def __init__(self, stylist_id, patron_id, date, stylist, patron):
		self.stylist_id = stylist_id
		self.patron_id = patron_id
		self.date = date
		self.stylist = stylist
		self.patron = patron
	
	def __repr__(self):
		return '<Stylist: %r Date %r>' % (self.stylist_id, self.date)

### controllers
def displayResult(num, res):
	print("\nQ{}:\n".format(num), res, "\n\n")
		
@app.route("/")
def default():
	return redirect(url_for("login"))

@app.route("/login/", methods=["GET", "POST"])
def login():
	# first check if the user is already logged in

	if "username" in session:
		return redirect(url_for("profile", username=session["username"]))

	# if not, and the incoming request is via POST try to log them in
	elif request.method == "POST":

		print('Recieved POST method request')
		# create list of existing usernames
		username=request.form["user"]
		password=request.form["pass"]
		user = User.query.filter_by(username=username).first()
		if (request.form["submit_button"] == "Login"):
			if user:
				if password == user.password:
					session["username"] = username
					return redirect(url_for("profile", username=username))
				else:
					flash("Incorrect password")
			elif username == "owner" and password == "pass":
				print("Owner log in")
				session["username"] = username
				return redirect(url_for("profile", username=username))
			else:
				print('User does not exist')
				flash('User does not exist')

		elif (request.form["submit_button"] == "Register New Patron"):
			if not user:
				if password:
					print('register')
					create_user(username, password, 'patron')
					return render_template("confirmReg.html", name=username)
				else:
					flash("Password required for registration.")
			else:
				flash("User already exists.")

	return render_template("loginPage.html")

@app.route("/profile/")
@app.route("/profile/<username>")
def profile(username=None):

	if not username:
		# if no profile specified, either:
		#	* direct logged in users to their profile
		#	* direct unlogged in users to the login page
		if "username" in session:
			ptrn = User.query.filter_by(role="patron")
			styl = User.query.filter_by(role="stylist")

			# check if logged in user is owner
			if session["username"] == "owner":
				ownr = Owner.query.filter_by(username="owner").first()
				booked = get_all_stylist_appointments()
				return render_template("ownerProfile.html", username=session["username"], user=ownr, appts=booked, styls=styl, ptrns=ptrn)

			usr = User.query.filter_by(username=session["username"]).first()
			apts = Appointment.query.filter_by(stylist_id=usr.id, patron_id=usr.id)
			apts.sort(key=lambda x: x["date"], reverse=False)
			if usr.role == "stylist":
				print("In profile")
				return render_template("stylistProfile.html", username=session["username"], user=usr, appts=apts)
			elif usr.role == "patron":
				print("In profile")
				return render_template("patronProfile.html", username=session["username"], user=usr, appts=apts)

		else:
			print("No user logged in.")
			return redirect(url_for("login"))

	elif username:
		# if profile specified, either:
		#   - if specified profile logged in
		#		* direct logged in users to their profile
		#   - if specified profile NOT logged in
		#		* direct unlogged in users to the login page
		if "username" in session:
			ptrn = User.query.filter_by(role="patron")
			styl = User.query.filter_by(role="stylist")

			# Check if logged in user is owner
			if username == "owner":
				if session["username"] == username:
					ownr = Owner.query.filter_by(username="owner").first()
					booked = get_all_stylist_appointments()
					return render_template("ownerProfile.html", username=session["username"], user=ownr, appts=booked, styls=styl)
				else:
					# unauthorized access
					abort(403)

			usr = User.query.filter_by(username=username).first()
			if usr.role == "stylist":
				apts = Appointment.query.filter_by(stylist_id=usr.id)
				cal = get_stylist_calendar(usr.id)
				return render_template("stylistProfile.html", username=session["username"], calendar=cal, user=usr, appts=apts, styls=styl)
			elif usr.role == "patron":
				apts = get_patron_appointments(usr.id)
				apts.sort(key=lambda x: x["date"], reverse=False)
				return render_template("patronProfile.html", username=session["username"], user=usr, appts=apts, styls=styl)
		else:
			print("Cannot find profile")

	# cant find profile
	abort(404)

@app.route("/register/", methods=["GET", "POST"])
def register():
	if "username" in session and session["username"] == "owner":
		
		if request.method == "POST":
			username=request.form["user"]
			password=request.form["pass"]
			if password == "":
				flash("Please enter a password.")
				print("pleae enter password")
				return redirect(url_for("register"))
			else:
				create_user(username, password, "stylist")
				usr = Owner.query.filter_by(username="owner").first()
				apts = Appointment.query.all()
			return redirect(url_for("profile", username="owner"))
		else:
			return render_template("stylistRegistration.html")

@app.route("/book/", methods=["GET", "POST"])
@app.route("/book/<args>")
def book(args=None):
	print("in book route")
	print(request.method)

	if request.method == "POST":
		print("POST METHOD RECIEVD")
		args = { "patron":request.form["patron"],
				"stylist":request.form["stylist"],
				"year":request.form["year"],
				"month":request.form["month"],
				"day":request.form["day"],
				"time":request.form["time"],
				}
		for value in args:
			if args[value] == "":
				print("balnk value")
				flash("Please complete all fields before booking.")
				return render_template("appointmentForm.html", apt_args=None)

		hours = [10,11,12,13,14,15,16,17,18,19]
		if int(args["time"]) not in hours:
			print("invalid hour")
			flash("Appointments may only be scheduled on the hour between 10:00 and 20:00.")
			return render_template("appointmentForm.html", apt_args=None)

		if create_appointment(args) != ValueError:
			return redirect(url_for("profile", username=args["patron"]))
		else:
			return render_template("appointmentForm.html", apt_args=None)
		
	elif not args:
		if "username" in session:
			return render_template("appointmentForm.html", apt_args=None)

	else:
		unpack = ast.literal_eval(args)
		print(unpack["year"])
		return render_template("appointmentForm.html", apt_args=unpack)

	abort(404)

@app.route("/cancel/<args>")
def cancel(args=None):
	if not args:
		print("No Args")
		return redirect(url_for("profile", username=session["username"]))
	else:
		print(args)
		unpack = ast.literal_eval(args)
		#print(unpack.year)
		flash(str(unpack["month"])+"/"+str(unpack["day"])+"/"+str(unpack["year"]) + " at "+ str(unpack["time"]) +":00 with " + unpack["stylist"])
		cancel_appointment(unpack)
		return redirect(url_for("profile", username=session["username"]))

@app.route("/logout/")
def logout():
	# if logged in, log out, otherwise offer to log in
	if "username" in session:
		# note, here were calling the .clear() method for the python dictionary builtin
		session.clear()
		return render_template("logoutPage.html")
	else:
		return redirect(url_for("login"))


# Helper Methods

def create_appointment(args):
	p = User.query.filter_by(username=args["patron"]).first()
	s = User.query.filter_by(username=args["stylist"]).first()
	try:
		date = datetime.datetime(int(args["year"]), int(args["month"]), int(args["day"]), int(args["time"]))
		apt = Appointment(s.id, p.id, date, s, p)
		db.session.add(apt)
		return db.session.commit()
	except ValueError:
		flash("Invalid date field")
		print("Invalid datetime parameter")
		return ValueError
	   


def cancel_appointment(args):
	dt = datetime.datetime(args["year"], args["month"], args["day"], args["time"])
	sid = User.query.filter_by(username=args["stylist"]).first().id
	apt = Appointment.query.filter_by(date=dt, stylist_id=sid).first()
	db.session.delete(apt)
	return db.session.commit()

# Returns a dictionary of appointments for every stylist
# 	- Each dictionary entry has key == stylist.username
#   - Each dictionaryentry containsand array of appt info dictionary entries 
def get_all_stylist_appointments():
	stylists = User.query.filter_by(role = "stylist")
	booked = {}
	
	for s in stylists:
		appts = Appointment.query.filter_by(stylist_id=s.id)
		if appts.count() > 0:
			booked[s.username] = []
			for a in appts:
				patron = User.query.get(a.patron_id)
				booked[s.username].append({"date": a.date, "patron":patron.username})
		
	return booked

# Returns a disctionary of appointments for every patron
# 	- Each dictionary entry has key == patron.username
#   - Each dictionaryentry containsand array of appt info dictionary entries 
def get_all_patron_appointments():
	patrons = User.query.filter_by(role = "patron")
	booked = {}
	
	for p in patrons:
		appts = Appointment.query.filter_by(patron_id=p.id)
		if appts.count() > 0:
			booked[p.username] = []
			for a in appts:
				stylist = User.query.get(a.stylist_id)
				booked[p.username].append({"date": a.date, "stylist":stylist.username})
		
	return booked

# returns an Array of dictionary entries
#  each entry is appt corresponding to patron id (p_id)
def get_patron_appointments(p_id):
	patron = User.query.filter_by(id=p_id).first()
	booked = []

	appts = Appointment.query.filter_by(patron_id=p_id)
	if appts.count() > 0:
		for a in appts:
			stylist = User.query.get(a.stylist_id)
			booked.append({"date": a.date, "stylist":stylist.username})

	return booked

# returns an Array of dictionary entries
# each entry is appt corresponding to stylist id (s_id)
def get_stylist_appointments(s_id):
	stylist = User.query.filter_by(id=s_id).first()
	booked = []

	appts = Appointment.query.filter_by(stylist_id=s_id)
	if appts.count() > 0:
		for a in appts:
			patron = User.query.get(a.stylist_id)
			booked.append({"date": a.date, "patron":patron.username})
	
	return booked


def get_stylist_calendar(s_id):
	stylist = User.query.filter_by(id=s_id).first()
	booked = Appointment.query.filter_by(stylist_id=s_id)
	calendar = {}
	
	for x in range(0, 7):
		now = datetime.datetime.today()
		apt = datetime.datetime(now.year, now.month, now.day) + datetime.timedelta(days=x)
		day = apt.strftime("%A")
		day_key = day + " " + str(apt.month) + "/" + str(apt.day)
		if day != "Monday" and day != "Sunday":
			calendar[day_key] = []
			for y in range(10,20):
				book_check = False
				year = None
				month = None
				d_day = None
				hour = y
				patron = None
				for b in booked:
					if b.date.year == apt.year and b.date.month == apt.month and b.date.day == apt.day:
						if b.date.hour == y:
							patron = User.query.get(b.patron_id).username
							book_check = True
							year = b.date.year
							month = b.date.month
							d_day = b.date.day
							break
				if (book_check == True):
					calendar[day_key].append({"booked":book_check, "year":year, "month":month, "day":d_day, "hour":hour, "patron":patron})
				else:
					calendar[day_key].append({"booked":book_check, "year":apt.year, "month":apt.month, "day":apt.day, "hour":hour, "patron":patron})
	return calendar

def create_user(username, password, role):
	print("registering new user " + username)
	db.session.add(User(username, password, role))
	db.session.commit()
	un = username
	print(User.query.all())


# key for session data
app.secret_key = "Absolutely terrible secret key"

# cli command scripts

@app.cli.command('blankdb')
def blankdb_command():
	db.drop_all()
	print('Destroyed the db')
	
@app.cli.command('initdb')
def initdb_command():
    """Reinitializes the database"""
    db.drop_all()
    db.create_all()

    # populate users
    owner = Owner("owner", "pass", "Owner")
    db.session.add(owner)
    stylist1 = User("Raheem", "password", "stylist")
    stylist2 = User("Leah", "123goon", "stylist")
    stylist3 = User("Rimsha", "Goomer", "stylist")
    db.session.add(stylist1)
    db.session.add(stylist2)
    db.session.add(stylist3)
    patron1 = User("Joshua", "password", "patron")
    patron2 = User("Alex", "password", "patron")
    patron3 = User("Mardigan", "password", "patron")
    db.session.add(patron1)
    db.session.add(patron2)
    db.session.add(patron3)
    db.session.add(Appointment(stylist1.id, patron1.id, datetime.datetime(2018, 11, 13, 10), stylist1, patron1))
    db.session.add(Appointment(stylist1.id, patron2.id, datetime.datetime(2018, 11, 14, 19), stylist2, patron2))
    db.session.add(Appointment(stylist1.id, patron2.id, datetime.datetime(2018, 11, 16, 11), stylist3, patron2))

    db.session.commit()
    print('Initialized the database.')

@app.cli.command('check')
def check_command():
	"""demonstrates model queries and relationships"""
	# queries

	print('get all users')
	displayResult(1, User.query.all())
	print('get all appointments')
	displayResult(2, Appointment.query.all())

	print('get appointment by username')
	stylist_name = "Raheem"
	uid = User.query.filter_by(username=stylist_name).first().id
	displayResult(3, Appointment.query.get(uid))

	print('get appointment by user id')
	uid = 1
	displayResult(4, Appointment.query.get(uid))

	print('get patron who booked appt by stylist name')
	stylist_name = "Raheem"
	uid = User.query.filter_by(username=stylist_name).first().id
	[print("Q5:\n Stylist: " + stylist_name + " | Patron: " + a.patron.username + " | Date: " + a.date +"\n\n") for a in Appointment.query.all() if a.stylist_id == uid]

	print('get appointment info by date')
	s_date = "05/26/2019"
	displayResult(6, [ia for ia in Appointment.query.all() if ia.date == s_date])
