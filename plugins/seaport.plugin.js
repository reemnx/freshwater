// Setting up the opensea client & env
const HDWalletProvider = require("@truffle/hdwallet-provider");
const opensea = require("opensea-js");
const OpenSeaPort = opensea.OpenSeaPort;
const Network = opensea.Network;
const { OrderSide } = require("opensea-js/lib/types");
const config = require("../config");

const providerEngine = new HDWalletProvider({
  mnemonic: {
    phrase: config.wallet_mnemonic,
  },
  providerOrUrl:
    "https://eth-mainnet.alchemyapi.io/v2/8FTGBVn5T480Fky3MV1Fxy6i5lVFzdR7",
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
