import requests;
import json;
import time;

uri = 'https://jaymspeights.com/BotBall/';

# Creates a game and stores the game_id
gid = requests.get(uri+'create').json()['game_id'];

# Join the game and stores the player_id
pid = requests.get(uri+'join?game='+gid).json()['player_id'];

# Adds another player to start the game
requests.get(uri+'join?game='+gid);

# Gets the state of the game to see time until it starts
state = requests.get(uri+'state?game='+gid).json();
start_time = float(state['game']['start_time'])/1000;
current_time = time.time();

# Sleeps until the game has started
while True:
    state = requests.get(uri+'state?game='+gid).json();
    start_time = int(state['game']['start_time']);
    current_time = int(state['game']['current_time']);
    if start_time is None:
        time.sleep(3);
        continue;
    time.sleep((start_time - current_time)/1000);
    break;

def move(dir):
    print(requests.get(uri+'move?game='+gid+'&player='+pid+'&dir='+dir).text);

move('SE');
move('E');
move('E');
move('E');
move('NE');
move('NE');
move('NE');
move('NE');
move('SE');

print (requests.get(uri+'state?game='+gid).text);
