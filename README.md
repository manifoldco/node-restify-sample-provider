# Sample Manifold Provider (Node.js/Restify)

This repo contains a a minimal provider using Restify and Node.js.
It provides digital cat bonnets as a service; fun!

# Testing the app with Grafton

Grafton is the test framework used to verify your provider implementation is
correct.

Contact [support@manifold.co](mailto:support@manifold.co) to get access to
Grafton.


To use Grafton to verify this sample provider:

```bash
# create a test master key for grafton to use when acting as Manifold
# this file is written as masterkey.json
grafton generate

# MASTER_KEY is the public key creating by the grafton generate command
# Make sure to update this value after running grafton generate.
export MASTER_KEY=2LABDMv5jA2pIIF1+HoFk/5ilsfKTrMLOEQbrAAeA2E=

# CONNECTOR_URL is the url that Grafton will listen on. It corresponds to
# Grafton's --sso-port flag.
export CONNECTOR_PORT=3001
export CONNECTOR_URL=http://localhost:$CONNECTOR_PORT

# Set fake OAuth 2.0 credentials. The format of these are specific, so you can
# reuse the values here.
export CLIENT_ID=21jtaatqj8y5t0kctb2ejr6jev5w8
export CLIENT_SECRET=3yTKSiJ6f5V5Bq-kWF0hmdrEUep3m3HKPTcPX7CdBZw

# install dependencies and run the sample app
npm install
npm start

# In another shell, run grafton.
grafton test --product=bonnets --plan=small --region=aws::us-east-1 \
    --client-id=$CLIENT_ID \
    --client-secret=$CLIENT_SECRET \
    --connector-port=$CONNECTOR_PORT \
    --new-plan=large \
    $CONNECTOR_URL

# If everything went well, you'll be greeted with plenty of green check marks!
```
