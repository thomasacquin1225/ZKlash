import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir, generateWitness  } from '@noir-lang/noir_js';
import circuit from './target/circuit.json'  assert { type: 'json' };

document.addEventListener('DOMContentLoaded', async () => {
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
  });
  
  function display(container, msg) {
    const c = document.getElementById(container);
    const p = document.createElement('p');
    p.textContent = msg;
    c.appendChild(p);
  }