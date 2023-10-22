// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

//TODO: Based on verify logic decide winner and allow tokenonmics

interface IVerifier {
    function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view returns (bool);
}


contract ZKlashMain is AccessControl {
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");
    uint256 public nextRoundNumber;
    IVerifier public verifier;

    struct RoundState {
        uint256 roundNumber;
        uint256 NFT_A_tokenId;
        uint256 NFT_B_tokenId;
        address NFT_A_contract;
        address NFT_B_contract;
        address[] players;
    }

    struct RoundResult {
        uint256 roundNumber;
        bytes32 roundMerkleRootHash; // hash of the merkle root of the round, each leaf is a player's proof commitment
    }

    RoundState[] public roundStates;
    RoundResult[] public roundResults;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SETTER_ROLE, msg.sender);
    }

    function saveRoundState(
        uint256 NFT_A_tokenId,
        uint256 NFT_B_tokenId,
        address NFT_A_contract,
        address NFT_B_contract,
        address[] memory players
    ) 
        external 
        onlyRole(SETTER_ROLE)
    {
        uint256 roundNumber = nextRoundNumber++;
        roundStates.push(
            RoundState(
                roundNumber,
                NFT_A_tokenId,
                NFT_B_tokenId,
                NFT_A_contract,
                NFT_B_contract,
                players
            )
        );
    }

    function saveRoundResult(
        bytes32 roundMerkleRootHash,
        uint256 roundNumber
    ) 
        external 
        onlyRole(SETTER_ROLE)
    {
        roundResults.push(
            RoundResult(
                roundNumber,
                roundMerkleRootHash
            )
        );
    }

    function setVerifier(address _verifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        verifier = IVerifier(_verifier);
    }

    function getRoundState(uint256 roundNumber) 
        external 
        view 
        returns (RoundState memory) 
    {
        return roundStates[roundNumber];
    }
}
