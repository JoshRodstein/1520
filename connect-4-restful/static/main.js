
var timeoutID;
var timeout = 1000;
var listPollerTimeout = 2000
var listPollerTimeoutId;
var comPollerTimeout = 2000
var comPollerTimeoutId;
var usrPollerTimeout = 2000
var usrtPollerTimeoutId;
var c4;
var p1;
var p2;
var pid;
var currentTurn;
var ajaxClick = false;

function c4Init(game) {
    pid = sessionStorage.getItem("pid");
    var isP1First = new Date(game["p1_birthday"]) < new Date(game["p1_birthday"]);
    p1 = new Player(game["p1_username"], game["p1_birthday"], parseInt(game["p1_id"]), isP1First);
    p2 = new Player(game["p2_username"], game["p2_birthday"], parseInt(game["p2_id"]), !isP1First);
    var game = new Connect4(p1, p2, parseInt(game["game_id"]));
    c4 = game;
}

function Player(name, birthday, id, tokenBool) {
    this.name = name;
    this.id = id ? id : -1;
    this.birthday = new Date(birthday);
    this.isRedToken = tokenBool;

    this.tokensRemaining = 21;
    this.remainingToWin = 4;

    this.winner = false;
}

function confirmReq() {

}

function Connect4(p1, p2, gameId) {
    this.gameId = gameId ? gameId : -1;
    sessionStorage.setItem("gameId", this.gameId);
    this.p1 = p1;
    this.p2 = p2;
    this.turn = 1;
    

    this.tokenState = []

    this.gameOver = false;




    this.strTokenState = function(){
        return JSON.stringify(this.tokenState);
    }

    this.currentPlayer = function() {
        console.log("current player");
        if (this.p1.birthday > this.p2.birthday) {
            currentTurn = (this.turn % 2 == 0 ? this.p2 : this.p1);
        } else {
            currentTurn = (this.turn % 2 == 1 ? this.p1 : this.p2);
        }
        return currentTurn;
    }

    function toggleCellHover(e) {
        var c = e.currentTarget.dataset.col;
        var tds = document.querySelectorAll('td.token[data-col="' + c + '"]');
        tds.forEach(function(item) {
            item.classList.toggle('token-hover');
        });
    }
    
    this.cacheGame = function() {
        console.log("Cache Local State")
        localStorage.setItem('game_' + this.gameId, JSON.stringify(this));
    }

    this.persistGame = function(){
        console.log("Persist Cache")
        makeReq("PUT", "/api/games/", 200, confirmReq, JSON.stringify(this));
    }

    /** Restore game state from localStorage() 
    */
    this.restoreGame = function() {
        var cached = JSON.parse(localStorage.getItem('game_' + this.gameId))
        if(cached) {
            /** If cached game exists in localStorage, update gameObj */
            console.log("Restore Local State from Cache");
            this.gameOver = cached.gameOver;
            this.turn = cached.turn;
            this.tokenState = cached.tokenState;
            this.p1 = cached.p1;
            this.p2 = cached.p2;
        } else {
            /** If no cached game in localStorage, cache new game state */
            console.log("No cached game state, create cache in localStorage.");
        }
       
        /** Return current game */
        return this;
    }

    function gameStatePoller() {
        console.log("Polling for change in game state");
        id = sessionStorage.getItem("gameId");
        makeReq("GET", "/api/games/?game_id="+id, 200, updateGameState);
    }

    function updateGameState(responseText) {
        window.clearInterval(timeoutID);
        var gameObj = JSON.parse(responseText);
        var cached = JSON.parse(localStorage.getItem('game_' + gameObj["id"]));
        var pid = sessionStorage.getItem("pid");
        var row, col; 

        if (gameObj["token_state"] != null) {
            this.tokenState = JSON.parse(gameObj["token_state"]);
            this.p1 = JSON.parse(gameObj["game_p1"]);
            this.p2 = JSON.parse(gameObj["game_p2"]);
            this.turn = JSON.parse(gameObj["turn"]);
            this.gameOver = JSON.parse(gameObj["game_over"]);
            
            if (String(JSON.stringify(cached.tokenState))  != String(JSON.stringify(this.tokenState))) {
                console.log("change detected");

                
                console.log("Current turn:  "+currentTurn.id);
                console.log("PID:    "+pid)
                if (c4.currentPlayer() != pid) {
                    console.log("Ajax Change");

                    
                    if (cached.tokenState.length == 0) {
                        console.log("first Time");
                        for (i = 0; i < this.tokenState.length; i++) {
                            if (this.tokenState[i].color) {
                                ajaxClick = true;
                                row = this.tokenState[i].row;
                                col = this.tokenState[i].col;
                            }
                        }
                        document.querySelector('[data-row="'+row+'"][data-col="'+col+'"]').click();
                        ajaxClick = false;
                    } else {
                        
                        for (i = 0; i < this.tokenState.length; i++) {
                            if ((this.tokenState[i].color != cached.tokenState[i].color) && !cached.tokenState.color) {
                                ajaxClick = true;
                                row = this.tokenState[i].row;
                                col = this.tokenState[i].col;
                            }
                        }
                        document.querySelector('[data-row="'+row+'"][data-col="'+col+'"]').click();
                        ajaxClick = false;

                    }
                }
            }
            ajaxClick = false;
        } 

        timeoutID = window.setTimeout(gameStatePoller, timeout);
        return cached;
    }
    
    var handleColumnClick = function(self) {
        
            return function(e) {
                if ( pid == self.currentPlayer().id || ajaxClick == true ) {
                    var el = e.currentTarget;
                    var p = self.currentPlayer();
                    console.log("column clicked");
                    // place token
                    var openCells = document.querySelectorAll('td.token-white.token[data-col="' + el.dataset.col + '"]');
                    if (openCells.length > 0) {
                        var o = openCells[openCells.length - 1];
                        p.isRedToken ? o.classList.add('token-red') : o.classList.add('token-black');
                        p.isRedToken ? o.dataset.color = 'red' : o.dataset.color = 'black';
                        o.classList.remove('token-white');

                        var tokenStateUpdate = self.tokenState.filter(function(item) {
                            return item.row == o.dataset.row && item.col == o.dataset.col;
                        })[0];
                        tokenStateUpdate.color = o.dataset.color;
                        tokenStateUpdate.player = p;

                        // Check win conditions
                        self.checkTokenStatus();

                        var d = p.isRedToken ? document.getElementById('p1-display') : document.getElementById('p2-display');
                        // Subtract Token and update display
                        p.tokensRemaining = p.tokensRemaining - 1;
                        d.querySelector('.remaining').textContent = p.tokensRemaining;
                        d.querySelector('.win-count').textContent = p.remainingToWin;
                        if (!self.gameOver) {
                            document.querySelectorAll('li.player-name').forEach(function(item) {
                                item.classList.toggle('current-player');
                            });
                        } else {
                            p.winner = true;
                            document.querySelector('li.player-name.current-player').classList.add('winner');
                            self.titleWin();
                        }

                        // Update turn and turn display
                        self.turn = self.turn + 1;
                        document.getElementById('gameturn').textContent = self.turn;
                    }


                    self.cacheGame();
                    self.persistGame();
                    
                    // If no more tokens, remove event listeners and make column unresponsive.
                    if (openCells.length === 1 || self.gameOver || (self.p1.tokensRemaining === 0 || self.p2.tokensRemaining === 0)) {
                        var cells;
                        if (openCells.length === 1) {
                            cells = document.querySelectorAll('td.token[data-col="' + el.dataset.col + '"]');
                        } else {
                            cells = document.querySelectorAll('td.token');
                        }
                        cells.forEach(function(item) {
                            item.removeEventListener('mouseenter', toggleCellHover);
                            item.removeEventListener('mouseleave', toggleCellHover);
                            item.classList.remove('token-hover');
                            item.removeEventListener('click', handleColumnClick);
                        });
                    }
                } 
            }
        
    }(this);

    this.checkTokenStatus = function() {

        var winCondition = false;

        this.tokenState.forEach(function(item, idx, arr) {
            var count = 0;
            var currentRow = item.row;
            var currentCol = item.col;
            var color = item.color;

            if (color != undefined) {
                var rowRangeStart = currentRow - 3 <= 0 ? 0 : currentRow - 3;
                var rowRangeEnd = currentRow + 3 >= 5 ? 5 : currentRow + 3;

                var colRangeStart = currentCol - 3 <= 0 ? 0 : currentCol - 3;
                var colRangeEnd = currentCol + 3 >= 6 ? 6 : currentCol + 3;

                var rowCount = arr.filter(function(rItem) {
                    return rowRangeStart <= rItem.row && rItem.row <= rowRangeEnd && rItem.col == currentCol;
                }).reduce(function(agg, v) {
                    if (v.color == color && color != undefined) {
                        return agg + 1;
                    }
                    return 0;
                }, count);

                var colCount = arr.filter(function(cItem) {
                    return colRangeStart <= cItem.col && cItem.col <= colRangeEnd && cItem.row == currentRow;
                }).reduce(function(agg, v) {
                    if (v.color == color && color != undefined) {
                        return agg + 1;
                    }
                    return 0;
                }, count);

                function getDiagonalPoints(cr, cc, height, width, leftToRight) {
                    var diagPoints = new Array();
                    if (leftToRight) {
                        for (var diag = 0; diag <= width + height - 2; diag++) {
                            points = new Array();
                            for (var j = 0; j <= diag; j++) {
                                var i = diag - j;
                                if (i < height && j < width) {
                                    points.push([i, j]);
                                }
                            }
                            if (points.some(function(item) {
                                    return JSON.stringify(item).includes(JSON.stringify([cr, cc]));
                                })) {
                                diagPoints.push(points);
                            }
                        }
                    } else {
                        for (var diag = width + height - 2; diag >= 0; diag--) {
                            points = new Array();
                            for (var j = 0; j <= diag; j++) {
                                var i = diag - j;
                                var y = width - j;
                                if (i < height && y < width) {
                                    points.push([i, y]);
                                }
                            }
                            if (points.some(function(item) {
                                    return JSON.stringify(item).includes(JSON.stringify([cr, cc]));
                                })) {
                                diagPoints.push(points);
                            }
                        }
                    }
                    return diagPoints;
                }

                var leftToRightPoints = getDiagonalPoints(currentRow, currentCol, 6, 7, true);
                var rightToLeftPoints = getDiagonalPoints(currentRow, currentCol, 6, 7, false);

                function countDiags(diags) {
                    return arr.filter(function(dItem) {
                        return diags.some(function(pointCheck) {
                            return JSON.stringify(pointCheck).includes(JSON.stringify([dItem.row, dItem.col]));
                        });
                    }).reduce(function(agg, v) {
                        if (v.color == color && color != undefined) {
                            return agg + 1;
                        }
                        return 0;
                    }, count);
                }

                var lDiagCount = countDiags(leftToRightPoints);
                var rDiagCount = countDiags(rightToLeftPoints);

                // console.log(lDiagCount);

                var remaining = 4 - Math.max(rowCount, colCount, lDiagCount, rDiagCount);
                // item.player.remainingToWin = 4 - Math.max(rowCount, colCount, lDiagCount, rDiagCount);

                item.player.remainingToWin = remaining <= item.player.remainingToWin ? remaining : item.player.remainingToWin;

                if (item.player.remainingToWin === 0) {
                    console.log(item.player.name + " WINS!");
                    winCondition = true;
                }
            }

        });

        this.gameOver = winCondition;
    }

    this.titleWin = function() {
        if (this.gameOver) {
            var winText = document.getElementById('title').textContent;
            if (this.p1.winner) {
                winText = winText + ": " + this.p1.name + " Wins!";
            } else {
                winText = winText + ": " + this.p2.name + " Wins!";
            }

            document.getElementById('title').textContent = winText;
        }
    }

    this.makePlayerDisplay = function(player) {
        var displayEl = player.isRedToken ? document.getElementById('p1-display') : document.getElementById('p2-display');
        var ulel = document.createElement('ul');
        ulel.classList.add('player-data')

        var liUser = document.createElement('li');
        liUser.textContent = player.name;
        liUser.classList.add('player-name')
        if (player == this.currentPlayer() && !this.gameOver) {
            liUser.classList.add('current-player');
        }
        if (player.winner && this.gameOver) {
            liUser.classList.add('current-player', 'winner');
            this.titleWin();
        }
        ulel.appendChild(liUser);

        liTurnsRemaining = document.createElement('li');
        liTurnsRemaining.innerHTML = "Remaining Tokens: <span class='remaining'>" + player.tokensRemaining + "</span>";
        ulel.appendChild(liTurnsRemaining);

        liLeftToWin = document.createElement('li');
        liLeftToWin.innerHTML = "Left to Win: <span class='win-count'>" + player.remainingToWin + "</span>"
        ulel.appendChild(liLeftToWin);

        displayEl.appendChild(ulel);
    }

    this.makeBoard = function() {

        var boardCanvas = document.getElementById('gameboard');

        var table = document.createElement('table');
        var newGame = this.tokenState.length === 0;
        table.id = 'connect-table'
        rows = 6;
        columns = 7;

        for (var i = 0; i < rows; i++) {
            var trEl = document.createElement('tr');
            for (var j = 0; j < columns; j++) {
                var tdEl = document.createElement('td');
                var tokenData;
                if (newGame) {
                    this.tokenState.push({ row: i, col: j, color: undefined, player: undefined });
                } else {
                    tokenData = this.tokenState.filter(function(item) {
                        return item.row == i && item.col == j;
                    })
                }
                if (tokenData && tokenData[0]) {
                    var tmpColor = tokenData[0].color ? tokenData[0].color : 'white'
                    tdEl.dataset.color = tmpColor;
                    tdEl.classList.add('token-' + tmpColor, 'token');
                } else {
                    tdEl.dataset.color = 'white';
                    tdEl.classList.add('token-white', 'token');
                }
                tdEl.dataset.row = i;
                tdEl.dataset.col = j;
                if (!this.gameOver) {
                    tdEl.addEventListener('mouseenter', toggleCellHover);
                    tdEl.addEventListener('mouseleave', toggleCellHover);
                    tdEl.addEventListener('click', handleColumnClick);
                }
                trEl.append(tdEl);
            }
            trEl.classList.add('token-row');
            table.append(trEl);
        }
        boardCanvas.append(table);
    }

    gameStatePoller();
    this.restoreGame();
    this.cacheGame();

    window.addEventListener('DOMContentLoaded', function(self) {
        return function(e) {
            self.makeBoard();
            self.makePlayerDisplay(self.p1);
            self.makePlayerDisplay(self.p2);
            document.getElementById('gameturn').textContent = self.turn;
        }
    }(this));
}
/**************************
 * 
 * Methods added ro A5
 * 
 */


