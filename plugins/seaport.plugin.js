// Setting up the opensea client & env
const HDWalletProvider = require("@truffle/hdwallet-provider");
const opensea = require("opensea-js");
const OpenSeaPort = opensea.OpenSeaPort;
const Network = opensea.Network;
const config = require("../config");

const providerEngine = new HDWalletProvider({
  mnemonic: {
    phrase: config.wallet_mnemonic,
  },
  providerOrUrl: `https://mainnet.infura.io/v3/${config.infura_api_key}`,
});

const seaport = new OpenSeaPort(
  providerEngine,
  {
    networkName: Network.Main,
    apiKey: config.seaport_api_key,
  },
  (arg) => console.log(arg)
);

module.exports = seaport;
