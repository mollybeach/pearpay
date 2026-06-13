// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../PearPayEscrow.sol";

interface Vm {
    function envUint(string calldata key) external view returns (uint256);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract DeployPearPayEscrow {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (PearPayEscrow deployed) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        deployed = new PearPayEscrow();
        vm.stopBroadcast();
    }
}
