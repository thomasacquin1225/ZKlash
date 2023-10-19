// See if Metamask is installed in the browser
web3 = "";
let web3jsSf;
let metaMaskSigner;
let ARBO = "0xaa19610D44b7EF574FAeEcA5e1a77d4bb7d8b8C2";
let userAddress = "";
let oldData = {};
let _gmlinMainRoom = false;

(async function() {
	const ws = await connectToServer();
	ws.onmessage = (webSocketMessage) => {
		const messageBody = JSON.parse(webSocketMessage.data);
		console.log("messageBody -- ", messageBody, JSON.stringify(oldData) !== JSON.stringify(messageBody))
		// GMS_API.send_async_event_social("test");

		if((JSON.stringify(oldData) !== JSON.stringify(messageBody)) && _gmlinMainRoom) {
			setGardener(messageBody);
			oldData = messageBody;
		}
			
};
async function connectToServer() {
	const ws = new WebSocket('ws://localhost:8080');
	// const ws = new WebSocket(`wss://savearbo.xyz/ws`);

	return new Promise((resolve, reject) => {
			const timer = setInterval(() => {
					if(ws.readyState === 1) {
							clearInterval(timer)
							resolve(ws);
					}
			}, 10);
	});
}
})();

function setGardener(data) {
	var map = {};
	map["id"] = "watered";
	map["data"] = "";
	if(localforage){
		localforage.setItem('arbo_lf', data).then(function (value) {
		// Do other things once the value has been saved.
		// console.log(value, "set in db",JSON.parse(data).data.arbos[0]);
		map["data"] = JSON.stringify(data.data);

		GMS_API.send_async_event_social(map);

		}).catch(function(err) {
		// This code runs if there were any errors
		console.log(err);
		});
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

	try {
	  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
		map["address"] = accounts[0];
		userAddress = accounts[0];
		web3 = new Web3(window.ethereum);
		console.log(web3);
		console.log(map["address"]);

	  web3jsSf = await sdkCore.Framework.create({
			chainId: 5, //note, you can also use provider.getChainId() to get the active chainId
			provider: web3
		});
		const metamaskProvider = new ethers.providers.Web3Provider(window.ethereum);
	  metaMaskSigner = web3jsSf.createSigner({ web3Provider: metamaskProvider });
		console.log(web3jsSf, metaMaskSigner);

		
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

















