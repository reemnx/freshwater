const { OrderSide } = require("opensea-js/lib/types");
const colors = require("colors");

class SeaPort {
  handler = {};

  connect() {
    const seaport = require("../plugins/seaport.plugin");
    this.handler = seaport;
    this.log(
      `Seaport connected with key: ${this.handler.api.apiKey} successfully!`
    );
  }

  async getOrder(contract, tokenId) {
    try {
      const order = await this.handler.api.getOrder({
        asset_contract_address: contract,
        token_id: tokenId,
        side: OrderSide.Sell,
      });

      if (this.validateSaleKind(order.saleKind)) {
        return order;
      } else {
        return null;
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async fullFillOrder(order, accountAddress) {
    try {
      const transactionHash = await this.handler.fulfillOrder({
        //Fulfilling order
        order,
        accountAddress,
      });
      return transactionHash;
    } catch (error) {
      if (error.includes("insufficient funds")) {
        // Todo: actuall notify the user
        console.log("$$ Not enough funds $$ notify user...".bgRed.white);
      } else {
        console.error("fullFillOrder FAILED ***".bgRed.white, error);
      }
      return "";
    }
  }

  setExtraGas(amount) {
    try {
      this.handler.gasPriceAddition = amount;
    } catch (error) {
      console.log("Failed to set extra gas", error);
      return;
    }
  }

  validateSaleKind(kind) {
    // 0 For fix-price, 1 for auction
    if (!kind) {
      return true;
    } else {
      return false;
    }
  }

  showCurrentExtraGas() {
    this.log(this.handler.gasPriceAddition);
  }

  log(data) {
    console.log(data);
  }
}

module.exports.SeaPort = SeaPort;
