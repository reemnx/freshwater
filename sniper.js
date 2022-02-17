require("dotenv").config();
const { SeaPort } = require("./handlers/seaPort");
const SeaClient = new SeaPort();
const {
  getEventAssets,
  getGasPriceMap,
  getCollectionData,
} = require("./services/opensea.service");
const { orderBy, setThrottleRate } = require("./services/util.service");
const { convertWeiToEth } = require("./services/web3.service");
const BigNumber = require("bignumber.js");
const watchList = require("./config/watchList");
const floorPriceWatchers = require("./config/floorPriceWatchers");
const config = require("./config");
const state = require("./state");
const colors = require("colors");
const cron = require("node-cron");

// Connect to seaPort using ./config.js params
SeaClient.connect();
// Init watchlist
initWatchers();
// Init floorprice watchers
// initFloorPriceWatchers();

function initWatchers() {
  setThrottleRate();
  for (let i = 0; i <= watchList.length - 1; i++) {
    const watcher = watchList[i];
    setTimeout(() => {
      if (watcher.isActive) {
        console.log(
          `Aiming ${watcher.slug} || Price target: ${watcher.priceTarget} ETH || Gas eager mode: ${watcher.gasEagerLevel}`
            .bgGreen.white
        );

        let watchTask = cron.schedule(
          `*/${config.opensea_throttle_rate} * * * * *`,
          () => {
            activateWatcher(watcher);
          }
        );
        state.activeWatchTasks.push(watchTask);
      }
    }, 750 * i);
  }
}

async function initFloorPriceWatchers() {
  for (let i = 0; i <= floorPriceWatchers.length - 1; i++) {
    const currWatcher = floorPriceWatchers;
  }
}

function stopWatchers() {
  state.activeWatchTasks.forEach((task) => {
    task.stop();
  });
  console.log("Watchers cleared:", state.activeWatchTasks.length);
  state.activeWatchTasks = [];
}

async function activateWatcher(watcher) {
  if (state.isOpenseaCooldown) {
    stopWatchers();
    return;
  }
  getEventAssets(watcher.contractAddress).then((assets) => {
    if (assets == "too-many-requests") {
      console.log(
        `Too many requests! stopping the BOT to cooldown, re-init in 75 seconds || ${new Date().getHours()}:${new Date().getMinutes()}`
          .bgYellow.black
      );
      state.isOpenseaCooldown = true;
      stopWatchers();
      setTimeout(() => {
        state.isOpenseaCooldown = false;
        initWatchers();
      }, 75000);
      return;
    }
    if (!assets || !assets.length) {
      console.log(
        `No new listings || Past ${config.listing_fresh_rate} sec || at ${watcher.slug}`
          .bgCyan.white.underline
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
      if (state.isOrderInProcess) {
        console.log("*** Fullfill order already in process ***");
        stopWatchers();
        return;
      } else {
        state.isOrderInProcess = true;
        stopWatchers();
      }
      // set gas flow
      await getExtraGas(watcher);
      // Todo: Validate order price again
      const txHash = await fullFillOrder(order, config.public_wallet_addrress);

      if (txHash) {
        console.log(
          "Congratz! you just buy an NFT using Fresh-Soda, View etherscan: ",
          `https://etherscan.io/tx/${txHash}`
        );
        stopWatchers();
        // Init Notification services.
        return;
      } else {
        console.log(`Fullfill order failed, re-init watchers...`);
        state.isOrderInProcess = false;
        initWatchers();
      }
    }
  }
}

async function getExtraGas(watcher) {
  let gas = await getGasPriceMap();

  if (typeof gas == "number" && watcher.gasEagerLevel == "high") {
    gas = Math.round(gas * 1.3);
  }

  if (!gas) {
    gas = watcher.extraGasAmount;
  }
  console.log("Setting gas price", gas);

  const extraGas = new BigNumber(gas);
  SeaClient.setExtraGas(extraGas);
}

function isFullFillOrderActive() {
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
