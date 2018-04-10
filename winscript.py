import requests;
import json;
import time;

gid = requests.get('https://jaymspeights.com/BotBall/create').json()['game_id'];

pid = requests.get('https://jaymspeights.com/BotBall/join?game='+gid).json()['player_id'];

# adds another player to start the game
requests.get('https://jaymspeights.com/BotBall/join?game='+gid);

start_time = requests.get('https://jaymspeights.com/BotBall/state?game='+gid).json()['game']['start_time'];

current_time = time.time()*1000;

time.sleep(start_time-current_time);

requests.get('https://jaymspeights.com/BotBall/move?game='+gid+'&player='+pid+'&dir=E');
requests.get('https://jaymspeights.com/BotBall/move?game='+gid+'&player='+pid+'&dir=E');
requests.get('https://jaymspeights.com/BotBall/move?game='+gid+'&player='+pid+'&dir=E');
requests.get('https://jaymspeights.com/BotBall/move?game='+gid+'&player='+pid+'&dir=E');
requests.get('https://jaymspeights.com/BotBall/move?game='+gid+'&player='+pid+'&dir=E');
requests.get('https://jaymspeights.com/BotBall/move?game='+gid+'&player='+pid+'&dir=NE');
requests.get('https://jaymspeights.com/BotBall/move?game='+gid+'&player='+pid+'&dir=SE');
requests.get('https://jaymspeights.com/BotBall/move?game='+gid+'&player='+pid+'&dir=SE');
requests.get('https://jaymspeights.com/BotBall/move?game='+gid+'&player='+pid+'&dir=S');
requests.get('https://jaymspeights.com/BotBall/move?game='+gid+'&player='+pid+'&dir=S');
requests.get('https://jaymspeights.com/BotBall/move?game='+gid+'&player='+pid+'&dir=NE');
