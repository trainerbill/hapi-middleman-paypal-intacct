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
| PAYPAL_INVOICE_MERCHANT_FIRST_NAME | Biller first name that shows up on invoice | string | undefined | false |
| PAYPAL_INVOICE_MERCHANT_LAST_NAME | Biller last name that shows up on invoice | string | undefined | false |
| PAYPAL_INVOICE_MERCHANT_BUSINESS_NAME | Biller Business name that shows up on invoice | string | undefined | false |
| PAYPAL_INVOICE_MERCHANT_PHONE_COUNTRY_CODE | Country code of biller phone number that shows up on invoice | number | 1 | false |
| PAYPAL_INVOICE_MERCHANT_PHONE_NUMBER | Phone number of biller that shows up on invoice | number | undefined | false |
| PAYPAL_INVOICE_MERCHANT_ADDRESS_LINE1 | Biller street that shows up on invoice | string | undefined | false |
| PAYPAL_INVOICE_MERCHANT_ADDRESS_LINE2 | Biller additional street that shows up on invoice | string | undefined | Required if any other address info is present |
| PAYPAL_INVOICE_MERCHANT_ADDRESS_CITY | Biller city that shows up on invoice | string | undefined | Required if any other address info is present |
| PAYPAL_INVOICE_MERCHANT_ADDRESS_STATE | State of biller that shows up on invoice | string | undefined | Required if any other address info is present |
| PAYPAL_INVOICE_MERCHANT_COUNTRY_POSTAL_CODE | Postal code of biller that shows up on invoice | string | undefined | Required if any other address info is present |
| INTACCT_INVOICE_CREATE_QUERY | Override the default intacct query for invoices to create. | string | "RAWSTATE = 'A' AND (PAYPALINVOICESTATUS IS NULL OR PAYPALINVOICESTATUS NOT IN ('CANCELLED')) AND TOTALDUE NOT IN (0)" | false |
| INTACCT_INVOICE_CREATE_AUTO | Controls automatic creation of invoices.  If false it will require that the PAYPALINVOICING checkbox be checked on the Intacct Custom field | string | true | true |
| INTACCT_INVOICE_CREATE_LATER | Controls the cron job for creating invoices. | string: anything that can be parsed by [later package](https://bunkat.github.io/later/getting-started.html#example) | every 1 hour | true |
| INTACCT_INVOICE_REFUND_QUERY | Override the default intacct query for invoices to refund. | string | "RAWSTATE = 'V' AND PAYPALINVOICESTATUS NOT IN ('REFUNDED', 'CANCELLED')" | false |
| INTACCT_INVOICE_REFUND_AUTO | Controls automatic refunding of invoices.  If false it will require that the PAYPALINVOICING checkbox be checked on the Intacct Custom field | string | true | true |
| INTACCT_INVOICE_REFUND_LATER | Controls the cron job for creating invoices. | string: anything that can be parsed by [later package](https://bunkat.github.io/later/getting-started.html#example) | every 1 day | true |
| INTACCT_INVOICE_PAYMENT_DEFAULT_ACCOUNT | The default Intacct account id to submit payments against.  If a currency account is not setup it will automatically submit payments to this account. | string | undefined | true |
| INTACCT_INVOICE_PAYMENT_USD_ACCOUNT | The intacct account to submit payments of USD to. | string | undefined | false |
| INTACCT_INVOICE_START_DATE | Sets the date to start picking up invoices.  Set this to your go live date. | string: '8/24/2017' | undefined | true |


