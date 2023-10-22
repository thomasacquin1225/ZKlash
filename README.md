# ZKlash

## Introduction

<p align="center">
    <img src="./art_assets/zklogo_hd_logo.png" alt="ZKlash Logo" width="10%">
</p>

Welcome to ZK-NFT-Clash, a game made during the ethglobal online hackathon, using zero knowledge, and Keynesian beauty contest! In this game, you will compete against other players in a clash of wits and strategy, using your NFTs and zero knowledge proofs to outsmart your opponents and emerge victorious.

Zero knowledge proofs ensure that your moves and strategies remain hidden from prying eyes. And with the Keynesian beauty contest mechanic, you'll need to not only outsmart your opponents, but also predict what they will do and choose the most popular move to win.

APE and get rewareded with APECOINS!

### An outlay of the economy and voting results - 



| Action  | Group     | NFT A | NFT B | Winner    | System                           |
|-------|-------|-------|-----------|-----------------------------------|----------------------------------|
| CASE SAME VOTE | GP    | 20    | 10    | GP (20)    | +X Credits    | ZKlash loses    |
|       | GV    | 2    | 0    | GV(2)    | No Change, -ZKlash fee    | NA    |
| CASE DIFFERENT VOTE | GP    | 20    | 10    | GP (20)    | +X Credits    | ZKlash loses    |
|       | GV    | 0    | 2    | GV(2)    | -Y Credits    | ZKlash wins    |
| CASE SAME VOTE | GP    | 20    | 10    | GP (20)    | +X Credits    | ZKlash loses    |
|       | GV    | 1    | 1    | <GV(1), GV(1)>    | +1 Credits, -1 Credits, -ZKlash fee    | NA    |
| CASE DIFFERENT VOTE | GP    | 20    | 10    | GP (20)    | +X Credits    | ZKlash loses    |
|       | GV    | 0    | 2    | GV(2)    | +Y Credits, -Y Credits    | ZKlash wins    |

## Next steps


- [x] Basic Game theme and UI
- [x] Socket backend
- [x] Basic Noir prover
- [x] Basic state contracts
- [x] Noir usage via JS 
- [x] Noir js integrate with gamemaker
- [x] Integrated contracts
- [ ] Game mechanics via payments  
- [x] Integrate 6551



## Training Wheels
1. We will use a backend in the beginning to signal for websockets and also to save state to the chain.
2. The training wheels can come off by allowing it to be a safe module that can write the contract state via AA. The safe can be managed by the community using oSnap from UMA.

## Aztec Noir
- [x] We used Aztec noir to allow our players to vote and save proofs to our backend
- [x] The proofs are then stored on a merkle tree
- [x] The user then reveals their vote
- [ ] The revealed data gets verified with the hashed message on chain [Incomplete], this then allows to decide the winner and claims

## Usage of ERC6551 - APECOIN
We intend to use ERC6551 for the following purpose to make the game more easier - 
- [x] We will create a new NFT per game 
- [x] We will create an account with that NFT and the winnings will be issued to the NFT
- [x] We will transfer that at the end of the round to the original owner

## Scroll

We used scroll to test coz of the low fees. 

Lunar Miss NFT-> 0xd41c1f831fea7d1953fe8d66225143540d200dbd
ERC6551 Wallet and ACCOUNT contract - 

Use the above to mint NFT's on the fly by burner wallets, which in turn are converted to accounts via the ERC6551 accounts. Then neatly transfer the NFT to metamask signer at end of the game.

Sample Transactions to show the flow - 
1. 

ZKlashContract - 0xad525a40760ccf35c3768008964f3668dd278e5c

forge create --rpc-url https://restless-summer-dew.scroll-testnet.quiknode.pro/c82a1fa2f396655a8a6e5b27764e17f5dc909b98/  --private-key   src/ZKlashMain.sol:ZKlashMain --constructor-args "0xd182167e45625a3D57583EC15D870274e63B8A2c" --verifier-url https://sepolia.scrollscan.dev/api --verify --verifier etherscan --legacy --etherscan-api-key YHKTBJTDRDXGQ55HPGK69Z83PDZY24HE2Z

forge create --rpc-url https://restless-summer-dew.scroll-testnet.quiknode.pro/c82a1fa2f396655a8a6e5b27764e17f5dc909b98/  --private-key   src/ERC6551Account.sol:ZKlashERC6551Account --constructor-args "0xd182167e45625a3D57583EC15D870274e63B8A2c" --verifier-url https://sepolia.scrollscan.dev/api --verify --verifier etherscan --legacy --etherscan-api-key YHKTBJTDRDXGQ55HPGK69Z83PDZY24HE2Z


forge verify-contract 0xd41C1F831FEa7d1953fE8d66225143540d200DBd src/LunarMissNFT.sol:LunarMiss --chain-id 534351 --verifier-url https://sepolia-blockscout.scroll.io/api\? --verifier blockscout
forge verify-contract 0xad525a40760ccf35c3768008964f3668dd278e5c src/ZKlashMain.sol:ZKlashMain --chain-id 534351 --verifier-url https://sepolia-blockscout.scroll.io/api\? --verifier blockscout

The following verification failed - 

forge verify-contract \
--watch \
--num-of-optimizations 200 \    --constructor-args  $(cast abi-encode "constructor(address)" 0xd182167e45625a3D57583EC15D870274e63B8A2c) \  
--verifier etherscan \
--verifier-url https://api-sepolia.scrollscan.dev/api \
--compiler-version v0.8.20+commit.a1b79de6 \
0xd41C1F831FEa7d1953fE8d66225143540d200DBd \
LunarMiss \
YHKTBJTDRDXGQ55HPGK69Z83PDZY24HE2Z

forge verify-contract \
    --num-of-optimizations 200 \
    --watch \
    --constructor-args  $(cast abi-encode "constructor(uint256)" 100000) \
    --verifier etherscan \
    --verifier-url https://api-sepolia.scrollscan.dev/api \
    --compiler-version v0.8.20+commit.a1b79de6 \
    0xad525a40760ccf35c3768008964f3668dd278e5c \
    ZKlashMain \
    YHKTBJTDRDXGQ55HPGK69Z83PDZY24HE2Z