/* makeReq and makeHandler taken from w8s examples repo fl13_restful example */
function makeReq(method, target, retCode, action, data) {
	var httpRequest = new XMLHttpRequest();

	if (!httpRequest) {
		alert('Giving up :( Cannot create an XMLHTTP instance');
		return false;
	}

	httpRequest.onreadystatechange = makeHandler(httpRequest, retCode, action);
	httpRequest.open(method, target);
	
	if (data){
        httpRequest.setRequestHeader('Content-Type', 'application/json');
        httpRequest.send(data);
	}
	else {

        console.log("Sending request:" + httpRequest)
		httpRequest.send();
	}
}

function makeHandler(httpRequest, retCode, action) {
	function handler() {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			if (httpRequest.status === retCode) {
				action(httpRequest.responseText);
			} else {
				alert("There was a problem with the request.");
			}
		}
	}
	return handler;
}

function addListeners() {
	document.querySelectorAll(".delete_game").forEach(function(elem) {
		elem.addEventListener("click", function() {
			delete_game("{{ player_id }}", elem.getAttribute("id"));
		});
    });
}

function newGame(player1, player2, pid) {
    var data;
    data = '{ "player_one_name":"'+player1+'", "player_two_name":"'+player2+'" }';
    /*window.clearTimeout(timeoutId);*/
    makeReq("POST", "/api/games/", 201, gameListPoller, data)
}

