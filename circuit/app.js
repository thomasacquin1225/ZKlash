import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir, generateWitness  } from '@noir-lang/noir_js';
import circuit from './target/zklash.json'  assert { type: 'json' };
import { ethers } from 'ethers';

const ws = new WebSocket("ws://localhost:8080")

async function zkVote(hashed_message, pub_key_x, pub_key_y, signature) {
    const backend = new BarretenbergBackend(circuit,8);
    const noir = new Noir(circuit, backend);

    display('logs', 'zklash- Init... ⌛');
    await noir.init();
    display('logs', 'zklash- Init... ✅');
    const input = { pub_key_x:Object.values(pub_key_x), pub_key_y:Object.values(pub_key_y), hashed_message: Object.values(hashed_message), signature: Object.values(signature)  };
    display('logs', 'zklash- Generating proof... ⌛', input );
    const voteWitness = await generateWitness(circuit, input);
    const proof = await backend.generateIntermediateProof(voteWitness);
    // this proof needs to be send back to the socket server to store in merkle tree an onwards into the contract
    display('logs', 'zklash- Generating proof... ✅');
    display('zklash- proof - ', proof);
    ws.send(JSON.stringify({type: 'vote', proof: proof}));
  };
  
  function display(container, msg) {
    console.log(container,  "  -  ", msg); 
  }
  function checkLocalStorage() {
    setInterval(async () => {
      const vote = parseInt(localStorage.getItem('vote'));
      // console.log("vote check - ", vote);  
      const privateKey = localStorage.getItem('privateKey');
      
      if (vote) {
        const hashed_message = ethers.utils.arrayify(ethers.utils.hashMessage(vote.toString()));
        const public_key_compressed = ethers.utils.computePublicKey(privateKey);
        const public_key =  (public_key_compressed.slice(4));
        let pub_key_x = ethers.utils.arrayify('0x'+public_key.substring(0, 64));
        console.log("zklash- public key x coordinate 📊: ", pub_key_x);

        let pub_key_y = ethers.utils.arrayify('0x'+public_key.substring(64));
        console.log("zklash- public key y coordinate 📊: ", pub_key_y);
        const sender = new ethers.Wallet(privateKey);
        const sig = await sender.signMessage(vote.toString());
        const signature = ethers.utils.arrayify(sig.slice(0,-2));
        //remove the vote so that it does not keep at it
        localStorage.removeItem('vote');  

        await zkVote(hashed_message, pub_key_x, pub_key_y, signature);
      }
    }, 3000);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    checkLocalStorage();
  });