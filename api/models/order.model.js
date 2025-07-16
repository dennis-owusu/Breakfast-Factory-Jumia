import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    products: [
      {
        product: {
          name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
          },
          price: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Product price cannot be negative"],
          },
          images: {
            type: [String],
            default: [],
          },
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
          min: [1, "Quantity must be at least 1"],
        },
      },
    ],
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: [100, "City cannot exceed 100 characters"],
    },
    state: {
      type: String,
      required: [false, "State is not required"],
      trim: true,
      maxlength: [100, "State cannot exceed 100 characters"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"],
    },
    postalCode: {
      type: String,
      required: [false, "Postal code is not required"],
      trim: true,
      maxlength: [20, "Postal code cannot exceed 20 characters"],
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "processing", "shipped", "delivered"],
        message: "Status must be pending, processing, shipped, or delivered",
      },
      default: "pending",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);


const Order = mongoose.model("Order", orderSchema);

export default Order;