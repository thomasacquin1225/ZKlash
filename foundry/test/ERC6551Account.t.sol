// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "../src/ERC6551Account.sol";
import "../src/LunarMissNFT.sol";
import "../src/ERC6551Registry.sol";

contract ERC6551AccountTest is Test {
    ZKlashERC6551Account public erc6551Account;
    LunarMiss public lunarMissNFT;
    ERC6551Registry public erc6551Registry;
    address bob = address(0x1337);

    function setUp() public {
        erc6551Account = new ZKlashERC6551Account();
        lunarMissNFT = new LunarMiss(bob);
        erc6551Registry = new ERC6551Registry();
    }

    function testCreateNFT() public {
        vm.startPrank(bob);
        lunarMissNFT.safeMint(address(1337));
        vm.stopPrank();
        uint256 balanceOf1337 = lunarMissNFT.balanceOf(address(1337));
        assertEq(balanceOf1337, 1);
    }

    //test out the ideal flow for ERC6551

    //test out the flow of passing the NFT to the account and then to another user
}
