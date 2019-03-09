# Connect 4 II: The Revenge-- Joshua Rodstein

Name: Joshua L. Rodstein
Pitt ID: 4021607

## Installation

1. Run `pip install -r requirements.txt` in a Python 3.7+ virtual environment
2. Set the `FLASK_APP=connect4.py` environment variable and run `flask devinit`
3. Run `flask run` and navigate to `localhost:5000`

## Deploy w/ Docker

 **Build**
 
```docker build -t connect-four-restful:latest .```

**Run**

```docker run -it -d -p 5000:5000 connect-four-restful:latest```





# Defects Report 

1. Ghost clicks, and state conflict 
    - Occasioanlly(very rarely) after a click, the board will self populate and change turn on its own 
    - this only happens with data created witj 'devinit' cli command... and typically only with tow and twaits 
    
    Caveat: 
        - when players and games are created through UI, problem does not occur. 
        - perhaps has to do with timeouts? 
    