process.on("SIGTERM", () => process.exit(1));

const { createServer } = require("http");
const { readFileSync } = require("fs");
const { sign } = require("jsonwebtoken");
const concat = require("concat-stream");

const key = readFileSync("/etc/jwks-jwt/keys/private.key");
const jwks = require("/etc/jwks-jwt/data/jwks.json");

const KID = jwks.keys[0].kid;
const ALG = "RS256";

const sendJWT = createJWTController(key);
const sendJWKS = createJWKSController(jwks);

const server = createServer((req, res) => {
  switch (req.method.toLowerCase()) {
    case "get":
      return sendJWKS(req, res);
    case "post":
      return sendJWT(req, res);
    default:
      return res.end();
  }
}).listen(8088);

function createJWTController(key) {
  return function sendJWT(req, res) {
    const jwt = createJWTFromReq(req, key);
    jwt.then(
      data => {
        res.writeHead(200, {
          "Content-Type": "text/plain",
          "Content-Length": data.length
        });
        res.end(data);
      },
      err => {
        res.writeHead(400);
        res.end(err.message);
      }
    );
  };
}

function createJWKSController(jwks) {
  const data = Buffer.from(JSON.stringify(jwks));
  return function sendJWKS(req, res) {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": data.length
    });
    res.end(data);
  };
}

function createJWTFromReq(req, key) {
  return new Promise(function(resolve, reject) {
    req.pipe(
      concat(function(post_data) {
        resolve(JSON.parse(post_data));
      })
    );
  })
    .then(data =>
      sign(data.claims, key, {
        algorithm: ALG,
        keyid: data.kid || KID
      })
    )
    .then(token => Buffer.from(token));
}
