from flask_restful import Resource, fields, reqparse, marshal_with, abort
from flask import request
from models import db, Game, Player
from auth import Authorization
import json
from sqlalchemy import or_, and_

player_fields = {
    "id": fields.Integer,
    "username": fields.String,
    "birthday": fields.datetime,
}

game_fields = {
    "id": fields.Integer,
    "player_one_id": fields.Integer,
    "player_two_id": fields.Integer,
    "turn": fields.Integer,
    "game_over": fields.Boolean,
    "winner_id": fields.Integer,
    "title": fields.String,
    "token_state": fields.String,
    "game_p1": fields.String,
    "game_p2": fields.String,
    "winner_name": fields.String
}

parser = reqparse.RequestParser(bundle_errors=True)
parser.add_argument("gameId", type=str, location="json")
parser.add_argument("gameOver", type=bool, location="json")
parser.add_argument("p1", type=dict, location="json")
parser.add_argument("p2", type=dict, location="json")
parser.add_argument("tokenState", type=dict, action='append', location="json")
parser.add_argument("turn", type=int, location="json")

class GameResource(Resource):
    print("In Game Resource")

    @marshal_with(game_fields)
    def put(self):
        print("Updating game state at endpoint!")
        args = parser.parse_args()
        
        game_id = None
        game_over = None
        player1 = None
        player2 = None
        token_state = None
        turn = None
        winner_id = None
        game = None

        if args["gameId"]:
            game_id = args["gameId"]
            game = Game.query.get(game_id)

        if game:
            print("game exists")
            if args["gameOver"]:
                game_over = args["gameOver"]
            if args["p1"]:
                player1 = args["p1"]
            if args["p2"]:
                player2 = args["p2"]
            if args["tokenState"]:
                token_state = json.dumps(args["tokenState"])
                token_state = str(token_state).replace(" ", "")
            if args["turn"]:
                turn = args["turn"]
        
        if game.game_over != game_over:
            game.game_over = game_over
            if player1["winner"] == True:
                game.winner_id = player1["id"]
                game.get_winner()
            elif player2["winner"] == True:  
                game.winner_id = player2["id"]
                game.get_winner()
        if game.turn != turn:
            game.turn = turn
        if game.token_state != token_state:
            game.token_state = token_state
        if game.game_p1 != json.dumps(player1):
            game.game_p1 = json.dumps(player1)
        if game.game_p2 != json.dumps(player2):
            game.game_p2 = json.dumps(player2)

        db.session.commit()
        return game, 200


    # @auth.login_required
    @marshal_with(game_fields)
    def delete(self):
        query_parser = reqparse.RequestParser()
        query_parser.add_argument("game_id", type=str)

        query_args = query_parser.parse_args()
        q_filter = None

        if query_args["game_id"]:
            q_filter = query_args["game_id"]
        else:
            abort(404, message="Cannot delete resource without id")
        
        game = Game.query
        
        if q_filter:
            game = game.filter(
                Game.id.like(q_filter)
            ).first()
        
        if not game:
            abort(404, message="Resource not found")

        db.session.delete(game)
        db.session.commit()

        return game, 202
        
class GameListResource(Resource):
    print("In GameList Resource")
    # @auth.login_required
    @marshal_with(game_fields)
    def get(self):
        query_parser = reqparse.RequestParser()
        query_parser.add_argument("game_id", type=str)
        query_parser.add_argument("player_id", type=str)
        query_parser.add_argument("top10", type=bool)

        query_args = query_parser.parse_args()
        q_filter_player = None
        q_filter_game = None
        q_filter_top10 = None

        if query_args["game_id"]:
            print("Game id passed as query arg")
            q_filter_game = query_args["game_id"]

        if query_args["player_id"]:
            print("Player id passed as query arg")
            q_filter_player = query_args["player_id"]
        
        if query_args["top10"]:
            print("Requesting top 10 scores")
            q_filter_top10 = query_args["top10"]

        games = Game.query

        if q_filter_player:
            if q_filter_top10:
                games = games.filter(
                    Game.player_one_id.like(q_filter_player)
                    | Game.player_two_id.like(q_filter_player)).filter_by(game_over=True).order_by(Game.turn)
                games = games.filter(Game.winner_id.like(q_filter_player)).limit(10)
            else:
                games = games.filter(
                    Game.player_one_id.like(q_filter_player)
                    | Game.player_two_id.like(q_filter_player)
                )
        elif q_filter_top10:
            if q_filter_top10:
                games = games.filter(and_(Game.game_over.is_(True), Game.winner_id.isnot(0))).order_by(Game.turn).limit(10)
            
        
        if q_filter_game:
            games = games.filter(
                Game.id.like(q_filter_game)
            )
        
        if query_args["game_id"]:
            return games.first()

        return games.all()

    # @auth.login_required
    @marshal_with(game_fields)
    def post(self):
        print("Plenty of room for another game!")
        query_parser = reqparse.RequestParser()
        query_parser.add_argument("player_one_id", type=str)
        query_parser.add_argument("player_two_id", type=str)
        query_parser.add_argument("player_one_name", type=str)
        query_parser.add_argument("player_two_name", type=str)

        query_args = query_parser.parse_args()

        p1 = None
        p2 = None

        if query_args["player_one_id"]:
            p1id = query_args["player_one_id"]
        elif query_args["player_one_name"]:
            p1id = Player.query.filter_by(username=query_args["player_one_name"]).first().id
        if query_args["player_two_id"]:
            p2id = query_args["player_two_id"]
        elif query_args["player_two_name"]:
            p2id = Player.query.filter_by(username=query_args["player_two_name"]).first().id

        game = Game()

        if not p1id:
            print("Player one id does not exist: " + str(p1id))
            abort(423)
            
        if not p2id:
            print("Player two id does not exist: " + str(p2id))
            abort(423)
        

        p1 = Player.query.filter_by(id=p1id).first()
        p2 = Player.query.filter_by(id=p2id).first()

        if not p1:
            print("Player one does not exist: " + str(p1))
            abort(423)
            
        if not p2:
            print("Player two does not exist: " + str(p2))
            abort(423)

        game.player_one = p1
        game.player_two = p2
        game.game_title()
        db.session.add(game)
        db.session.commit()
        responseList = []

        return responseList.append(game), 201


    
    