# jwks-jwt-provider

Do not use this in production ever.

It's only usage should be to test JWT/JWKS integrations for your backend apis.

### usage

#### `GET`

Make a `GET` request to the server to receive a valid JWKS

#### `POST`

Make a `POST` request to the server to receive a valid JWT signed with the private side of the public key stored in the JWKS

Send a JSON body to add claims to the token

```json
{
  "alg": "RS256", // default
  "key": "whatever", // only use to test invalid id, the correct one will be used otherwise
  "claims": {
    "sub": "12345",
    "etc": "..."
  }
}
```
