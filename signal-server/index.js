import { WebSocketServer } from 'ws';
import { ethers } from 'ethers';
import * as _ from 'lodash';
import { MerkleTree } from 'merkletreejs';
import sha256  from 'crypto-js/sha256.js';

import dotenv from 'dotenv';
dotenv.config();
const provider = new ethers.providers.JsonRpcProvider('https://restless-summer-dew.scroll-testnet.quiknode.pro/c82a1fa2f396655a8a6e5b27764e17f5dc909b98/');

let response

const wss = new WebSocketServer({ port: 8080 });
const clients = new Map();
const players = new Map();
const voteProofs = [];
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
    ws.on('message', async function message(data) {
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
                    
                    
                    
                    players.set(parsedMessage.playerId, player);
                    clients.set(ws, player);
                    publish();
                    _.throttle(sendETHToBurner(parsedMessage), 2000);

                }
                
            }
            if (parsedMessage.type === 'vote') {
                // TODO: trigger the zkVote
                // Here for each player add voteResultProof to the merkle tree
                voteProofs.push(Object.values(parsedMessage.proof).join(''));
                if(voteProofs.length === 2) {//wait for 2 people to vote
                    //publish the proof to the smart contract
                    const tree = new MerkleTree(voteProofs, sha256);
                    const root = tree.getRoot().toString('hex');
                    console.log("Merke Root to publish", root)
                    //call a method to publish the root to the smart contract
                    await emitRootForRound('0x'+root, _.round(new Date().getTime() / 1000));
                }
                publish();
            }
        } catch (e) {
            console.error(e);
        }
    });
});

async function emitRootForRound(root, round) {
    //call a method to publish the root to the smart contract
    const wallet = new ethers.Wallet(process.env.privateKey, provider); 
    let abiObj = [{
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "roundMerkleRootHash",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "roundNumber",
            "type": "uint256"
          }
        ],
        "name": "saveRoundResult",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }];  

    const contract = new ethers.Contract(process.env.contractAddress, abiObj, wallet);
    const tx = await contract.saveRoundResult(root, round);
    console.log(tx);
}

// async function main(){
//     await emitRootForRound("0x7892a8387c952fc94c95f6516417b36c189f8b7a4cc7453ee41f357c961fe950", 0);
// };

// main();

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
    //         value: ethers.utils.parseEther('0.0002')
    //     };
    //     player.balance = 0.001;

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