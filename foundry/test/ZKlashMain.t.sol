// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ZKlashMain.sol";

contract ZKlashTest is Test {
    ZKlashMain public zklashMain;

    function setUp() public {
        zklashMain = new ZKlashMain();
    }
}
