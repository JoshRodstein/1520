# Connect Four Requirements
*In Order*



### 1. prompt 1st player for name and birth date**

  - Your game should be flexible in accepting the multiple date formats.
        - MM/DD/YYYY
        - M/D/YYYY
        - M/D/YY
        - MM-DD-YYYY
        - M-D-YYYY
        - M-D-YY
        - MMM. DD, YYYY
        - MMM. D, YYYY
        - MMM. D, YY
        - MMMMMM DD, YYYY - i.e. January, February, etc.
        - MMMMMM DD, YYYY - i.e. January, February, etc.
        - MMMMMM D, YY - i.e. January, February, etc.

      Use a regex function to validate the strings, and split the string into three variables representing Day, Month, and Year.
  - Set players birthday attribute as a JavaScript Date Object constructed from 3 variable

  - Gather 2nd players name and birth date and repeat validation via regex

### 2. Oldest players takes first turn

### 3. There should be a a timer to track the duration of the game
  - displayed at the top of the page
  - starts when first confirms game start (and start of their turn)

###### *Note: At this point, game should being the first players turn*

### 4. At start of each turn: pop-up alert indicating whose turn it is by names
       "click OK to begin <Player 1 name> turn"

### 5. After dismissal of begin Prompt
  - Game should render 7x6 grid created dynamically with Javascript.
    - Yellow background and blue border
    - Empty cells should gave a white circle (use image from repo white-circle.png)

### 6. Remaining token for each player should be displayed to left/right of board
  - Player 1 tokens: Left of board
  - Player 2 tokens: Right of board

### 7. Player must place a token by clicking a column
  - clicking on cells must have no effect
  - Cell occupied by placed token must contain circle representing players color
    - red-circle.png and black-circle.png
  - after placed, pup up alert the player how many tokens left to reach connect
    four
    - ** count should only contain viable options (i.e. if a connect four is blocked
      but another players token, the count should reset to next best possible amount) **

### 8. If player click on a full column
  - pop up alert tells player that the column is full

### 9. When a toked is placed, remaining tokens should decrement by 1

###### *Note: after token is placed, process repeats for the next plater*

### 10. Game should continue until a player has reached a connect Four
  - Player who gets CF should receive pop up notification of the Win

### 11. Game should keep track of the names and game duration of the 10 fastest games in local storage
  - Only update local storage if 10 slots have not been filled, or a duration beats any time currently tracked in local storage

### 12. At the end of the game, the board should be removed and a top 10 list should be displayed
  - Empty values should render <Empty>
  - Button should be included to start a new game
  - Starting a new game should remove the scoring list
