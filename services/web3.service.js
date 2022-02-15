const Web3 = require("web3");
const { isParseable } = require("./util.service");
let web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");

function convertWeiToEth(value) {
  return isParseable(web3.utils.fromWei(value, "ether"));
}

module.exports = { convertWeiToEth };
