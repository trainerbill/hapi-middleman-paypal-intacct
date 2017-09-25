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

## Required Variables

#### INTACCT_SENDER_ID
Intacct Sender ID credential.  Given by Intacct<br/>

#### INTACCT_SENDER_PASSWORD
Intacct Sender Password credential.  Given by Intacct<br/>

#### INTACCT_USER_ID
Intacct User ID credential.  From Intacct users<br/>

#### INTACCT_USER_PASSWORD
Intacct User Password credential.  From Intacct users<br/>

#### INTACCT_COMPANY_ID
Intacct Company ID. From Intacct<br/>

#### PAYPAL_CLIENT_ID
PayPal REST API Client ID.  From developer.paypal.com<br/>

#### PAYPAL_CLIENT_SECRET
PayPal REST API Client Secret.  From Intacct users<br/>

#### PAYPAL_MODE
PayPal environment<br/>
**Values: "sandbox" or "production"**<br/>

#### PAYPAL_WEBHOOK_HOSTNAME
URL to receive PayPal Webhooks. Must be https.  The def<br/>
**Value: Add /paypal/webhooks/listen to your hostname.  Ex: https://example.com/paypal/webhooks/listen**<br/>



## Required Invoicing Variables

#### PAYPAL_INVOICE_MERCHANT_EMAIL
PayPal Merchant Email.  This is required to be the email address associated with your REST client id.<br/>

#### INTACCT_INVOICE_PAYMENT_DEFAULT_ACCOUNT
The default Intacct account id to submit payments against.  If a currency account is not setup it will automatically submit payments to this account.

#### INTACCT_INVOICE_START_DATE
Sets the date to start picking up invoices.  Set this to your go live date.  valid dates are MM/DD/YYYY

## Optional Invoicing Variables

#### PAYPAL_INVOICE_MERCHANT_FIRST_NAME
Biller first name that shows up on invoice

#### PAYPAL_INVOICE_MERCHANT_LAST_NAME
Biller last name that shows up on invoice

#### PAYPAL_INVOICE_MERCHANT_BUSINESS_NAME
Biller business name that shows up on invoice

#### PAYPAL_INVOICE_MERCHANT_PHONE_COUNTRY_CODE
Biller phone country code that shows up on invoice
**Default: 1**

#### PAYPAL_INVOICE_MERCHANT_PHONE_NUMBER
Biller phone number that shows up on invoice

#### PAYPAL_INVOICE_MERCHANT_ADDRESS_LINE1
Biller street address that shows up on invoice

#### PAYPAL_INVOICE_MERCHANT_ADDRESS_LINE2
Biller additional street address that shows up on invoice

#### PAYPAL_INVOICE_MERCHANT_ADDRESS_CITY
Biller city address that shows up on invoice

#### PAYPAL_INVOICE_MERCHANT_ADDRESS_STATE
Biller additional state address that shows up on invoice
**2 character state**

#### PAYPAL_INVOICE_MERCHANT_COUNTRY_POSTAL_CODE
Biller zip code that shows up on invoice

#### INTACCT_INVOICE_CREATE_QUERY
Override the default intacct query for invoices to create.
**Default: "RAWSTATE = 'A' AND (PAYPALINVOICESTATUS IS NULL OR PAYPALINVOICESTATUS NOT IN ('CANCELLED')) AND TOTALDUE NOT IN (0)"**

#### INTACCT_INVOICE_CREATE_AUTO
Controls automatic creation of invoices.  If false it will require that the PAYPALINVOICING checkbox be checked on the Intacct Custom field
**Default: true**

#### INTACCT_INVOICE_CREATE_LATER
Controls the cron job for creating invoices.  Anything that can be parsed by [later package](https://bunkat.github.io/later/getting-started.html#example)
**Default: "every 1 hour"**

#### INTACCT_INVOICE_REFUND_QUERY
Override the default intacct query for invoices to refund.
**Default: "RAWSTATE = 'V' AND PAYPALINVOICESTATUS NOT IN ('REFUNDED', 'CANCELLED')"**

#### INTACCT_INVOICE_REFUND_AUTO
Controls automatic refunding of invoices.  If false it will require that the PAYPALINVOICING checkbox be checked on the Intacct Custom field
**Default: true**

#### INTACCT_INVOICE_REFUND_LATER
Controls the cron job for refunding invoices.  Anything that can be parsed by [later package](https://bunkat.github.io/later/getting-started.html#example)
**Default: "every 1 hour"**

#### INTACCT_INVOICE_PAYMENT_USD_ACCOUNT
he intacct account to submit payments of USD to.  If set then PayPal invoices of type USD will go to this intacct account.