function deleteGame(pid, gid) {
    makeReq("DELETE", "/api/games/?game_id="+Number(gid), 202, gameListPoller)
    localStorage.removeItem("game_"+gid);
}

function gameListPoller() {
    makeReq("GET", "/api/games/?player_id="+sessionStorage.getItem("pid"), 200, repopulate_game_list);
}

function userTop10Poller() {
    if (sessionStorage.getItem("pid")) {
        var argStr = "?player_id="+sessionStorage.getItem("pid")+"&top10="+true;
        makeReq("GET", "/api/games/"+argStr, 200, repopulate_user_top);
    }
}

function allTop10Poller(responseText) {
    console.log("POLLING MOFFUGAH")
    var argStr = "?top10="+true;
    makeReq("GET", "/api/games/"+argStr, 200, repopulate_all_top);
}

function repopulate_user_top(responseText) { 
    window.clearTimeout(usrtPollerTimeoutId);
    console.log("user tops scores callback");
    var games = JSON.parse(responseText)

    var list = document.getElementById("user_top10");
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }

    for (i = 0; i < games.length; i++) {
        game_id = games[i]["id"];
        player_id = games[i]["player_one_id"];
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.innerText = games[i]["title"] + " | " + games[i]["turn"];
        a.setAttribute("href", "http://localhost:5000/game/"+game_id);
        li.appendChild(a);
        list.appendChild(li);
    }

    usrtPollerTimeoutId = window.setTimeout(userTop10Poller, usrPollerTimeout);

}

