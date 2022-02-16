require("dotenv").config();
module.exports = {
  public_wallet_addrress: process.env.PUBLIC_WALLET_ADDRESS,
  wallet_mnemonic: process.env.WALLET_MNEMONIC,
  infura_api_key: process.env.INFURA_API_KEY,
  network: process.env.NETWORK,
  seaport_api_key: process.env.OPENSEA_API_KEY,
};
