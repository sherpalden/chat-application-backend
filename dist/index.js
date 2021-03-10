"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const PORT = Number(process.env.PORT) || 5000;
app_1.server.listen(PORT, () => console.log('Server listening on port ' + PORT));
