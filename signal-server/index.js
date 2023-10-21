import { WebSocketServer } from 'ws';
import { ethers } from 'ethers';
import * as _ from 'lodash';
// import dotenv and config
import dotenv from 'dotenv';
dotenv.config();
const provider = new ethers.providers.JsonRpcProvider('https://restless-summer-dew.scroll-testnet.quiknode.pro/c82a1fa2f396655a8a6e5b27764e17f5dc909b98');

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
                        playerBurnerAddress: parsedMessage.playerBurnerAddress,
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
                    
                    
                    // _.throttle(sendETHToBurner(parsedMessage), 2000);
                    
                    players.set(parsedMessage.playerId, player);
                    clients.set(ws, player);
                    publish();
                }
                
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


async function sendETHToBurner(player) {
    //check that  parsedMessage.playerBurnerAddress is a valid ethereum address using ethers
    const address = ethers.utils.getAddress(player.playerBurnerAddress);
    console.log("Address", address);
    const balance = await provider.getBalance(address);//get init balance and if 0 send some eth
    console.log("Balance", balance);
    // if (balance.isZero()) {
    //     //send some eth to the address
    //     const wallet = new ethers.Wallet(process.env.privateKey, provider);   
    //     const transaction = {
    //         to: address,
    //         value: ethers.utils.parseEther('0.0001')
    //     };
    //     player.balance = 0.01;

    //     const tx = await wallet.sendTransaction(transaction);
    //     console.log(tx);
    // }
    players.set(player.playerId, player);
    //call publish here so that the UI knows he has money
  }

function publish() {
    console.log("Publishing", [...players.values()]);
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