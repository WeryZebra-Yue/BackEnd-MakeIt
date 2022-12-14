"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _mongoose = _interopRequireDefault(require("mongoose"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const seller = _mongoose.default.Schema({
  user_id: String,
  shop_name: String,
  gst_id: String,
  pickup_address: Object,
  products: Array
});
var _default = _mongoose.default.model("Seller", seller);
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJzZWxsZXIiLCJtb25nb29zZSIsIlNjaGVtYSIsInVzZXJfaWQiLCJTdHJpbmciLCJzaG9wX25hbWUiLCJnc3RfaWQiLCJwaWNrdXBfYWRkcmVzcyIsIk9iamVjdCIsInByb2R1Y3RzIiwiQXJyYXkiLCJtb2RlbCJdLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9tb2RlbHMvU2VsbGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtb25nb29zZSBmcm9tIFwibW9uZ29vc2VcIjtcbmNvbnN0IHNlbGxlciA9IG1vbmdvb3NlLlNjaGVtYSh7XG4gIHVzZXJfaWQ6IFN0cmluZyxcbiAgc2hvcF9uYW1lOiBTdHJpbmcsXG4gIGdzdF9pZDogU3RyaW5nLFxuICBwaWNrdXBfYWRkcmVzczogT2JqZWN0LFxuICBwcm9kdWN0czogQXJyYXksXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgbW9uZ29vc2UubW9kZWwoXCJTZWxsZXJcIiwgc2VsbGVyKTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFBZ0M7QUFDaEMsTUFBTUEsTUFBTSxHQUFHQyxpQkFBUSxDQUFDQyxNQUFNLENBQUM7RUFDN0JDLE9BQU8sRUFBRUMsTUFBTTtFQUNmQyxTQUFTLEVBQUVELE1BQU07RUFDakJFLE1BQU0sRUFBRUYsTUFBTTtFQUNkRyxjQUFjLEVBQUVDLE1BQU07RUFDdEJDLFFBQVEsRUFBRUM7QUFDWixDQUFDLENBQUM7QUFBQyxlQUVZVCxpQkFBUSxDQUFDVSxLQUFLLENBQUMsUUFBUSxFQUFFWCxNQUFNLENBQUM7QUFBQSJ9