// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "../src/ERC6551Account.sol";
import "../src/LunarMissNFT.sol";
import "erc6551/ERC6551Registry.sol";

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
        lunarMissNFT.safeMint(address(0x13));
        vm.stopPrank();
        uint256 balanceOf1337 = lunarMissNFT.balanceOf(address(0x13));
        assertEq(balanceOf1337, 1);
    }

    //test out the ideal flow for ERC6551
    function testCreateAccountForNFT() public {
        vm.startPrank(bob);
        lunarMissNFT.safeMint(vm.addr(1));
        vm.stopPrank();

        address account =
            erc6551Registry.createAccount(address(erc6551Account), 0, block.chainid, address(lunarMissNFT), 0);

        assertTrue(account != address(0));
        //copied over from the erc6551 test to check that our implementation also works
        IERC6551Account accountInstance = IERC6551Account(payable(account));
        IERC6551Executable executableAccountInstance = IERC6551Executable(account);

        assertEq(
            accountInstance.isValidSigner(vm.addr(1), ""), IERC6551Account.isValidSigner.selector
        );

        vm.deal(account, 1 ether);

        vm.prank(vm.addr(1));
        executableAccountInstance.execute(payable(vm.addr(2)), 0.5 ether, "", 0);

        assertEq(account.balance, 0.5 ether);
        assertEq(vm.addr(2).balance, 0.5 ether);
        assertEq(accountInstance.state(), 1);

    }

    //test out the flow of passing the NFT to the account and then to another user
    function testTransferAccountForNFT() public {
        vm.startPrank(bob);
        lunarMissNFT.safeMint(vm.addr(1));
        vm.stopPrank();

        address account =
            erc6551Registry.createAccount(address(erc6551Account), 0, block.chainid, address(lunarMissNFT), 0);

        assertTrue(account != address(0));
        //copied over from the erc6551 test to check that our implementation also works
        IERC6551Account accountInstance = IERC6551Account(payable(account));
        IERC6551Executable executableAccountInstance = IERC6551Executable(account);
        vm.prank(vm.addr(1));
        lunarMissNFT.approve(vm.addr(2), 0);

        //transfer ownership to another user
        vm.prank(vm.addr(1));
        lunarMissNFT.transferFrom(vm.addr(1), vm.addr(2), 0);

        vm.deal(account, 1 ether);

        vm.startPrank(vm.addr(2));

        assertEq(
            accountInstance.isValidSigner(vm.addr(2), ""), IERC6551Account.isValidSigner.selector
        );


        executableAccountInstance.execute(payable(vm.addr(3)), 0.5 ether, "", 0);

        assertEq(account.balance, 0.5 ether);
        assertEq(vm.addr(3).balance, 0.5 ether);
        assertEq(accountInstance.state(), 1);

    }

}
