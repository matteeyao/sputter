require("../../models");
const mongoose = require("mongoose");
const graphql = require("graphql");
const { GraphQLObjectType, GraphQLList, GraphQLID, GraphQLNonNull } = graphql;

const UserType = require("./user_type");
const CategoryType = require("./category_type");
const ProductType = require("./product_type");

const User = mongoose.model("users");
const Category = mongoose.model("categories");
const Product = mongoose.model("products");

// Bonus Phase: Adding the Lambda
const axios = require("axios");
const secret = require("../../../config/keys");

// We can set our `AuthOptions` before defining our `RootQuery`
const authOptions = {
  method: "GET",
  url: "https://aqn4qnp9q9.execute-api.us-east-2.amazonaws.com/generate-price",
  headers: {
    "x-api-key": secret.AWSKey
  }
};

const RootQueryType = new GraphQLObjectType({
  name: "RootQueryType",
  fields: () => ({
    users: {
      type: new GraphQLList(UserType),
      resolve() {
        return User.find({});
      }
    },
    user: {
      type: UserType,
      args: { _id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve(_, args) {
        return User.findById(args._id);
      }
    },
    categories: {
      type: new GraphQLList(CategoryType),
      resolve() {
        return Category.find({});
      }
    },
    category: {
      type: CategoryType,
      args: { _id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve(_, args) {
        return Category.findById(args._id);
      }
    },
    products: {
      type: new GraphQLList(ProductType),
      resolve() {
        return Product.find({})
          // Bonus Phase - Adding the Lambda
          .then(products => {
            const productsWithCost = products.map(product => {

              return axios(authOptions).then(res => {
                product.cost = Math.round(res.data.cost);
                return product;
              });
            });

            return productsWithCost;
          });
        }
      },
      product: {
        type: ProductType,
        args: { _id: { type: new GraphQLNonNull(GraphQLID) } },
        resolve(_, args) {
          // Find the product
          return Product.findById(args._id)
            /* Bonus Phase - Adding the Lambda */
            .then(product => {
              /* Then fetch our price using the above options */    
              return axios(authOptions).then(res => {
                /* Set our cost onto the Product object */
                product.cost = Math.round(res.data.cost);
                /* Then return the complete product object */
                return product;
              });
            });
        }
      }
    }
  )
});

module.exports = RootQueryType;
