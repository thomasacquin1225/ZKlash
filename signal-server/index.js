import { WebSocketServer } from 'ws';

let response

const wss = new WebSocketServer({ port: 8080 });
const clients = new Map();
const players = new Map();

wss.on('connection', function connection(ws) {
    const player = {
        playerId: "", // init with the address of the user
        voted: false,
        latestRoundProof: "",
        zcreds: 0,
        xcreds: 0,
        victories: 0,
        losses: 0,
        nfts: [],
        isGhostMode: true,
        latestTimestamp: new Date().getTime()
    }
    ws.send("Help there");
    clients.set(ws, player);
    console.log("Got a connection!");

    //broadcast info to everyone
    // publish();
    ws.on("close", () => {
        clients.delete(ws);
        console.log("Lost a connection!");

    });
    ws.on('error', console.error);
    ws.on('message', function message(data) {
        console.log('received: %s', data);
        try {
        const message = JSON.parse(data);
        if (message.type === 'start') {
            const player = clients.get(ws);
            if (!player) {
                players.set(message.address, player);
            }
            player.latestTimestamp = new Date().getTime();
            publish();
        }
        if (message.type === 'vote') {
            const player = clients.get(ws);
            // TODO: trigger the zkVote
            // TODO: integrate next id for sybil protection
            player.voted = true;
            player.latestTimestamp = new Date().getTime();
            publish();
        }
        if (message.type === 'convertToPlayer') {
            const player = clients.get(ws);
            player.isGhostMode = false;
            player.latestTimestamp = new Date().getTime();
            publish();
        }
    }
    catch (e) {
        console.log(e); // error in the above string (in this case, yes)!       
    }
    });
});

function publish() {

    console.log('Published ', JSON.stringify([...players.values()]));

    [...clients.keys()].forEach((client) => {
        client.send(JSON.stringify([...players.values()]));
    });
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}