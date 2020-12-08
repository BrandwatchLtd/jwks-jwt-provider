# jwks-jwt-provider

Do not use this in production ever.

It's only usage should be to test JWT/JWKS integrations for your backend apis.

## usage

### `GET`

Make a `GET` request to the server to receive a valid JWKS

### `POST`

#### AdminGetUser

 * Include `NotFound` in the email address to get a 400 response.
 * Include `confirmed` in the email address to get user status of CONFIRMED

#### JWT
Make a `POST` request to the server to receive a valid JWT signed with the private side of the public key stored in the JWKS

Send a JSON body to add claims to the token

```json
{
  "claims": {
    "sub": "12345",
    "etc": "..."
  }
}
```

You can also override the `kid` to test "key not found" code paths

```json
{
  "kid": "whatever",
  "claims": {}
}
```
