const express = require("express");
const exphbs = require("express-handlebars");
const mercadopago = require("mercadopago");
const bodyParser = require("body-parser");
const port = process.env.PORT || 3000;
const path = require("path");
const fs = require("fs");

const testSeller = {
  collector_id: 469485398,
  publicKey: "APP_USR-7eb0138a-189f-4bec-87d1-c0504ead5626",
  accessToken:"APP_USR-6317427424180639-042414-47e969706991d3a442922b0702a0da44-469485398",
};
const testBuyer = {
  id: 471923173,
  email: "test_user_63274575@testuser.com",
  password: "qatest2417",
};

const app = express();
const URL = "https://quares-ventimiglia.herokuapp.com/";

mercadopago.configure({
  access_token: testSeller.accessToken,
  integrator_id: "dev_24c65fb163bf11ea96500242ac130004",
});

app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");
app.use(express.static("assets"));
app.use("/assets", express.static(__dirname + "/assets"));
app.use(express.urlencoded({ extended: false }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/detail", function (req, res) {
  res.render("detail", req.query);
});

app.post("/checkout", function (req, res) {
  const { img, title, price, unit } = req.body;

  const paymentMethods = {
    excluded_payment_methods: [
      {
        id: "amex",
      },
    ],
    excluded_payment_types: [
      {
        id: "atm",
      },
    ],
    installments: 6,
  };

  let preference = {
    items: [
      {
        id: 1234,
        title: title,
        description: "Dispositivo móvil de Tienda e-commerce",
        quantity: Number.parseInt(unit),
        unit_price: Number.parseFloat(price),
        picture_url: path.join(URL, img),
      },
    ],
    payer: {
      name: "Lalo",
      surname: "Landa",
      email: testBuyer.email,
      phone: {
        area_code: "11",
        number: 22223333,
      },
      address: {
        street_name: "False",
        street_number: 123,
        zip_code: "111",
      },
    },
    payment_methods: paymentMethods,
    back_urls: {
      success: URL + "success",
      pending: URL + "pending",
      failure: URL + "failure",
    },
    auto_return: "approved",
    notification_url: URL + "notifications",
    external_reference: "sventimiglia@quaresitsolutions.com",
  };

  mercadopago.preferences
    .create(preference)
    .then(function (response) {
      console.log("checkout preference", response.body);
      res.redirect(response.body.init_point);
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.get("/success", function (req, res) {
  if (req.query.payment_id) {

    res.render("status", {
      title: "Gracias por elegirnos!",
      message: "Su compra ha sido realizada exitosamente.",
      payment_info: {
        payment_id: req.query.payment_id,
        external_reference: req.query.external_reference,
        merchant_order_id: req.query.merchant_order_id,
        preference_id: req.query.preference_id
      },
    });
  } else {
    res.redirect("/");
  }
});
app.get("/pending", function (req, res) {
  if (req.query.payment_id) {
    res.render("status", {
      title: "Gracias por elegirnos!",
      message: "Su compra se encuentra pendiente.",
      payment_info: {
        payment_id: req.query.payment_id,
        external_reference: req.query.external_reference,
        merchant_order_id: req.query.merchant_order_id,
        preference_id: req.query.preference_id
      },
    });
  } else {
    res.redirect("/");
  }
});
app.get("/failure", function (req, res) {
  if (req.query.payment_id) {
    res.render("status", {
      title: "No pudimos procesar su pago",
      message:
        "Hubo un error al momento de realizar la compra, por favor pruebe con otro medio.",
      payment_info: {
        payment_id: req.query.payment_id,
        external_reference: req.query.external_reference,
        merchant_order_id: req.query.merchant_order_id,
        preference_id: req.query.preference_id
      },
    });
  } else {
    res.redirect("/");
  }
});

app.get("/notifications", (req, res) => {
  const jsonFile = require("./notifications.json");
  res.send(jsonFile);
});

app.post("/notifications", (req, res) => {

  console.log("notificacion", req.body);

  res.sendStatus(200);
});

app.listen(port);
