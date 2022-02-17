require("dotenv").config();
module.exports = {
  // Your public wallet address
  public_wallet_addrress: process.env.PUBLIC_WALLET_ADDRESS,
  // Your wallet secret recovery phases
  wallet_mnemonic: process.env.WALLET_MNEMONIC,
  // Infura.io api key - provide a native web3 provider
  infura_api_key: process.env.INFURA_API_KEY,
  // etherum network identifier
  network: process.env.NETWORK,
  // Opensea api key
  seaport_api_key: process.env.OPENSEA_API_KEY,
  // NFT listing max age
  listing_fresh_rate: 15,
  // OpenSea watch throttle rate
  opensea_throttle_rate: 3000,
};
