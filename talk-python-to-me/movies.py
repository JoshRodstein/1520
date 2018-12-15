#!/usr/bin/python
#
# Assignment 3 - Talk Python to Me
# 1520 - Monday
# By: Josh Rodstein - 4021607
# Email: jor94@pitt.edu
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# Media class 
class Media:
    def __init__(self, title):
        if not isinstance(title, str):
            print("\nPossible ValueError detected for field: title, \nValue %s has been set as a string" % title)
        self.title = str(title)
          
    def slug(self):
        tStr = self.title.replace(' ', '-')
        title = ''
        for index in range(len(tStr)):
            if tStr[index] == '-' or tStr[index].isalnum() == True:
                title = title + tStr[index]
        title = title.lower()
        return title


# Movie class, inherits from Media class
# Arg types are checked and converted to values and types specd in print statements
class Movie(Media):
    def __init__(self, title, year, director, runtime):
        super(Movie, self).__init__(title)
        try:
            self.year = int(year)
        except ValueError:
            print("\nNo Valid Year Argument(int) Found - Value:" + year + ", is recorded as 0000")
            self.year = 0000

        if not isinstance(director, str):
            print("\nPossible ValueError detected for field: director, \nValue %s has been set as string" % director)
        self.director = str(director)

        try:
            self.runtime = float(runtime)
        except ValueError:
            print("\nNo Valid runtime (float) found - Value is recorded as 0.0")
            self.runtime = 0.0
        
    # override __repr__
    def __repr__(self):
        return "<Movie:"+self.title+">"
    
    # override __str__
    def __str__(self):
        return "(" + str(self.year) + ") " + self.title
    
    # return first three characters of movie title less any special chars
    def abbreviation(self):
        abr = self.slug().replace('-', '')
        return abr[0:3]


# Decorator for list headers
def decorator(msg):
    def list_films(og_func):
        def new_func(*args, **kwargs):
            print("==========\n%s\n==========" % msg)
            return og_func(*args, **kwargs)
        return new_func
    return list_films


# Print list of films released before year passed in arg
@decorator(msg = "Before... ")
def before_year(bYear):
    beforeYearList = [m.title for m in movies if m.year < bYear]
    print("Year " + str(bYear) + ":\n")
    for s in beforeYearList:
        print("  " + s)
    print("\n")


# Print list of abbreviations
@decorator(msg = "Abbreviations: ")
def abbr():
    abbrList = [m.abbreviation() for m in movies]
    for s in abbrList:
        print("  " + s)
    print("\n")


# Print lsit of film title slugs
@decorator(msg = "Slugs: ")
def slugs():
    slugList = [m.slug() for m in movies]
    for s in slugList:
        print("  " + s)
    print("\n")


# main function calls list functions
def main():
    print("\n/////////////////////////////////////////////////\n")
    print("\nThanks for checking the Local Movie Database!\n")
    slugs()
    abbr()
    before_year(1990)
    print("\nThank you\n")
    print("\n/////////////////////////////////////////////////\n")


# create list of favorite movies and call main()
if __name__ == '__main__':
    movies = []
    movies.append(Movie("Dont Tell Mom The Babysitter's Dead", 1991, "Stephen Herek", 102.0))
    movies.append(Movie("G.I. Joe", 1987, "Don Jurwich", 93.0))
    movies.append(Movie("The Secret of My Success", 1987, "Herbert Ross", 111.00))
    movies.append(Movie("Commando", 1985, "Mark L. Lester", 90.0))
    movies.append(Movie("Blade Runner", 1982, "Ridley Scott", 117.0))
    main()


