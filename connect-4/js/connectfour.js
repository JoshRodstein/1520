
/*
1520 - Prog Langs for Web apps
Proffessor Todd Waits
Assignment 2: Cconnect Four!

By: Joshua Rodstein
email: jor94@pitt.edu

****************************************************/ 


// Global Variables
const whiteSrc = "images/white-circle.png";
const redSrc = "images/red-circle.png";
const blackSrc = "images/black-circle.png";
var numWords = ["one", "two", "three", "four"];
const dateRegex = /^((0?[1-9])|(1[123]?)|(January)|(Jan)|(February)|(Feb)|(Mar)|(March)|(Apr)|(April)|(May)|(Jun)|(June)|(Jul)|(July)|(Aug)|(August)|(Sep)|(September)|(Oct)|(October)|(Nov)|(November)|(Dec)|(December)){1}(-|\/|\s|\.|\.+\s|)([12][1-9]?){1}(\,\s+|-|\/)([1][9][0-9][0-9]|[2][0][01][0-8]|[9][0-9]|[8][0-9])$/g;

player1 = null;
player2 = null;
p1Data = null;
p2Data = null;
currentPlayer = null;
bDate1 = "";
bDate2 = "";
boardState = null;
board = {};

var seconds = 00; 
var tens = 00; 
var appendTens = document.getElementById("tens")
var appendSeconds = document.getElementById("seconds")
var Interval;

function FormData(number, name, birthDate) {
   this.playerNumber = number;
   this.playerName = name;
   this.birthDate = birthDate;

   return this;
}

// player Object
function Player(name, birthDate, number, tokenColor, tokenSrc) {
    
    if (typeof name === 'string') {
        this.name = name;
    } else if (typeof name === 'number'){
        this.name = name.toString();
    }

    this.number = number;
    this.tokenColor = tokenColor;
    this.tokenSrc = tokenSrc;
    this.birthDate = birthDate;
    this.tokenCount = 21;
    this.prevMove = "";
    this.movesToWin = 4;
    this.tokenChains = [null, 0, 0, 0, 0]

    return this;
}

// function init sets up game after players have entered valid info
function init() {
    p1Data = JSON.parse(sessionStorage.getItem('p1Data'));
    p2Data = JSON.parse(sessionStorage.getItem('p2Data'));
    player1 = new Player(p1Data.playerName, p1Data.birthDate, 1, "red", redSrc);
    player2 = new Player(p2Data.playerName, p2Data.birthDate, 2, "black", blackSrc);
    currentPlayer = player1;

    displayGame();
    registerListeners();

    setTimeout( function () {
        alert("Click OK to begin " + player1.name + "'s turn");
        console.log("Alert of Turn");
        Interval = setInterval(startTimer, 10);
    }, 10);
   
    setTimeout( function () {
        generateGrid();
    }, 10);
    
    // register event listeners
    
}

