import { configureStore } from "@reduxjs/toolkit";

import cartSlice from "./src/features/cartSlice";

const store = configureStore({
  reducer: {
    cart: cartSlice,
  },
});

export default store;
