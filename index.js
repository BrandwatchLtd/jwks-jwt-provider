process.on("SIGTERM", () => process.exit(1));

const { createServer } = require("http");
const { readFileSync } = require("fs");
const { sign } = require("jsonwebtoken");
const concat = require("concat-stream");
const uuid = require("uuid-random");

const key = readFileSync("/etc/jwks-jwt/keys/private.key");
const jwks = require("/etc/jwks-jwt/data/jwks.json");

const KID = jwks.keys[0].kid;
const ALG = "RS256";

const sendJWT = createJWTController(key);
const sendJWKS = createJWKSController(jwks);

const emptyData = "{}";
const emptyJson = JSON.parse(emptyData)
const apiUrl = "/dummy-user-pool/"

const adminGetUserTarget = "AWSCognitoIdentityProviderService.AdminGetUser"
const adminCreateUserTarget = "AWSCognitoIdentityProviderService.AdminCreateUser"

const server = createServer((req, res) => {
  const requestMethod = req.method.toLowerCase();
  const requestUrl = req.url.toLowerCase();
  const target = req.headers["x-amz-target"]

  if (requestMethod === "get") {
    // Return the public keys
    // URL will be / or /dummy-user-pool/.well-known/jwks.json
    return sendJWKS(req, res);
  }

  if (requestMethod !== "post") {
    return res.end();
  }

  // Not an API call.
  if (requestUrl !== apiUrl) {
    return sendJWT(req, res);
  }

  let requestData = '';
  req.on('data', chunk => {
    requestData += chunk;
  })
  req.on('end', () => {
    return apiCall(target, requestData, requestUrl, res)
  })
}).listen(8088);

function apiCall(target, requestData, url, res) {
  let jsonData;
  try {
    jsonData = JSON.parse(requestData);
  } catch (exception) {
    jsonData = emptyJson;
  }

  if (target === adminGetUserTarget) {
    return adminGetUser(jsonData["Username"], res)
  }

  if (target === adminCreateUserTarget) {
    return adminCreateUser(jsonData["Username"], res)
  }

  console.log("Unsupported API Call:", target, jsonData)

  res.writeHead(200, {
    "Content-Type": "application/json",
    "Content-Length": emptyData.length
  });

  return res.end(emptyData);
}

function adminGetUser(email, res) {
  if (email.toLowerCase().indexOf("notfound") !== -1) {

    res.writeHead(400, {
      "x-amzn-ErrorType": "UserNotFoundException"
    });

    return res.end();
  }

  const currentTime = Date.now();
  const status = email.toLowerCase().indexOf("confirmed") === -1 ? "UNCONFIRMED" : "CONFIRMED";

  const data = `{
    "Enabled": true,
    "MFAOptions": [],
    "PreferredMfaSetting": "None",
    "UserAttributes": [],
    "UserCreateDate": ${currentTime},
    "UserLastModifiedDate": ${currentTime},
    "UserMFASettingList": [],
    "Username": "${email}",
    "UserStatus": "${status}"
  }`;

  res.writeHead(200, {
    "Content-Type": "application/json",
    "Content-Length": data.length
  });

  return res.end(data);
}

function adminCreateUser(email, res) {
  const currentTime = Date.now();
  const status = "FORCE_CHANGE_PASSWORD";

  const data = `{
    "User": {
      "Attributes": [
        {"Name": "sub", "Value": "${uuid()}"}
      ],
      "Enabled": true,
      "MFAOptions": [],
      "UserCreateDate": ${currentTime},
      "UserLastModifiedDate": ${currentTime},
      "Username": "${email}",
      "UserStatus": "${status}"
    }
  }`;

  res.writeHead(201, {
    "Content-Type": "application/json",
    "Content-Length": data.length
  });

  return res.end(data);
}

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
