#!/usr/bin/env node
import { Crs, Barretenberg, RawBuffer } from './index.js';
import createDebug from 'debug';
import { readFileSync, writeFileSync } from 'fs';
import { gunzipSync } from 'zlib';
import { Command } from 'commander';
import acvmInfoJson from './info.json' assert { type: 'json' };
createDebug.log = console.error.bind(console);
const debug = createDebug('bb.js');
// Maximum we support in node and the browser is 2^19.
// This is because both node and browser use barretenberg.wasm.
//
// This is not a restriction in the bb binary and one should be
// aware of this discrepancy, when creating proofs in bb versus
// creating the same proofs in the node CLI.
const MAX_CIRCUIT_SIZE = 2 ** 19;
function getBytecode(bytecodePath) {
    const encodedCircuit = readFileSync(bytecodePath);
    const decompressed = gunzipSync(encodedCircuit);
    return decompressed;
}
async function getGates(bytecodePath, api) {
    const { total } = await computeCircuitSize(bytecodePath, api);
    return total;
}
function getWitness(witnessPath) {
    const data = readFileSync(witnessPath);
    const decompressed = gunzipSync(data);
    return decompressed;
}
async function computeCircuitSize(bytecodePath, api) {
    debug(`computing circuit size...`);
    const bytecode = getBytecode(bytecodePath);
    const [exact, total, subgroup] = await api.acirGetCircuitSizes(bytecode);
    return { exact, total, subgroup };
}
async function init(bytecodePath, crsPath) {
    const api = await Barretenberg.new();
    const circuitSize = await getGates(bytecodePath, api);
    const subgroupSize = Math.pow(2, Math.ceil(Math.log2(circuitSize)));
    if (subgroupSize > MAX_CIRCUIT_SIZE) {
        throw new Error(`Circuit size of ${subgroupSize} exceeds max supported of ${MAX_CIRCUIT_SIZE}`);
    }
    debug(`circuit size: ${circuitSize}`);
    debug(`subgroup size: ${subgroupSize}`);
    debug('loading crs...');
    // Plus 1 needed! (Move +1 into Crs?)
    const crs = await Crs.new(subgroupSize + 1, crsPath);
    // Important to init slab allocator as first thing, to ensure maximum memory efficiency.
    await api.commonInitSlabAllocator(subgroupSize);
    // Load CRS into wasm global CRS state.
    // TODO: Make RawBuffer be default behavior, and have a specific Vector type for when wanting length prefixed.
    await api.srsInitSrs(new RawBuffer(crs.getG1Data()), crs.numPoints, new RawBuffer(crs.getG2Data()));
    const acirComposer = await api.acirNewAcirComposer(subgroupSize);
    return { api, acirComposer, circuitSize: subgroupSize };
}
async function initLite() {
    const api = await Barretenberg.new(1);
    // Plus 1 needed! (Move +1 into Crs?)
    const crs = await Crs.new(1);
    // Load CRS into wasm global CRS state.
    await api.srsInitSrs(new RawBuffer(crs.getG1Data()), crs.numPoints, new RawBuffer(crs.getG2Data()));
    const acirComposer = await api.acirNewAcirComposer(0);
    return { api, acirComposer };
}
export async function proveAndVerify(bytecodePath, witnessPath, crsPath, isRecursive) {
    const { api, acirComposer } = await init(bytecodePath, crsPath);
    try {
        debug(`creating proof...`);
        const bytecode = getBytecode(bytecodePath);
        const witness = getWitness(witnessPath);
        const proof = await api.acirCreateProof(acirComposer, bytecode, witness, isRecursive);
        debug(`verifying...`);
        const verified = await api.acirVerifyProof(acirComposer, proof, isRecursive);
        debug(`verified: ${verified}`);
        return verified;
    }
    finally {
        await api.destroy();
    }
}
export async function prove(bytecodePath, witnessPath, crsPath, isRecursive, outputPath) {
    const { api, acirComposer } = await init(bytecodePath, crsPath);
    try {
        debug(`creating proof...`);
        const bytecode = getBytecode(bytecodePath);
        const witness = getWitness(witnessPath);
        const proof = await api.acirCreateProof(acirComposer, bytecode, witness, isRecursive);
        debug(`done.`);
        if (outputPath === '-') {
            process.stdout.write(proof);
            debug(`proof written to stdout`);
        }
        else {
            writeFileSync(outputPath, proof);
            debug(`proof written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
export async function gateCount(bytecodePath) {
    const api = await Barretenberg.new(1);
    try {
        process.stdout.write(`${await getGates(bytecodePath, api)}`);
    }
    finally {
        await api.destroy();
    }
}
export function acvmInfo(outputPath) {
    const stringifiedJson = JSON.stringify(acvmInfoJson, null, 2);
    if (outputPath === '-') {
        process.stdout.write(stringifiedJson);
        debug(`info written to stdout`);
    }
    else {
        writeFileSync(outputPath, stringifiedJson);
        debug(`info written to: ${outputPath}`);
    }
}
export async function verify(proofPath, isRecursive, vkPath) {
    const { api, acirComposer } = await initLite();
    try {
        await api.acirLoadVerificationKey(acirComposer, new RawBuffer(readFileSync(vkPath)));
        const verified = await api.acirVerifyProof(acirComposer, readFileSync(proofPath), isRecursive);
        debug(`verified: ${verified}`);
        return verified;
    }
    finally {
        await api.destroy();
    }
}
export async function contract(outputPath, vkPath) {
    const { api, acirComposer } = await initLite();
    try {
        await api.acirLoadVerificationKey(acirComposer, new RawBuffer(readFileSync(vkPath)));
        const contract = await api.acirGetSolidityVerifier(acirComposer);
        if (outputPath === '-') {
            process.stdout.write(contract);
            debug(`contract written to stdout`);
        }
        else {
            writeFileSync(outputPath, contract);
            debug(`contract written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
export async function writeVk(bytecodePath, crsPath, outputPath) {
    const { api, acirComposer } = await init(bytecodePath, crsPath);
    try {
        debug('initing proving key...');
        const bytecode = getBytecode(bytecodePath);
        await api.acirInitProvingKey(acirComposer, bytecode);
        debug('initing verification key...');
        const vk = await api.acirGetVerificationKey(acirComposer);
        if (outputPath === '-') {
            process.stdout.write(vk);
            debug(`vk written to stdout`);
        }
        else {
            writeFileSync(outputPath, vk);
            debug(`vk written to: ${outputPath}`);
        }
    }
    finally {
        await api.destroy();
    }
}
export async function proofAsFields(proofPath, vkPath, outputPath) {
    const { api, acirComposer } = await initLite();
    try {
        debug('serializing proof byte array into field elements');
        const numPublicInputs = readFileSync(vkPath).readUint32BE(8);
        const proofAsFields = await api.acirSerializeProofIntoFields(acirComposer, readFileSync(proofPath), numPublicInputs);
        const jsonProofAsFields = JSON.stringify(proofAsFields.map(f => f.toString()));
        if (outputPath === '-') {
            process.stdout.write(jsonProofAsFields);
            debug(`proofAsFields written to stdout`);
        }
        else {
            writeFileSync(outputPath, jsonProofAsFields);
            debug(`proofAsFields written to: ${outputPath}`);
        }
        debug('done.');
    }
    finally {
        await api.destroy();
    }
}
export async function vkAsFields(vkPath, vkeyOutputPath) {
    const { api, acirComposer } = await initLite();
    try {
        debug('serializing vk byte array into field elements');
        await api.acirLoadVerificationKey(acirComposer, new RawBuffer(readFileSync(vkPath)));
        const [vkAsFields, vkHash] = await api.acirSerializeVerificationKeyIntoFields(acirComposer);
        const output = [vkHash, ...vkAsFields].map(f => f.toString());
        const jsonVKAsFields = JSON.stringify(output);
        if (vkeyOutputPath === '-') {
            process.stdout.write(jsonVKAsFields);
            debug(`vkAsFields written to stdout`);
        }
        else {
            writeFileSync(vkeyOutputPath, jsonVKAsFields);
            debug(`vkAsFields written to: ${vkeyOutputPath}`);
        }
        debug('done.');
    }
    finally {
        await api.destroy();
    }
}
const program = new Command();
program.option('-v, --verbose', 'enable verbose logging', false);
program.option('-c, --crs-path <path>', 'set crs path', './crs');
function handleGlobalOptions() {
    if (program.opts().verbose) {
        createDebug.enable('bb.js*');
    }
}
program
    .command('prove_and_verify')
    .description('Generate a proof and verify it. Process exits with success or failure code.')
    .option('-b, --bytecode-path <path>', 'Specify the bytecode path', './target/acir.gz')
    .option('-w, --witness-path <path>', 'Specify the witness path', './target/witness.gz')
    .option('-r, --recursive', 'prove and verify using recursive prover and verifier', false)
    .action(async ({ bytecodePath, witnessPath, recursive, crsPath }) => {
    handleGlobalOptions();
    const result = await proveAndVerify(bytecodePath, witnessPath, crsPath, recursive);
    process.exit(result ? 0 : 1);
});
program
    .command('prove')
    .description('Generate a proof and write it to a file.')
    .option('-b, --bytecode-path <path>', 'Specify the bytecode path', './target/acir.gz')
    .option('-w, --witness-path <path>', 'Specify the witness path', './target/witness.gz')
    .option('-r, --recursive', 'prove using recursive prover', false)
    .option('-o, --output-path <path>', 'Specify the proof output path', './proofs/proof')
    .action(async ({ bytecodePath, witnessPath, recursive, outputPath, crsPath }) => {
    handleGlobalOptions();
    await prove(bytecodePath, witnessPath, crsPath, recursive, outputPath);
});
program
    .command('gates')
    .description('Print gate count to standard output.')
    .option('-b, --bytecode-path <path>', 'Specify the bytecode path', './target/acir.gz')
    .action(async ({ bytecodePath: bytecodePath }) => {
    handleGlobalOptions();
    await gateCount(bytecodePath);
});
program
    .command('verify')
    .description('Verify a proof. Process exists with success or failure code.')
    .requiredOption('-p, --proof-path <path>', 'Specify the path to the proof')
    .option('-r, --recursive', 'prove using recursive prover', false)
    .requiredOption('-k, --vk <path>', 'path to a verification key. avoids recomputation.')
    .action(async ({ proofPath, recursive, vk }) => {
    handleGlobalOptions();
    const result = await verify(proofPath, recursive, vk);
    process.exit(result ? 0 : 1);
});
program
    .command('contract')
    .description('Output solidity verification key contract.')
    .option('-b, --bytecode-path <path>', 'Specify the bytecode path', './target/acir.gz')
    .option('-o, --output-path <path>', 'Specify the path to write the contract', './target/contract.sol')
    .requiredOption('-k, --vk-path <path>', 'Path to a verification key. avoids recomputation.')
    .action(async ({ outputPath, vkPath }) => {
    handleGlobalOptions();
    await contract(outputPath, vkPath);
});
program
    .command('write_vk')
    .description('Output verification key.')
    .option('-b, --bytecode-path <path>', 'Specify the bytecode path', './target/acir.gz')
    .requiredOption('-o, --output-path <path>', 'Specify the path to write the key')
    .action(async ({ bytecodePath, outputPath, crsPath }) => {
    handleGlobalOptions();
    await writeVk(bytecodePath, crsPath, outputPath);
});
program
    .command('proof_as_fields')
    .description('Return the proof as fields elements')
    .requiredOption('-p, --proof-path <path>', 'Specify the proof path')
    .requiredOption('-k, --vk-path <path>', 'Path to verification key.')
    .requiredOption('-o, --output-path <path>', 'Specify the JSON path to write the proof fields')
    .action(async ({ proofPath, vkPath, outputPath }) => {
    handleGlobalOptions();
    await proofAsFields(proofPath, vkPath, outputPath);
});
program
    .command('vk_as_fields')
    .description('Return the verification key represented as fields elements. Also return the verification key hash.')
    .requiredOption('-k, --vk-path <path>', 'Path to verification key.')
    .requiredOption('-o, --output-path <path>', 'Specify the JSON path to write the verification key fields and key hash')
    .action(async ({ vkPath, outputPath }) => {
    handleGlobalOptions();
    await vkAsFields(vkPath, outputPath);
});
program
    .command('info')
    .description('Return ACVM related metadata about the backend')
    .requiredOption('-o, --output-path <path>', 'Specify the path to write the JSON information to')
    .action(({ outputPath }) => {
    handleGlobalOptions();
    acvmInfo(outputPath);
});
program.name('bb.js').parse(process.argv);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxPQUFPLEVBQUUsR0FBRyxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFDMUQsT0FBTyxXQUFXLE1BQU0sT0FBTyxDQUFDO0FBQ2hDLE9BQU8sRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLE1BQU0sSUFBSSxDQUFDO0FBQ2pELE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDbEMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLFlBQVksTUFBTSxhQUFhLENBQUMsU0FBUyxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUM7QUFDL0QsV0FBVyxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM5QyxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFbkMsc0RBQXNEO0FBQ3RELCtEQUErRDtBQUMvRCxFQUFFO0FBQ0YsK0RBQStEO0FBQy9ELCtEQUErRDtBQUMvRCw0Q0FBNEM7QUFDNUMsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO0FBRWpDLFNBQVMsV0FBVyxDQUFDLFlBQW9CO0lBQ3ZDLE1BQU0sY0FBYyxHQUFHLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNsRCxNQUFNLFlBQVksR0FBRyxVQUFVLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDaEQsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQztBQUVELEtBQUssVUFBVSxRQUFRLENBQUMsWUFBb0IsRUFBRSxHQUFpQjtJQUM3RCxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDOUQsT0FBTyxL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