function gatherInfo() {

    var nickName = document.getElementById("nnInput").value;
    var bDate = document.getElementById("bdInput").value;
    var dateArray = [];
    if (isValidBDay(bDate) != null && nickName != "") {
        dateArray = bDate.split(/,\s|\.\s|-|\s|\//);
        var bdObject = new Date();

        if (p1Data == null) {
            var mr = monthsToNumbers(dateArray[0]);
            console.log(mr);
            if (mr != null) {
                dateArray[0] = mr;
            }
            console.log(dateArray);
            p1Data = new FormData(1, nickName, new Date(Number(dateArray[0]), Number(dateArray[1]), Number(dateArray[2])));
            console.log("PLayer 1 Name: " + nickName + "\n Player 2 Birthday: " + new Date(Number(dateArray[0]), Number(dateArray[1]), Number(dateArray[2])));
            sessionStorage.setItem('p1Data', JSON.stringify(p1Data));

            /* Change prompt to reflect player 2 and clear form fields of text */
            var label = document.getElementById('prompt');
            label.textContent = "Enter info for Player 2!";    
            document.getElementById("playerInfo").reset();

            return;

        } else if (p2Data == null) {
            var mr = monthsToNumbers(dateArray[0]);
 
            if (mr != null) {
                dateArray[0] = mr;
            }

            p2Data = new FormData(2, nickName, new Date(Number(dateArray[0]), Number(dateArray[1]), Number(dateArray[2])));
            sessionStorage.setItem('p2Data', JSON.stringify(p2Data));
            console.log("PLayer 2 Name: " + nickName + "\n Player 2 Birthday: " + new Date(Number(dateArray[0]), Number(dateArray[1]), Number(dateArray[2])));
        }
    } else {
        alert("                                     Invalid Input!" +
              "\nName CANNOT be empty, and birthdate must be valid. " + 
              "\n                                      Try Again!"
              );
        newGame();
    }

    init();
}

function monthsToNumbers(month) {
    console.log("Month is" + month);
    switch(month) {
        case "Jan":
        case "January":
            return 1;
        case "Feb":
        case "February":
            return 2;
        case "Mar":
        case "March":
            return 3;
        case "Apr":
        case "April":
            return 4;
        case "May":
            return 5;
        case "Jun":
        case "June":
            return 6;
        case "Jul":
        case "July":
            return 7;
        case "Aug":
        case "August":
            return 8;
        case "Sep":
        case "September":
            return 9;
        case "Oct":
        case "October":
            return 10;
        case "Nov":
        case "November":
            return 11;
        case "Dec":
        case "December":
            return 12;
        default:
            return null;
    }
}

// check bday against regex expression
function isValidBDay(bd) {
    var regex = dateRegex;
    var found = bd.match(regex);

    console.log(found);

    return found;
}

// Re- initialize game and display info prompt screen
function newGame() {
    var info = document.getElementById('intro');
    info.style.visibility = 'visible'; 
    var game = document.getElementById('top_half');
    game.style.visibility = 'hidden';
    var game = document.getElementById('high-scores');
    game.style.visibility = 'hidden';
  
    sessionStorage.clear();
    document.location.reload(true);
}

// hide prompt element and display game screen 
function displayGame() {
    var info = document.getElementById('intro');
    info.style.visibility = 'hidden'; 
    var game = document.getElementById('top_half');
    game.style.visibility = 'visible';

    document.getElementById("p1-display-name").textContent = player1.name;
    document.getElementById("p1-prev-move-data-p").textContent = "X:X";
    document.getElementById("p1-tc-count-data-p").textContent = 21;

    document.getElementById("p2-display-name").textContent = player2.name;
    document.getElementById("p2-prev-move-data-p").textContent = "X:X";
    document.getElementById("p2-tc-count-data-p").textContent = 21;
}

// calculate high scores after game has ended, post 10 best times to hgih scores list
function endGame(seconds, tens) {
    var scoreArry = [];

    highScores = JSON.parse(localStorage.getItem("highScores"));
    
    if (highScores == null) {
        highScores = [];
    }
    console.log(currentPlayer.name);
    var currentScore =  
    {
        pName: currentPlayer.name,
        scoreArry: [seconds, tens]
    }

    highScores.push(currentScore);
    highScores.sort(function (a, b) {
        return a.scoreArry[0] - b.scoreArry[0] || a.scoreArry[1] - b.scoreArry[1];
    });
    
    highScores = highScores.slice(0, 10);
    localStorage.setItem("highScores", JSON.stringify(highScores));
    renderList(highScores);

    var info = document.getElementById('top_half');
    info.style.visibility = 'hidden'; 
    var game = document.getElementById('high-scores');
    game.style.visibility = 'visible';
}

// renders the high score list to the DOM
function renderList(list) {
    var olElement = document.getElementById("scores-list");
    
    console.log(list[0].scoreArry.toString);
    var i = 0;
    for (item in list) {
        
        var liElement = document.createElement("li");
        liElement.setAttribute("class", "score-item");
       
        var tdElement = document.createElement("td");
        tdElement.setAttribute("id", "game-duration-" + (i+1));
        tdElement.textContent = list[item].scoreArry[0] + ":" + list[item].scoreArry[1];
        
        liElement.appendChild(tdElement);

        var tdElement = document.createElement("td");
        tdElement.setAttribute("id", "player-name-" + (i+1));
        tdElement.setAttribute("class", "score-data");
        tdElement.textContent = list[item].pName;
        

        liElement.appendChild(tdElement);

        olElement.appendChild(liElement);
        i++;
    }
    
    // fill any empty spaces in top ten with <Empty>
    if (list.length < 10) {
        for (i = (list.length); i < 10; i++) {
            var liElement = document.createElement("li");
            liElement.setAttribute("class", "score-item");
        
            var tdElement = document.createElement("td");
            tdElement.setAttribute("id", "game-duration-" + (i+1));
            tdElement.textContent = "<Empty>" ;
            
            liElement.appendChild(tdElement);

            var tdElement = document.createElement("td");
            tdElement.setAttribute("id", "player-name-" + (i+1));
            tdElement.setAttribute("class", "score-data");
            tdElement.textContent = "<Empty>";
            

            liElement.appendChild(tdElement);

            olElement.appendChild(liElement);

        }
    }
}

// Dynamically generate grid afer prompt dismissed
function generateGrid() {
    console.log("Generating Grid");

    var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

    for (var i = 1; i < 7; i++) {

        for (var j = 0; j < letters.length; j++) {

            setBoard(i, letters[j]);

            var id = letters[j] + ":" + i;

            document.getElementById('cells')
                .appendChild( document.createElement("div") )
                .setAttribute("id", id);

            var elem = document.getElementById(id);
            if(elem != null){
                elem.setAttribute("class", "space");
                var tokImg = document.createElement('img');
                tokImg.setAttribute("id", id+":img");
                tokImg.setAttribute("src", whiteSrc);
                elem.appendChild(tokImg);

            }
            setBoard(i, letters[j], elem);
        }
    }

}

// initialize global board object 
function setBoard(row, col, cell) {
    if (board[col] == undefined){

        board[col] = { 
            column: col, 
            element: cell, 
            rows: [row, "white", "white", "white", "white", "white", "white"] 
        }
    }
}

// Registers event listeners to corresponding functions/handlers
function registerListeners() {
    document.getElementById("new-game").addEventListener("click", newGame, false);
    document.getElementById("alpha").addEventListener("click", placeToken, true);
}


// Event Listeners/Handlers
function placeToken(event) {
    var column = event.target.id;
    var rows = board[column].rows;
    var cell = rows.lastIndexOf("white");
    var win = false;

    if (cell != -1 && currentPlayer.tokenCount > 0){
        rows[cell] = currentPlayer.tokenColor;
        cellElem = document.getElementById(column+":"+cell+":img");
        cellElem.setAttribute("src", currentPlayer.tokenSrc);
        currentPlayer.prevMove = column+":"+cell;
        currentPlayer.tokenCount -= 1;
        
        
        /* Found tha timeout were needed in order to wait for values to assign, due to
        brute force checkign fo board twice for every move */
        setTimeout (function () {
            if (checkForWin(player1) == 0 || checkForWin(player2) == 0) {
                win = true;
            }
        }, 200);
        
            updateGameInfo(player1.number, player1.prevMove, player1.tokenCount);
            updateGameInfo(player2.number, player2.prevMove, player2.tokenCount);
        

        console.log("Previous move for " + currentPlayer.name + " was " + currentPlayer.prevMove + "\n" +
        "Token count: " + currentPlayer.tokenCount);
    } else {
        if (currentPlayer.tokenCount == 0) {
            console.log("You are out of tokens!");
        } else {
            console.log("Cell: " + cell + "| TokenCount: "+currentPlayer.tokenCount);
            alert("That column is full! Please choose again.");
            return;
        }
    }
    
    console.log("current player is:" + currentPlayer.name +". He needs " +currentPlayer.movesToWin + " moves to win");
    
        setTimeout (function () {
            if (win == false) {    
                if (currentPlayer.number == 1) {
                    currentPlayer = player2;
                    alert("Click OK to begin " + player2.name + "'s turn");
                
                } else {
                    currentPlayer = player1;
                    alert("Click OK to begin " + player1.name + "'s turn");
                }
            }
        }, 201);



}

/* Checking for wins &/or continuos runs of same color tokens
    - Vertical win/run of tokens
    - updating of VERTICAL least moves to win
*/

function checkForWin(player) {
    var movesToWin = 4;

    movesToWin = Math.min(checkHorizontal(player), checkVertical(player));
    movesToWin = Math.min(movesToWin, checkRisingDiagonals(player));
    movesToWin = Math.min(movesToWin, checkFallingDiagonals(player));



    player.movesToWin = movesToWin;

    if (movesToWin == 0) {
        appendSeconds = document.getElementById("seconds");
        appendTens = document.getElementById("tens");
        clearInterval(Interval);
        alert("Congratulations!  " + player.name + " won in " + appendSeconds.textContent +":" + appendTens.textContent +" !");
        endGame(appendSeconds.textContent, appendTens.textContent);
        return 0;
    } 


    console.log("Moves to win for player +" + player.name + " is: " + movesToWin);
    if (player.number == currentPlayer.number) {
        alert(player.name + " needs " + numWords[movesToWin-1] + " moves to win for Connect Four!");
    }


    return movesToWin;

}

function checkVertical(player) {
    letters = ["A", "B", "C", "D", "E", "F", "G"];
    var counter = 0;
    var tokenColor = player.tokenColor;
    var chainArry;
    var toWin = 4;

    for (column in board) {
        var cellColor;
        for (var i = 1; i < board[column].rows.length-3; i++){
            chainArry = [];
            counter = 0;
            for (var j = i, y = 0; y < 4; j++, y++) {
                var cellColor = board[column].rows[j];
                if (cellColor != "white" && cellColor == tokenColor) {
                    chainArry.push(cellColor);
                } else if (cellColor != tokenColor && cellColor != "white") {
                    chainArry = [];
                    break;
                } else if (cellColor == "white") {
                    counter++;
                }
            }
            if (4 - chainArry.length < toWin) {
                toWin = 4 - chainArry.length;
            }
        }
    }


    
    player.movesToWin = toWin;
    console.log("\tPlayer " + player.number + " has : " + player.movesToWin + " vertical moves to win");
    return player.movesToWin;

}

function checkHorizontal(player) {

    letters = ["A", "B", "C", "D", "E", "F", "G"];
    var counter = 0;
    var tokenColor = player.tokenColor;
    var chainArry;
    var toWin = 4;
    

    for (var i = 1; i < 7; i++) {
        var cellColor;
        for (var y = 0; y < letters.length-3; y++) {
            chainArry = [];
            counter = 0;
          for (var j = y, x = 0; x < 4; j++, x++) {
              var cellColor = board[letters[j]].rows[i];
              if (cellColor == tokenColor) {
                  chainArry.push(cellColor);
              } else if (cellColor != tokenColor && cellColor != "white") {
                  chainArry = [];
                  break;
              } else if (cellColor == "white") {
                  counter++;
              }
          }

          if (4 - chainArry.length < toWin && chainArry.length != 0) {
            toWin = 4 - chainArry.length;
          }
        }
    }

    player.movesToWin = toWin;
    console.log("\tPlayer " + player.number + " has : " + player.movesToWin + " horizontal moves to win");
    return player.movesToWin;
   
}

function checkRisingDiagonals(player) {
    letters = ["A", "B", "C", "D", "E", "F", "G"];
    var tokenColor = player.tokenColor;
    var toWin = 4;
    var chainArry;

    // c == column 
    // r == cell in column
    for (var i = 4; i < 7; i++) {
        var r = i;
        var c = 0;
        var cellColor;
        while (r >= 4) {

            var tr = r;
            var tc = c;
            chainArry = [];
            counter = 0;
            for (y = 0; y < 4; y++){
                var cellColor = board[letters[tc]].rows[tr];
                if (cellColor == tokenColor) {
                    chainArry.push(cellColor);
                } else if (cellColor != tokenColor && cellColor != "white") {
                    chainArry = [];
                    break;
                } else if (cellColor == "white") {
                    counter++;
                }
                tc++;
                tr--;
            }
            r--;
            c++;

            if (4 - chainArry.length < toWin && chainArry.length != 0) {
                toWin = 4 - chainArry.length;
            }
        }
     
    }
    

    c = 1;
    for (var i = 1; i < 7; i++) {
        var r = 6;
        cTemp = c;
        while (cTemp < 4) {
            // start index for 4 in  a row check
            var tc = cTemp;
            var tr = r;
            chainArry = [];
            counter = 0;
            for (y = 0; y < 4; y++){
                var cellColor = board[letters[tc]].rows[tr];
                if (cellColor == tokenColor) {
                    chainArry.push(cellColor);
                } else if (cellColor != tokenColor && cellColor != "white") {
                    chainArry = [];
                    break;
                } else if (cellColor == "white") {
                    counter++;
                }

                tr--;
                tc++;
            }
            r--;
            cTemp++;

            if (4 - chainArry.length < toWin && chainArry.length != 0) {
                toWin = 4 - chainArry.length;
            }
        }
        c++;
    }


    player.movesToWin = toWin;
    console.log("\tPlayer " + player.number + " has : " + player.movesToWin + " Rising Diagonal moves to win");
    return player.movesToWin;
}

function checkFallingDiagonals(player) {
    var letters = ["A", "B", "C", "D", "E", "F", "G"];
    var tokenColor = player.tokenColor;
    var toWin = 4;
    var chainArry;


    for (var i = 4; i < 7; i++) {
        var r = i;
        var c = 6;
        var cellColor;

        while (r >= 4) {
            
            var tc = c;
            var tr = r;
            chainArry = [];
            counter = 0;
            for (var y = 0; y < 4; y++){
                var cellColor = board[letters[tc]].rows[tr];
                if (cellColor == tokenColor) {
                    chainArry.push(cellColor);
                } else if (cellColor != tokenColor && cellColor != "white") {
                    chainArry = [];
                    break;
                } else if (cellColor == "white") {
                    counter++;
                }
                tc--;
                tr--;

            }
            r--;
            c--;
            if (4 - chainArry.length < toWin && chainArry.length != 0) {
                toWin = 4 - chainArry.length;
            }
        }
    }

    c = 5;
    for (var i = 5; i >= 3; i--) {
        var r = 6;
        cTemp = c;
        while (cTemp >= 3) {
            // start index for 4 in  a row check
            var tc = cTemp;
            var tr = r;
            chainArry = [];
            counter = 0;
            for (y = 0; y < 4; y++){
                 var cellColor = board[letters[tc]].rows[tr];
                if (cellColor == tokenColor) {
                    chainArry.push(cellColor);
                } else if (cellColor != tokenColor && cellColor != "white") {
                    chainArry = [];
                    break;
                } else if (cellColor == "white") {
                    counter++;
                }

                tr--;
                tc--;
            }
            r--;
            cTemp--;

            if (4 - chainArry.length < toWin && chainArry.length != 0) {
                toWin = 4 - chainArry.length;
            }

        }
        c--;
    }
    
    player.movesToWin = toWin;
    console.log("\tPlayer " + player.number + " has : " + player.movesToWin + " Falling Diagonal moves to win");
    return player.movesToWin;
}

// Update info panel for both players
function updateGameInfo(pNum, prevMove, tCount) {
    document.getElementById("p"+pNum+"-prev-move-data-p").textContent = prevMove;
    document.getElementById("p"+pNum+"-tc-count-data-p").textContent = tCount;
    // check for consecutive tokens and return moves to win
}



function startTimer () {
    tens++; 
    if(tens < 9){
      appendTens.innerHTML = "0" + tens;
    }
    if (tens > 9){
      appendTens.innerHTML = tens;
      
    } 
    if (tens > 99) {
      console.log("seconds");
      seconds++;
      appendSeconds.innerHTML = "0" + seconds;
      tens = 0;
      appendTens.innerHTML = "0" + 0;
    }
    if (seconds > 9){
      appendSeconds.innerHTML = seconds;
    }
  
  }


/* Check if page load triggered by refresh
        Not quite sure if this is needed... 
        ...might be useful in determing whether/when to load stored game state
 */
if (window.performance) {
  console.info("window.performance works fine on this browser");
}
if (performance.navigation.type == 1) {
    console.info( "This page is reloaded" );
    sessionStorage.clear();

} else {
    console.info( "This page is not reloaded");
}


