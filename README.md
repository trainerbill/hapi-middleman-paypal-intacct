[![Build Status](https://travis-ci.org/trainerbill/hapi-middleman-paypal-intacct.svg?branch=master)](https://travis-ci.org/trainerbill/hapi-middleman-paypal-intacct)
[![Coverage Status](https://coveralls.io/repos/github/trainerbill/hapi-middleman-paypal-intacct/badge.svg?branch=master)](https://coveralls.io/github/trainerbill/hapi-middleman-paypal-intacct?branch=master)
[![npm version](https://badge.fury.io/js/hapi-middleman-paypal-intacct.svg)](https://badge.fury.io/js/hapi-middleman-paypal-intacct)
[![Dependency Status](https://david-dm.org/trainerbill/hapi-middleman-paypal-intacct.svg)](https://david-dm.org/trainerbill/hapi-middleman-paypal-intacct)
[![devDependency Status](https://david-dm.org/trainerbill/hapi-middleman-paypal-intacct/dev-status.svg)](https://david-dm.org/trainerbill/hapi-middleman-paypal-intacct#info=devDependencies)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)


# hapi-middleman-paypal-intacct
Hapi Middleman module to integrate between Intacct and PayPal.  This package is meant to be installed with the [generator application](https://github.com/trainerbill/generator-hapi-middleman) but can be installed manually as well.

# Environment Variables
Environment variables control the configuration of this plugin.  The table below lists the environment variables and their functionality.

## Variable required by all functionality

| Name | Description | Values  | Default | Required |
| ------------- |-----------------------:| -----:| -----:| -----:|
| INTACCT_SENDER_ID | Intacct Sender ID credential.  Given by Intacct | string | undefined | true |
| INTACCT_SENDER_PASSWORD | Intacct Sender Password credential.  Given by Intacct | string | undefined | true |
| INTACCT_USER_ID | Intacct User ID credential. From Intacct | string | undefined | true |
| INTACCT_USER_PASSWORD | Intacct User Password. From Intacct | string | undefined | true |
| INTACCT_COMPANY_ID | Intacct Company ID. From Intacct | string | undefined | true |
| PAYPAL_CLIENT_ID | PayPal REST API Client ID | string | undefined | true |
| PAYPAL_CLIENT_SECRET | PayPal REST API Client Secred | string | undefined | true |
| PAYPAL_MODE | PayPal Environment | "sandbox" or "production" | undefined | true |
| PAYPAL_WEBHOOK_HOSTNAME | URL to receive PayPal Webhooks. Must be https | URL | the default route is /paypal/webhooks/listen.  Ex:  https://yourhostname.com/paypal/webhooks/listen | true |


## Invoicing Variables
| Name | Description | Values  | Default | Required |
| ------------- |-----------------------:| -----:| -----:| -----:|
| PAYPAL_MERCHANT_EMAIL | PayPal Merchant Email.  This is required to be the email address associated with your REST client id. | email address | undefined | true |
| PAYPAL_MERCHANT_FIRST_NAME | Biller first name that shows up on invoice | string | undefined | false |
| PAYPAL_MERCHANT_LAST_NAME | Biller last name that shows up on invoice | string | undefined | false |
| PAYPAL_MERCHANT_BUSINESS_NAME | Biller Business name that shows up on invoice | string | undefined | false |
| PAYPAL_MERCHANT_PHONE_COUNTRY_CODE | Country code of biller phone number that shows up on invoice | number | 1 | false |
| PAYPAL_MERCHANT_PHONE_NUMBER | Phone number of biller that shows up on invoice | number | undefined | false |

=Dennis
=Doctor
=ACME
=1
=4082564877
PAYPAL_MERCHANT_ADDRESS_LINE1=2211 North First St
PAYPAL_MERCHANT_ADDRESS_CITY=San Jose
PAYPAL_MERCHANT_COUNTRY_STATE=CA
PAYPAL_MERCHANT_COUNTRY_POSTAL_CODE=95131
PAYPAL_MERCHANT_COUNTRY_CODE=US
PAYPAL_WEBHOOK_HOSTNAME=https://middleman-test-trainerbill.c9users.io/paypal/webhooks/listen
INVOICING_AUTO=true
HAPI_DEBUG=true
GOOD_HTTP_URL=https://middleman-test-trainerbill.c9users.io
INVOICE_PAYMENT_DEFAULT_ACCOUNT=Suntrust
