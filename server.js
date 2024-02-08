// server.js
const express = require("express");
const bodyParser = require("body-parser");
const { routes } = require("./src/API/api");
const { PORT } = require("./src/utils/config");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const app = express();

app.disable("x-powered-by");
app.use(bodyParser.json({ limit: 1000000 }));
app.use(bodyParser.urlencoded({ limit: 1000000, extended: true }));

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Whatsapp API",
      version: "1.0.0",
      description: "APIs direcionadas para o whatsapp ultilizando a biblioteca whatsapp-web.js",
    },
  },
  apis: ["./src/API/api.js"],
};

const specs = swaggerJsdoc(options);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use("/", routes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
