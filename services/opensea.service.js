const axios = require("axios").default;
const { isParseable } = require("./util.service");
const BASE_URL = "https://api.opensea.io/api/v1/";
const END_POINT = "events";
const BASE_HEADERS = {
  Accept: "application/json",
  "X-API-KEY": process.env.OPENSEA_API_KEY,
};
const colors = require("colors");
const config = require("../config/index");

async function getEventAssets(contractAddress, type = "created") {
  const freshRateInSeconds = config.listing_fresh_rate;
  let cron = new Date().setSeconds(
    new Date().getSeconds() - freshRateInSeconds
  );
  const qPramas = `?asset_contract_address=${contractAddress}&event_type=${type}&occurred_after=${cron}&only_opensea=true&offset=0&limit=50`;
  try {
    const response = await axios({
      url: `${BASE_URL}${END_POINT}${qPramas}`,
      method: "GET",
      headers: BASE_HEADERS,
    });
    let eventAssets = response.data.asset_events;
    eventAssets = filterEventAssets(eventAssets);
    return eventAssets;
  } catch (error) {
    console.log("Error while get eventAssets, Type: ".bgRed.cyan, error);
    // Check error status
    if (error.response && error.response.statusText) {
      if (error.response.statusText == "Too Many Requests") {
        return "too-many-requests";
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
}

async function getCollectionData(collectionSlug = "doodles-official") {
  try {
    let res = await axios({
      method: "GET",
      url: `https://api.opensea.io/api/v1/collection/${collectionSlug}/stats`,
    });
    return res.data.stats;
  } catch (error) {
    console.log(error);
  }
}

async function getGasPriceMap() {
  try {
    const priceMap = await axios({
      url: `https://ethgasstation.info/api/ethgasAPI.json?api-key=${process.env.ETHERSCAN_API_KEY}`,
    });
    // return number in gwei
    return priceMap.data.fastest / 10;
  } catch (error) {
    console.log("Unable to fetch gas price map");
    return 0;
  }
}

function filterEventAssets(assets) {
  return assets.filter(
    (a) => isParseable(a.ending_price) && a.auction_type === "dutch"
  );
}

module.exports = { getEventAssets, getGasPriceMap, getCollectionData };
