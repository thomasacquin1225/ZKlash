import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir, generateWitness  } from '@noir-lang/noir_js';
import circuit from './target/circuit.json'  assert { type: 'json' };

async function zkVote() {
    const backend = new BarretenbergBackend(circuit,8);
    const noir = new Noir(circuit, backend);

    display('logs', 'Init... ⌛');
    await noir.init();
    display('logs', 'Init... ✅');
    const input = { x: 1, y: 2 };
    display('logs', 'Generating proof... ⌛');
    const voteWitness = await generateWitness(circuit, input);
    const proof = await backend.generateIntermediateProof(voteWitness);
    display('logs', 'Generating proof... ✅');
    display('results', proof);
    display('logs', 'Verifying proof... ⌛');
    const verification = await noir.verifyFinalProof(proof);
    if (verification) display('logs', 'Verifying proof... ✅');
  };
  
  function display(container, msg) {
    console.log(container,  "  -  ", msg); 
  }
  function checkLocalStorage() {
    setInterval(async () => {
      const vote = parseInt(localStorage.getItem('vote'));
      
      if (vote) {
        await zkVote();
        //delete the item from localstorage
        localStorage.removeItem('vote');  
      }
    }, 3000);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    checkLocalStorage();
  });