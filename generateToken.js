const jwt = require("jsonwebtoken");
require('dotenv').config();

const SECRET = process.env.JWT_SECRET;

const token = jwt.sign({ role: "admin", name: "Rohith"}, SECRET, {expiresIn: '1h'});

console.log('\n==== Your Admin Bearer Token ====\n');
console.log(token);
