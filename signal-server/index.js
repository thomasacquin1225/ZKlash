import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const clients = new Map();

const player = {
    playerId: "", // init with the address of the user
    voted: false,
    latestRoundProof: "",
    zcreds: 0,
    xcreds: 0
}

function publish(data){
    console.log('Published ', JSON.stringify(data));
  
    [...clients.keys()].forEach((client) => {
      client.send(JSON.stringify(data));
    });
  }

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);
  clients.set(ws, metadata);
  ws.on('message', function message(data) {
    console.log('received: %s', data);
     
  });

  ws.send('something');
});

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }