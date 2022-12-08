"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _Order = _interopRequireDefault(require("../../models/Order"));
var _Cart = _interopRequireDefault(require("../../models/Cart"));
var _user = _interopRequireDefault(require("./user.service"));
var _product = _interopRequireDefault(require("./product.service"));
var _Product = _interopRequireDefault(require("../../models/Product"));
var _Seller = _interopRequireDefault(require("../../models/Seller"));
var _rapydAPI = _interopRequireDefault(require("./helpers/rapydAPI.service"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
class OrderService {
  async fetchAllPaymentMethods(locationInfo) {
    try {
      const resp = await (0, _rapydAPI.default)("GET", `/v1/payment_methods/country?country=${locationInfo.country}&currency=${locationInfo.currency}`);
      return resp.body.data;
    } catch (error) {
      console.error("Error completing request", error);
      throw error;
    }
  }
  async createOrder(uid, checkoutBody) {
    const order = {
      product_id: checkoutBody.product_id,
      size: checkoutBody.size,
      attachedFiles: checkoutBody.attachedFiles.length !== 0 ? checkoutBody.attachedFiles : null,
      user_id: uid,
      status: {
        Ordered: new Date().getTime()
      },
      created_at: new Date().getTime(),
      address: checkoutBody.address
    };
    if (order.attachedFiles === null) {
      order.status["Delivered"] = new Date().getTime();
    }
    const productInfo = await _product.default.getProductById(checkoutBody.product_id);
    const newOrder = await _Order.default.create({
      ...order
    });
    const rapydCheckoutBody = {
      amount: productInfo.price,
      complete_checkout_url: "http://example.com/complete",
      country: checkoutBody.country,
      currency: checkoutBody.currency,
      requested_currency: checkoutBody.currency,
      merchant_reference_id: newOrder._id,
      payment_method_types_include: checkoutBody.paymentMethod
    };
    const result = await (0, _rapydAPI.default)("POST", "/v1/checkout", rapydCheckoutBody);
    newOrder.rapyd_checkout_id = result.body.data.id;
    newOrder.page_expiration = result.body.data.page_expiration * 1000;
    await newOrder.save();
    console.log(result.body.data.id);
    console.log(new Date(result.body.data.page_expiration * 1000).toLocaleString());
    return {
      order: newOrder._id,
      checkout_id: newOrder.rapyd_checkout_id
    };
  }
  async markPaymentComplete(checkoutBody) {
    try {
      const order = await _Order.default.updateOne({
        rapyd_checkout_id: checkoutBody.checkout_id
      }, {
        $set: {
          rapyd_payment_id: checkoutBody.payment_id,
          isPaid: true
        }
      });
      return order;
    } catch (error) {
      console.error("Error completing request", error);
      throw error;
    }
  }
  async createCartOrder(uid, body) {
    const carts = await _user.default.getCart(uid);
    const orders = [];
    for (let i = 0; i < carts.length; i++) {
      const newOrder = await this.createOrder(uid, {
        ...carts[i]["_doc"],
        address: body.address
      });
      orders.push(newOrder._id);
    }
    const cart = await _Cart.default.deleteMany({
      user_id: uid
    });
    return orders;
  }
  async getOrderforSeller(uid) {
    const seller = await _Seller.default.findOne({
      user_id: uid
    });
    const products = seller.products;
    const orders = await _Order.default.find({
      product_id: {
        $in: products
      }
    }).sort({
      created_at: -1
    });
    for (let i = 0; i < orders.length; i++) {
      const product = await _Product.default.findById(orders[i].product_id);
      if (product) orders[i].product_details = product;
    }
    return orders;
  }
  async updateStatus(body) {
    const order = await _Order.default.findById(body.order_id);
    if (body.status === "Confirmed") {
      order.status["Confirmed"] = new Date().getTime();
      // } else if (body.status === "Approved") {
      //   order.status["Delivered"] = new Date().getTime();
    } else if (body.status === "AskedForChange") {
      order.status["AskedForChange"] ? order.status["AskedForChange"].push({
        data: body.Textdata,
        // Text
        date: new Date().getTime(),
        changeStatus: body.changeStatus
      }) : order.status["AskedForChange"] = [{
        data: body.Textdata,
        date: new Date().getTime(),
        changeStatus: body.changeStatus
      }];
      if (body.changeStatus === false) {
        order.status["Delivered"] = new Date().getTime();
      }
    } else if (body.status === "AskedForApprove") {
      order.status["AskedForApprove"] ? order.status["AskedForApprove"].push({
        data: body.ImageData,
        // links of images
        date: new Date().getTime()
      }) : order.status["AskedForApprove"] = [{
        data: body.ImageData,
        date: new Date().getTime()
      }];
    }
    order.markModified("status");
    await order.save();
    return order;
  }
  async getOrderforUser(uid) {
    const orders = await _Order.default.find({
      user_id: uid
    }).sort({
      created_at: -1
    });
    for (let i = 0; i < orders.length; i++) {
      const product = await _Product.default.findById(orders[i].product_id);
      if (product) orders[i].product_details = product;
    }
    return orders;
  }
  async getOrderById(uid, id) {
    const order = await _Order.default.findById(id);
    const product = await _Product.default.findById(order.product_id);
    if (product) order.product_details = product;
    const seller = await _Seller.default.findOne({
      user_id: product.user_id
    });
    if (seller) order.seller_details = seller;
    console.log(order, seller, product);
    if (uid !== order.user_id && uid !== seller.user_id) return null;
    return order;
  }
}
var _default = new OrderService();
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJPcmRlclNlcnZpY2UiLCJmZXRjaEFsbFBheW1lbnRNZXRob2RzIiwibG9jYXRpb25JbmZvIiwicmVzcCIsIm1ha2VSYXB5ZFJlcXVlc3QiLCJjb3VudHJ5IiwiY3VycmVuY3kiLCJib2R5IiwiZGF0YSIsImVycm9yIiwiY29uc29sZSIsImNyZWF0ZU9yZGVyIiwidWlkIiwiY2hlY2tvdXRCb2R5Iiwib3JkZXIiLCJwcm9kdWN0X2lkIiwic2l6ZSIsImF0dGFjaGVkRmlsZXMiLCJsZW5ndGgiLCJ1c2VyX2lkIiwic3RhdHVzIiwiT3JkZXJlZCIsIkRhdGUiLCJnZXRUaW1lIiwiY3JlYXRlZF9hdCIsImFkZHJlc3MiLCJwcm9kdWN0SW5mbyIsInByb2R1Y3RTZXJ2aWNlIiwiZ2V0UHJvZHVjdEJ5SWQiLCJuZXdPcmRlciIsIk9yZGVyIiwiY3JlYXRlIiwicmFweWRDaGVja291dEJvZHkiLCJhbW91bnQiLCJwcmljZSIsImNvbXBsZXRlX2NoZWNrb3V0X3VybCIsInJlcXVlc3RlZF9jdXJyZW5jeSIsIm1lcmNoYW50X3JlZmVyZW5jZV9pZCIsIl9pZCIsInBheW1lbnRfbWV0aG9kX3R5cGVzX2luY2x1ZGUiLCJwYXltZW50TWV0aG9kIiwicmVzdWx0IiwicmFweWRfY2hlY2tvdXRfaWQiLCJpZCIsInBhZ2VfZXhwaXJhdGlvbiIsInNhdmUiLCJsb2ciLCJ0b0xvY2FsZVN0cmluZyIsImNoZWNrb3V0X2lkIiwibWFya1BheW1lbnRDb21wbGV0ZSIsInVwZGF0ZU9uZSIsIiRzZXQiLCJyYXB5ZF9wYXltZW50X2lkIiwicGF5bWVudF9pZCIsImlzUGFpZCIsImNyZWF0ZUNhcnRPcmRlciIsImNhcnRzIiwidXNlclNlcnZpY2UiLCJnZXRDYXJ0Iiwib3JkZXJzIiwiaSIsInB1c2giLCJjYXJ0IiwiQ2FydCIsImRlbGV0ZU1hbnkiLCJnZXRPcmRlcmZvclNlbGxlciIsInNlbGxlciIsIlNlbGxlciIsImZpbmRPbmUiLCJwcm9kdWN0cyIsImZpbmQiLCIkaW4iLCJzb3J0IiwicHJvZHVjdCIsIlByb2R1Y3QiLCJmaW5kQnlJZCIsInByb2R1Y3RfZGV0YWlscyIsInVwZGF0ZVN0YXR1cyIsIm9yZGVyX2lkIiwiVGV4dGRhdGEiLCJkYXRlIiwiY2hhbmdlU3RhdHVzIiwiSW1hZ2VEYXRhIiwibWFya01vZGlmaWVkIiwiZ2V0T3JkZXJmb3JVc2VyIiwiZ2V0T3JkZXJCeUlkIiwic2VsbGVyX2RldGFpbHMiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zZXJ2ZXIvYXBpL3NlcnZpY2VzL29yZGVyLnNlcnZpY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IE9yZGVyIGZyb20gXCIuLi8uLi9tb2RlbHMvT3JkZXJcIjtcbmltcG9ydCBDYXJ0IGZyb20gXCIuLi8uLi9tb2RlbHMvQ2FydFwiO1xuaW1wb3J0IHVzZXJTZXJ2aWNlIGZyb20gXCIuL3VzZXIuc2VydmljZVwiO1xuaW1wb3J0IHByb2R1Y3RTZXJ2aWNlIGZyb20gXCIuL3Byb2R1Y3Quc2VydmljZVwiO1xuaW1wb3J0IFByb2R1Y3QgZnJvbSBcIi4uLy4uL21vZGVscy9Qcm9kdWN0XCI7XG5pbXBvcnQgU2VsbGVyIGZyb20gXCIuLi8uLi9tb2RlbHMvU2VsbGVyXCI7XG5pbXBvcnQgbWFrZVJhcHlkUmVxdWVzdCBmcm9tIFwiLi9oZWxwZXJzL3JhcHlkQVBJLnNlcnZpY2VcIjtcbmNsYXNzIE9yZGVyU2VydmljZSB7XG4gIGFzeW5jIGZldGNoQWxsUGF5bWVudE1ldGhvZHMobG9jYXRpb25JbmZvKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBtYWtlUmFweWRSZXF1ZXN0KFxuICAgICAgICBcIkdFVFwiLFxuICAgICAgICBgL3YxL3BheW1lbnRfbWV0aG9kcy9jb3VudHJ5P2NvdW50cnk9JHtsb2NhdGlvbkluZm8uY291bnRyeX0mY3VycmVuY3k9JHtsb2NhdGlvbkluZm8uY3VycmVuY3l9YFxuICAgICAgKTtcbiAgICAgIHJldHVybiByZXNwLmJvZHkuZGF0YTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNvbXBsZXRpbmcgcmVxdWVzdFwiLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICBhc3luYyBjcmVhdGVPcmRlcih1aWQsIGNoZWNrb3V0Qm9keSkge1xuICAgIGNvbnN0IG9yZGVyID0ge1xuICAgICAgcHJvZHVjdF9pZDogY2hlY2tvdXRCb2R5LnByb2R1Y3RfaWQsXG4gICAgICBzaXplOiBjaGVja291dEJvZHkuc2l6ZSxcbiAgICAgIGF0dGFjaGVkRmlsZXM6XG4gICAgICAgIGNoZWNrb3V0Qm9keS5hdHRhY2hlZEZpbGVzLmxlbmd0aCAhPT0gMFxuICAgICAgICAgID8gY2hlY2tvdXRCb2R5LmF0dGFjaGVkRmlsZXNcbiAgICAgICAgICA6IG51bGwsXG4gICAgICB1c2VyX2lkOiB1aWQsXG4gICAgICBzdGF0dXM6IHtcbiAgICAgICAgT3JkZXJlZDogbmV3IERhdGUoKS5nZXRUaW1lKCksXG4gICAgICB9LFxuICAgICAgY3JlYXRlZF9hdDogbmV3IERhdGUoKS5nZXRUaW1lKCksXG4gICAgICBhZGRyZXNzOiBjaGVja291dEJvZHkuYWRkcmVzcyxcbiAgICB9O1xuICAgIGlmIChvcmRlci5hdHRhY2hlZEZpbGVzID09PSBudWxsKSB7XG4gICAgICBvcmRlci5zdGF0dXNbXCJEZWxpdmVyZWRcIl0gPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9kdWN0SW5mbyA9IGF3YWl0IHByb2R1Y3RTZXJ2aWNlLmdldFByb2R1Y3RCeUlkKFxuICAgICAgY2hlY2tvdXRCb2R5LnByb2R1Y3RfaWRcbiAgICApO1xuXG4gICAgY29uc3QgbmV3T3JkZXIgPSBhd2FpdCBPcmRlci5jcmVhdGUoe1xuICAgICAgLi4ub3JkZXIsXG4gICAgfSk7XG5cbiAgICBjb25zdCByYXB5ZENoZWNrb3V0Qm9keSA9IHtcbiAgICAgIGFtb3VudDogcHJvZHVjdEluZm8ucHJpY2UsXG4gICAgICBjb21wbGV0ZV9jaGVja291dF91cmw6IFwiaHR0cDovL2V4YW1wbGUuY29tL2NvbXBsZXRlXCIsXG4gICAgICBjb3VudHJ5OiBjaGVja291dEJvZHkuY291bnRyeSxcbiAgICAgIGN1cnJlbmN5OiBjaGVja291dEJvZHkuY3VycmVuY3ksXG4gICAgICByZXF1ZXN0ZWRfY3VycmVuY3k6IGNoZWNrb3V0Qm9keS5jdXJyZW5jeSxcbiAgICAgIG1lcmNoYW50X3JlZmVyZW5jZV9pZDogbmV3T3JkZXIuX2lkLFxuICAgICAgcGF5bWVudF9tZXRob2RfdHlwZXNfaW5jbHVkZTogY2hlY2tvdXRCb2R5LnBheW1lbnRNZXRob2QsXG4gICAgfTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG1ha2VSYXB5ZFJlcXVlc3QoXG4gICAgICBcIlBPU1RcIixcbiAgICAgIFwiL3YxL2NoZWNrb3V0XCIsXG4gICAgICByYXB5ZENoZWNrb3V0Qm9keVxuICAgICk7XG5cbiAgICBuZXdPcmRlci5yYXB5ZF9jaGVja291dF9pZCA9IHJlc3VsdC5ib2R5LmRhdGEuaWQ7XG4gICAgbmV3T3JkZXIucGFnZV9leHBpcmF0aW9uID0gcmVzdWx0LmJvZHkuZGF0YS5wYWdlX2V4cGlyYXRpb24gKiAxMDAwO1xuXG4gICAgYXdhaXQgbmV3T3JkZXIuc2F2ZSgpO1xuICAgIGNvbnNvbGUubG9nKHJlc3VsdC5ib2R5LmRhdGEuaWQpO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgbmV3IERhdGUocmVzdWx0LmJvZHkuZGF0YS5wYWdlX2V4cGlyYXRpb24gKiAxMDAwKS50b0xvY2FsZVN0cmluZygpXG4gICAgKTtcblxuICAgIHJldHVybiB7XG4gICAgICBvcmRlcjogbmV3T3JkZXIuX2lkLFxuICAgICAgY2hlY2tvdXRfaWQ6IG5ld09yZGVyLnJhcHlkX2NoZWNrb3V0X2lkLFxuICAgIH07XG4gIH1cblxuICBhc3luYyBtYXJrUGF5bWVudENvbXBsZXRlKGNoZWNrb3V0Qm9keSkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBvcmRlciA9IGF3YWl0IE9yZGVyLnVwZGF0ZU9uZShcbiAgICAgICAgeyByYXB5ZF9jaGVja291dF9pZDogY2hlY2tvdXRCb2R5LmNoZWNrb3V0X2lkIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgICByYXB5ZF9wYXltZW50X2lkOiBjaGVja291dEJvZHkucGF5bWVudF9pZCxcbiAgICAgICAgICAgIGlzUGFpZDogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgICApO1xuICAgICAgcmV0dXJuIG9yZGVyO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgY29tcGxldGluZyByZXF1ZXN0XCIsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUNhcnRPcmRlcih1aWQsIGJvZHkpIHtcbiAgICBjb25zdCBjYXJ0cyA9IGF3YWl0IHVzZXJTZXJ2aWNlLmdldENhcnQodWlkKTtcbiAgICBjb25zdCBvcmRlcnMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBuZXdPcmRlciA9IGF3YWl0IHRoaXMuY3JlYXRlT3JkZXIodWlkLCB7XG4gICAgICAgIC4uLmNhcnRzW2ldW1wiX2RvY1wiXSxcbiAgICAgICAgYWRkcmVzczogYm9keS5hZGRyZXNzLFxuICAgICAgfSk7XG4gICAgICBvcmRlcnMucHVzaChuZXdPcmRlci5faWQpO1xuICAgIH1cbiAgICBjb25zdCBjYXJ0ID0gYXdhaXQgQ2FydC5kZWxldGVNYW55KHsgdXNlcl9pZDogdWlkIH0pO1xuICAgIHJldHVybiBvcmRlcnM7XG4gIH1cbiAgYXN5bmMgZ2V0T3JkZXJmb3JTZWxsZXIodWlkKSB7XG4gICAgY29uc3Qgc2VsbGVyID0gYXdhaXQgU2VsbGVyLmZpbmRPbmUoeyB1c2VyX2lkOiB1aWQgfSk7XG4gICAgY29uc3QgcHJvZHVjdHMgPSBzZWxsZXIucHJvZHVjdHM7XG4gICAgY29uc3Qgb3JkZXJzID0gYXdhaXQgT3JkZXIuZmluZCh7XG4gICAgICBwcm9kdWN0X2lkOiB7ICRpbjogcHJvZHVjdHMgfSxcbiAgICB9KS5zb3J0KHsgY3JlYXRlZF9hdDogLTEgfSk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9yZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvZHVjdCA9IGF3YWl0IFByb2R1Y3QuZmluZEJ5SWQob3JkZXJzW2ldLnByb2R1Y3RfaWQpO1xuICAgICAgaWYgKHByb2R1Y3QpIG9yZGVyc1tpXS5wcm9kdWN0X2RldGFpbHMgPSBwcm9kdWN0O1xuICAgIH1cbiAgICByZXR1cm4gb3JkZXJzO1xuICB9XG4gIGFzeW5jIHVwZGF0ZVN0YXR1cyhib2R5KSB7XG4gICAgY29uc3Qgb3JkZXIgPSBhd2FpdCBPcmRlci5maW5kQnlJZChib2R5Lm9yZGVyX2lkKTtcbiAgICBpZiAoYm9keS5zdGF0dXMgPT09IFwiQ29uZmlybWVkXCIpIHtcbiAgICAgIG9yZGVyLnN0YXR1c1tcIkNvbmZpcm1lZFwiXSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgLy8gfSBlbHNlIGlmIChib2R5LnN0YXR1cyA9PT0gXCJBcHByb3ZlZFwiKSB7XG4gICAgICAvLyAgIG9yZGVyLnN0YXR1c1tcIkRlbGl2ZXJlZFwiXSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIH0gZWxzZSBpZiAoYm9keS5zdGF0dXMgPT09IFwiQXNrZWRGb3JDaGFuZ2VcIikge1xuICAgICAgb3JkZXIuc3RhdHVzW1wiQXNrZWRGb3JDaGFuZ2VcIl1cbiAgICAgICAgPyBvcmRlci5zdGF0dXNbXCJBc2tlZEZvckNoYW5nZVwiXS5wdXNoKHtcbiAgICAgICAgICAgIGRhdGE6IGJvZHkuVGV4dGRhdGEsIC8vIFRleHRcbiAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuICAgICAgICAgICAgY2hhbmdlU3RhdHVzOiBib2R5LmNoYW5nZVN0YXR1cyxcbiAgICAgICAgICB9KVxuICAgICAgICA6IChvcmRlci5zdGF0dXNbXCJBc2tlZEZvckNoYW5nZVwiXSA9IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZGF0YTogYm9keS5UZXh0ZGF0YSxcbiAgICAgICAgICAgICAgZGF0ZTogbmV3IERhdGUoKS5nZXRUaW1lKCksXG4gICAgICAgICAgICAgIGNoYW5nZVN0YXR1czogYm9keS5jaGFuZ2VTdGF0dXMsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0pO1xuXG4gICAgICBpZiAoYm9keS5jaGFuZ2VTdGF0dXMgPT09IGZhbHNlKSB7XG4gICAgICAgIG9yZGVyLnN0YXR1c1tcIkRlbGl2ZXJlZFwiXSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYm9keS5zdGF0dXMgPT09IFwiQXNrZWRGb3JBcHByb3ZlXCIpIHtcbiAgICAgIG9yZGVyLnN0YXR1c1tcIkFza2VkRm9yQXBwcm92ZVwiXVxuICAgICAgICA/IG9yZGVyLnN0YXR1c1tcIkFza2VkRm9yQXBwcm92ZVwiXS5wdXNoKHtcbiAgICAgICAgICAgIGRhdGE6IGJvZHkuSW1hZ2VEYXRhLCAvLyBsaW5rcyBvZiBpbWFnZXNcbiAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuICAgICAgICAgIH0pXG4gICAgICAgIDogKG9yZGVyLnN0YXR1c1tcIkFza2VkRm9yQXBwcm92ZVwiXSA9IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZGF0YTogYm9keS5JbWFnZURhdGEsXG4gICAgICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdKTtcbiAgICB9XG4gICAgb3JkZXIubWFya01vZGlmaWVkKFwic3RhdHVzXCIpO1xuXG4gICAgYXdhaXQgb3JkZXIuc2F2ZSgpO1xuICAgIHJldHVybiBvcmRlcjtcbiAgfVxuICBhc3luYyBnZXRPcmRlcmZvclVzZXIodWlkKSB7XG4gICAgY29uc3Qgb3JkZXJzID0gYXdhaXQgT3JkZXIuZmluZCh7IHVzZXJfaWQ6IHVpZCB9KS5zb3J0KHsgY3JlYXRlZF9hdDogLTEgfSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcmRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByb2R1Y3QgPSBhd2FpdCBQcm9kdWN0LmZpbmRCeUlkKG9yZGVyc1tpXS5wcm9kdWN0X2lkKTtcbiAgICAgIGlmIChwcm9kdWN0KSBvcmRlcnNbaV0ucHJvZHVjdF9kZXRhaWxzID0gcHJvZHVjdDtcbiAgICB9XG4gICAgcmV0dXJuIG9yZGVycztcbiAgfVxuICBhc3luYyBnZXRPcmRlckJ5SWQodWlkLCBpZCkge1xuICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgT3JkZXIuZmluZEJ5SWQoaWQpO1xuICAgIGNvbnN0IHByb2R1Y3QgPSBhd2FpdCBQcm9kdWN0LmZpbmRCeUlkKG9yZGVyLnByb2R1Y3RfaWQpO1xuICAgIGlmIChwcm9kdWN0KSBvcmRlci5wcm9kdWN0X2RldGFpbHMgPSBwcm9kdWN0O1xuICAgIGNvbnN0IHNlbGxlciA9IGF3YWl0IFNlbGxlci5maW5kT25lKHsgdXNlcl9pZDogcHJvZHVjdC51c2VyX2lkIH0pO1xuICAgIGlmIChzZWxsZXIpIG9yZGVyLnNlbGxlcl9kZXRhaWxzID0gc2VsbGVyO1xuICAgIGNvbnNvbGUubG9nKG9yZGVyLCBzZWxsZXIsIHByb2R1Y3QpO1xuICAgIGlmICh1aWQgIT09IG9yZGVyLnVzZXJfaWQgJiYgdWlkICE9PSBzZWxsZXIudXNlcl9pZCkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIG9yZGVyO1xuICB9XG59XG5leHBvcnQgZGVmYXVsdCBuZXcgT3JkZXJTZXJ2aWNlKCk7XG4iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQTBEO0FBQzFELE1BQU1BLFlBQVksQ0FBQztFQUNqQixNQUFNQyxz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