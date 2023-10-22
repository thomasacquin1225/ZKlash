// See if Metamask is installed in the browser
web3 = "";
let web3jsSf;
let metaMaskSigner;
let userAddress = "";
let burnerWallet;
let oldData = {};
let _gmlinMainRoom = false;



async function setVote(voteParam) {
	var map = {};
	map["id"] = "voted";
	map["voteParam"] = "";
	// const scrollQnProvider = new ethers.providers.JsonRpcProvider('https://restless-summer-dew.scroll-testnet.quiknode.pro/c82a1fa2f396655a8a6e5b27764e17f5dc909b98/');

	// const contractAddress = '0xd41c1f831fea7d1953fe8d66225143540d200dbd';
	// const signer = new ethers.Wallet(burnerWallet.privateKey, scrollQnProvider);
	// ERC721 ABI
	const abi = [
	// ERC721
	{
		"inputs": [
		  {
			"internalType": "address",
			"name": "to",
			"type": "address"
		  }
		],
		"name": "safeMint",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	  }
	];
	// const contract = new ethers.Contract(contractAddress, abi, signer);
	console.log(`Minting NFT ... ${burnerWallet}`);
	console.log(`Voting for ... ${voteParam}`);

	

	// const tx = await contract.safeMint(burnerWallet.address);
	if(localStorage){
		localStorage.setItem('vote', voteParam)
		// .then(function (value) {
		// // Do other things once the value has been saved.
		// // console.log(value, "set in db",JSON.parse(data).data.arbos[0]);
		// // map["data"] = JSON.stringify(data.data);

		// GMS_API.send_async_event_social(map);

		// }).catch(function(err) {
		// // This code runs if there were any errors
		// console.log(err);
		// });
	}

}


function getGardeners() {
	var map = {};
	localforage.getItem('arbo_lf', data).then(function (value) {
    // Do other things once the value has been saved.
    console.log(value, "set in db");
		map["arbo"] = data;
		GMS_API.send_async_event_social(map);

}).catch(function(err) {
    // This code runs if there were any errors
    console.log(err);
});
}

function inMainRoom() {
	_gmlinMainRoom = true;
}

function checkMetaConnection() {
	if (typeof window.ethereum !== 'undefined') {
		return 1;
	} else {
		return 0;
	}
}

// Ask user to connect wallet to site and get address
async function getMetamaskAccount() {
	var map = {};
	map["id"] = "getWalletAddress";
	map["address"]="0";
	map["burnerAddress"]="0";

	try {
	  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
		map["address"] = accounts[0];
		userAddress = accounts[0];
		web3 = new Web3(window.ethereum);
		// console.log(web3);
		burnerWallet = ethers.Wallet.createRandom();
		map["burnerAddress"] = burnerWallet.address;
		console.log("User's Real address - ", map["address"]);
		console.log("User's Burner address - ", map["burnerAddress"]);
		// set the provider for the wallet

	//   web3jsSf = await sdkCore.Framework.create({
	// 		chainId: 534351, //note, you can also use provider.getChainId() to get the active chainId
	// 		provider: web3
	// 	});
		
		const metamaskProvider = new ethers.providers.Web3Provider(window.ethereum);
	//	scrollQnProvider
	//   metaMaskSigner = web3jsSf.createSigner({ web3Provider: metamaskProvider });
	// 	console.log(web3jsSf, metaMaskSigner);

		
	} catch(error) {
		console.log("User rejected request", error);
	}
	GMS_API.send_async_event_social(map);
}


async function getTokenBalance(wallet_address, token_address) {

	// Default structure of ERC20 smart contract
	let minABI = [
	  // balanceOf
	  {
	    "constant":true,
	    "inputs":[{"name":"_owner","type":"address"}],
	    "name":"balanceOf",
	    "outputs":[{"name":"balance","type":"uint256"}],
	    "type":"function"
	  },
	  // decimals
	  {
	    "constant":true,
	    "inputs":[],
	    "name":"decimals",
	    "outputs":[{"name":"","type":"uint8"}],
	    "type":"function"
	  }
	];

	var map = {};
	map["id"] = "getTokenBalance";
	map["balance"]="-1";

	let contract = new web3.eth.Contract(minABI, token_address);
	console.log(contract);

	try {

		const balance = await contract.methods.balanceOf(wallet_address).call();
		const decimalPlaces = await contract.methods.decimals().call(); // 8
		let newBalance = 0;
		
		if (decimalPlaces) {
			newBalance = balance / (10 ** decimalPlaces);
		}

		console.log(balance);
		console.log(decimalPlaces);
		console.log(newBalance);

		map["balance"] = newBalance;

	} catch(error) {
		console.log(error);
	}

	GMS_API.send_async_event_social(map);
}

