function repopulate_all_top(responseText) { 
    window.clearTimeout(comPollerTimeoutId);
    console.log("all tops scores callback");
    var games = JSON.parse(responseText)

    var list = document.getElementById("all_top10");
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }

    for (i = 0; i < games.length; i++) {
        var text;
        game_id = games[i]["id"];
        player_id = games[i]["player_one_id"];
        var li = document.createElement("li");
        var a = document.createElement("a");
        text = games[i]["turn"] + " turns";

        if (sessionStorage.getItem("pid")) {
            a.innerText = games[i]["winner_name"];
            a.setAttribute("href", "http://localhost:5000/game/"+game_id);
            text = text + " | " + games[i]["winner_name"];
        }
        a.innerText = text;
        li.appendChild(a);
        list.appendChild(li);
    }

    comPollerTimeoutId = window.setTimeout(allTop10Poller, comPollerTimeout+1);

}

function repopulate_game_list(responseText) {
    window.clearInterval(listPollerTimeoutId);
    var games = JSON.parse(responseText);
    var new_ids = [];
    var old_ids = [];

    
    var list = document.getElementById("game_list");
    var els = list.children;
    var lsKeys = Object.keys(localStorage);
    for (i = 0; i < lsKeys.length; i++) {
        old_ids.push(JSON.parse(localStorage.getItem(lsKeys[i]))["gameId"]);
    }
    
    if (sessionStorage.getItem("pid")) {
        if (games.length != lsKeys.length || games.length != els.length) {

            while (list.firstChild) {
                list.removeChild(list.firstChild);
            }

            for (i = 0; i < games.length; i++) {
                game_id = games[i]["id"];
                player_id = games[i]["player_one_id"];
                var li = document.createElement("li");
                var a = document.createElement("a");
                a.innerText = games[i]["title"];
                a.setAttribute("game_id", game_id);
                a.setAttribute("href", "http://localhost:5000/game/"+game_id);
                li.appendChild(a);

                if (sessionStorage.getItem("pid") == player_id) {
                    var ad = document.createElement("input");
                    ad.setAttribute("type", "submit")
                    ad.setAttribute("value", "Delete");
                    ad.setAttribute("class", "delete_game");
                    ad.setAttribute("game_id", game_id)
                    ad.setAttribute("id", "game_id")
                    ad.setAttribute("player_id", player_id)
                    ad.setAttribute("onclick", "deleteGame("+player_id+","+game_id+")");
                    li.appendChild(ad);
                }

                list.appendChild(li);
                new_ids.push(game_id);
            }

            if (old_ids.length > new_ids.length) {
                var i;
                for (i = 0; i < old_ids.length; i++) {
                    var found = false;
                    for (y = 0; y < new_ids.length; y++) {
                        if (old_ids[i] == new_ids[y]) {
                            found = true;
                            break;
                        }
                    }
                    if (found == false) {
                        console.log("found it at index " + i)
                        localStorage.removeItem("game_"+old_ids[i]);
                        break;
                    }
                }
                
            }
        }
    }
    console.log("new List: " + new_ids);
    console.log("old List: " + old_ids);


	listPollerTimeoutId = window.setTimeout(gameListPoller, listPollerTimeout);
}
