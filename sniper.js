const { SeaPort } = require("./handlers/seaPort");
const SeaClient = new SeaPort();
const {
  getEventAssets,
  getGasPriceMap,
} = require("./services/opensea.service");
const { orderBy } = require("./services/util.service");
const { convertWeiToEth } = require("./services/web3.service");
const BigNumber = require("bignumber.js");
const watchList = require("./config/watchList");
const config = require("./config");
const state = require("./state");
const colors = require("colors");

// Connect to seaPort using ./config.js params
SeaClient.connect();
// Init watchlist
initWatchers();

function initWatchers() {
  const throttle = 3500;
  for (let i = 0; i <= watchList.length - 1; i++) {
    setTimeout(() => {
      const watcher = watchList[i];
      if (watcher.isActive) {
        console.log(
          `Aiming ${watcher.slug} || Price target: ${watcher.priceTarget} ETH || Gas eager mode: ${watcher.gasEagerLevel}`
            .bgGreen.white
        );
        const watcherId = setInterval(() => {
          activateWatcher(watcher);
        }, throttle);
        state.watchersIntervalIds.push(watcherId);
      }
    }, 750 * i);
  }
}

function stopWatchers() {
  state.watchersIntervalIds.forEach((id) => {
    clearInterval(id);
  });
  console.log("Watchers cleared:", state.watchersIntervalIds.length);
  state.watchersIntervalIds = [];
}

async function activateWatcher(watcher) {
  if (state.isThrottleActive) {
    stopWatchers();
    console.log("Throttle active, dodge process");
    return;
  }
  getEventAssets(watcher.contractAddress).then((assets) => {
    if (assets == "re-init-watchers") {
      console.log(
        `Stop the BOT to cooldown, re-init in 60 seconds ${new Date().getHours()}:${new Date().getMinutes()}`
          .bgYellow.black
      );
      state.isThrottleActive = true;
      stopWatchers();
      setTimeout(() => {
        state.isThrottleActive = false;
        initWatchers();
      }, 60000);
      return;
    }
    if (!assets || !assets.length) {
      console.log(
        `No new listings || Past 15 sec || at ${watcher.slug}`.bgRed.white
      );
      return;
    }

    const sortedAssets = orderBy(assets, "asc", "ending_price");
    sortedAssets.length &&
      console.log(
        `Chepest ${watcher.slug} nft found: [${convertWeiToEth(
          sortedAssets[0].ending_price
        )} / ${watcher.priceTarget} MAX] ETH || List at: ${
          sortedAssets[0].created_date
        }`.brightMagenta.bgBlack
      );
    const potetialAssetsToOrder = sortedAssets.filter((a) => {
      let formatted_end_price = convertWeiToEth(a.ending_price);
      return formatted_end_price <= watcher.priceTarget;
    });
    potetialAssetsToOrder.length > 0 &&
      console.log(
        `${watcher.slug} Potential assets found: ${potetialAssetsToOrder.length}`
      );
    extractValidOrderFromAssets(potetialAssetsToOrder, watcher);
  });
}

async function extractValidOrderFromAssets(potetialAssets, watcher) {
  for (let i = 0; i <= potetialAssets.length - 1; i++) {
    const currAsset = potetialAssets[i].asset;
    const tokenId = currAsset.token_id;
    const contractAddress = currAsset.asset_contract.address;
    const order = await getOrder(contractAddress, tokenId);
    const orderCopy = { ...order };
    if (!order) continue;
    const orderPrice = convertWeiToEth(
      JSON.stringify(orderCopy.currentPrice.toNumber())
    );
    console.log(
      `Valid order Found || ${order.asset.name} || [${orderPrice} eth / ${watcher.priceTarget} MAX] || ${order.asset.openseaLink}`
    );
    if (JSON.parse(orderPrice) <= JSON.parse(watcher.priceTarget)) {
      console.log(
        "Order price valid: ",
        JSON.parse(orderPrice),
        "/ ",
        JSON.parse(watcher.priceTarget)
      );

      // check global state for ongoing fullfillment & set state
      if (isFullFillOrderActive()) {
        console.log("*** Fullfill order already in process ***");
        stopWatchers();
        return;
      } else {
        state.isFullFillOrderActive = true;
      }
      // set gas flow
      await getExtraGas(watcher);
      console.log("Before fullfill: ", order.currentPrice);
      const txHash = await fullFillOrder(order, config.public_wallet_addrress);

      if (txHash) {
        console.log(
          "Congratz! you just buy an NFT using FreshWater, txHash: ",
          txHash
        );
        stopWatchers();
        return;
      } else {
        stopWatchers();
        console.log("txHash", txHash);
        return;
      }
    }
  }
}

async function getExtraGas(watcher) {
  let gas = await getGasPriceMap();
  if (watcher.gasEagerLevel == "high") {
    gas = Math.round(gas * 1.3);
  }
  if (!gas) {
    gas = watcher.extraGasAmount;
  }
  console.log("Setting gas price", gas);
  const extraGas = new BigNumber(gas);
  SeaClient.setExtraGas(extraGas);
}

function isFullFillOrderActive(this) {
  return state.isFullFillOrderActive;
}

// Get order example func takes contract address & token ID
async function getOrder(contractAddress, tokenId) {
  const order = await SeaClient.getOrder(contractAddress, tokenId);
  return order;
}

async function fullFillOrder(order) {
  console.log("fullFillOrder started");
  try {
    const txHash = await SeaClient.fullFillOrder(
      order,
      config.public_wallet_addrress
    );
    return txHash;
  } catch (error) {
    console.log("Failed to fullfill order! ", error);
    return false;
  }
}
