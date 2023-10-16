import { WebSocketServer } from 'ws';

let response

const wss = new WebSocketServer({ port: 8080 });
const clients = new Map();
const players = new Map();
console.log("Server started on port 8080");
wss.on('connection', function connection(ws) {

    // const player2 = {
    //     playerId: "0xxxxxx3wqweqweqwe", // init with the address of the user
    //     voted: false,
    //     latestRoundProof: "",
    //     zcreds: 0,
    //     xcreds: 0,
    //     victories: 0,
    //     losses: 0,
    //     nfts: [],
    //     isGhostMode: true,
    //     latestTimestamp: new Date().getTime()
    // }
    // ws.send(JSON.stringify([player, player2 ]));
    // 
    console.log("Got a connection!");

    //broadcast info to everyone
    // publish();
    ws.on("close", () => {
        clients.delete(ws);
        console.log("Lost a connection!");

    });
    ws.on('error', console.error);
    ws.on('message', function message(data) {
        const message = data.toString('utf-8');
        console.log('received:', message);
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.type === 'start') {
                

                const player = clients.get(ws);
                if (!player && parsedMessage.playerId != "0") {
                    const player = {
                        playerId: parsedMessage.playerId, // init with the address of the user
                        voted: true,
                        latestRoundProof: "",
                        zcreds: 0,
                        xcreds: 0,
                        victories: 0,
                        losses: 0,
                        nfts: [],
                        isGhostMode: true,
                        latestTimestamp: new Date().getTime()
                    }
                    console.log("Setting Players!", parsedMessage.playerId, player);
                    players.set(parsedMessage.playerId, player);
                    clients.set(ws, player);
                }
                
                publish();
            }
            if (parsedMessage.type === 'vote') {
                const player = clients.get(ws);
                // TODO: trigger the zkVote
                // TODO: integrate next id for sybil protection
                player.voted = true;
                player.latestTimestamp = new Date().getTime();
                publish();
            }
            if (parsedMessage.type === 'convertToPlayer') {
                const player = clients.get(ws);
                player.isGhostMode = false;
                player.latestTimestamp = new Date().getTime();
                publish();
            }
        } catch (e) {
            console.error(e);
        }
    });
});

function publish() {
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