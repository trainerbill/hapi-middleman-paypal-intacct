[![Build Status](https://travis-ci.org/trainerbill/hapi-middleman-paypal-intacct.svg?branch=master)](https://travis-ci.org/trainerbill/hapi-middleman-paypal-intacct)
[![Coverage Status](https://coveralls.io/repos/github/trainerbill/hapi-middleman-paypal-intacct/badge.svg?branch=master)](https://coveralls.io/github/trainerbill/hapi-middleman-paypal-intacct?branch=master)
[![npm version](https://badge.fury.io/js/hapi-middleman-paypal-intacct.svg)](https://badge.fury.io/js/hapi-middleman-paypal-intacct)
[![Dependency Status](https://david-dm.org/trainerbill/hapi-middleman-paypal-intacct.svg)](https://david-dm.org/trainerbill/hapi-middleman-paypal-intacct)
[![devDependency Status](https://david-dm.org/trainerbill/hapi-middleman-paypal-intacct/dev-status.svg)](https://david-dm.org/trainerbill/hapi-middleman-paypal-intacct#info=devDependencies)
[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)


# hapi-middleman-paypal-intacct
Hapi Middleman module to integrate between Intacct and PayPal.  This package is meant to be installed with the [generator application](https://github.com/trainerbill/generator-hapi-middleman) but can be installed manually as well.

# Environment Variables
Environment variables control the configuration of this plugin.

## Required Variables
Required environment variables for **ALL** functionality.

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
Required environment variables for invoicing functionality

#### PAYPAL_INVOICE_MERCHANT_EMAIL
PayPal Merchant Email.  This is required to be the email address associated with your REST client id.<br/>

#### INTACCT_INVOICE_PAYMENT_DEFAULT_ACCOUNT
The default Intacct account id to submit payments against.  If a currency account is not setup it will automatically submit payments to this account.<br/>

#### INTACCT_INVOICE_START_DATE
Sets the date to start picking up invoices.  Set this to your go live date.  valid dates are MM/DD/YYYY<br/>

## Optional Invoicing Variables
Optional environment variables for invoicing functionality<br/>

#### PAYPAL_INVOICE_MERCHANT_FIRST_NAME
Biller first name that shows up on invoice<br/>

#### PAYPAL_INVOICE_MERCHANT_LAST_NAME
Biller last name that shows up on invoice<br/>

#### PAYPAL_INVOICE_MERCHANT_BUSINESS_NAME
Biller business name that shows up on invoice<br/>

#### PAYPAL_INVOICE_MERCHANT_PHONE_COUNTRY_CODE
Biller phone country code that shows up on invoice<br/>
**Default: 1**<br/>

#### PAYPAL_INVOICE_MERCHANT_PHONE_NUMBER
Biller phone number that shows up on invoice<br/>

#### PAYPAL_INVOICE_MERCHANT_ADDRESS_LINE1
Biller street address that shows up on invoice<br/>

#### PAYPAL_INVOICE_MERCHANT_ADDRESS_LINE2
Biller additional street address that shows up on invoice<br/>

#### PAYPAL_INVOICE_MERCHANT_ADDRESS_CITY
Biller city address that shows up on invoice<br/>

#### PAYPAL_INVOICE_MERCHANT_ADDRESS_STATE
Biller additional state address that shows up on invoice<br/>
**2 character state**<br/>

#### PAYPAL_INVOICE_MERCHANT_COUNTRY_POSTAL_CODE
Biller zip code that shows up on invoice<br/>

#### INTACCT_INVOICE_CREATE_QUERY
Override the default intacct query for invoices to create.<br/>
**Default: "RAWSTATE = 'A' AND (PAYPALINVOICESTATUS IS NULL OR PAYPALINVOICESTATUS NOT IN ('CANCELLED')) AND TOTALDUE NOT IN (0)"**<br/>

#### INTACCT_INVOICE_CREATE_AUTO
Controls automatic creation of invoices.  If false it will require that the PAYPALINVOICING checkbox be checked on the Intacct Custom field<br/>
**Default: true**<br/>

#### INTACCT_INVOICE_CREATE_LATER
Controls the cron job for creating invoices.  Anything that can be parsed by [later package](https://bunkat.github.io/later/getting-started.html#example)<br/>
**Default: "every 1 hour"**<br/>

#### INTACCT_INVOICE_REFUND_QUERY
Override the default intacct query for invoices to refund.<br/>
**Default: "RAWSTATE = 'V' AND PAYPALINVOICESTATUS NOT IN ('REFUNDED', 'CANCELLED')"**<br/>

#### INTACCT_INVOICE_REFUND_AUTO
Controls automatic refunding of invoices.  If false it will require that the PAYPALINVOICING checkbox be checked on the Intacct Custom field<br/>
**Default: true**<br/>

#### INTACCT_INVOICE_REFUND_LATER
Controls the cron job for refunding invoices.  Anything that can be parsed by [later package](https://bunkat.github.io/later/getting-started.html#example)<br/>
**Default: "every 1 hour"**<br/>

#### INTACCT_INVOICE_PAYMENT_USD_ACCOUNT
he intacct account to submit payments of USD to.  If set then PayPal invoices of type USD will go to this intacct account.<br/>

# Intacct Custom Fields
Intacct custom fields let you add your own fields on top of the existing Intacct object fields.  
For the purpose of this integration, we just need to add custom fields for the invoice object.  
Following are the custom fields you'll require to create under your Intacct account and link to invoice object:
* PayPal Invoice ID
* PAYPALERROR
* PAYPALINVOICEURL
* PAYPALINVOICESTATUS
* PAYPALINVOICING

This screenshot lists them along with their respective types:
![list of custom field with types][cf1]

## Creating Custom Fields in Intacct
1. Click on the Platform services tab
![click on platform services][cf2]

2. Click on **Custom Fields**
![click on Custom Fields][cf3]

3. Click on the **Add** button
![click on the Add button][cf4]

4. The following 4 steps will appear. Refer the below table values at each step, for the custom fields we will end up creating.

#### Step 1: Choose Object to Extend.  
 In our case this will always be **invoice**

#### Step 2: Choose Field Data Type  
  
| Custom Field Name       | Data Type |  
| ----------------------- |----------:|  
| **PayPal Invoice ID**   | Text      |  
| **PAYPALERROR**         | Text Area |  
| **PAYPALINVOICEURL**    | URL       |  
| **PAYPALINVOICESTATUS** | Text      |  
| **PAYPALINVOICING**     | Check Box |  


#### Step 3: Choose Text Area Field Characteristics  

| Custom Field Name       | Label Value         | Number of rows to display / Lenght / Default Value | Field ID            | Description           |
| ----------------------- |:-------------------:|:--------------------------------------------------:|:-------------------:|:---------------------:|
| **PayPal Invoice ID**   | PayPal Invoice ID   | 24                                                 | PAYPALINVOICEID     | PayPal Invoice ID     |
| **PAYPALERROR**         | PAYPALERROR         | 10                                                 | PAYPALERROR         |                       |
| **PAYPALINVOICEURL**    | PAYPALINVOICEURL    | -                                                  | PAYPALINVOICEURL    |                       |
| **PAYPALINVOICESTATUS** | PAYPALINVOICESTATUS | 20                                                 | PAYPALINVOICESTATUS |                       |
| **PAYPALINVOICING**     | PAYPALINVOICING     | false                                              | PAYPALINVOICING     | Send a PayPal Invoice |

#### Step 4: Choose Deployment Options  

| Custom Field Name       | Field is required | Field is hidden | Field is inactive | Field Set  | Show on page  |
| ----------------------- |:-----------------:|:---------------:|:-----------------:|:----------:|:-------------:|
| **PayPal Invoice ID**   | false             | false           | false             |            | Custom Fields |
| **PAYPALERROR**         | false             | false           | false             |            | Custom Fields |
| **PAYPALINVOICEURL**    | false             | false           | false             |            | Custom Fields |
| **PAYPALINVOICESTATUS** | false             | false           | false             |            | Custom Fields |
| **PAYPALINVOICING**     | false             | false           | false             |            | Custom Fields |

Hit **Done** button to save the custom field

Now whenever you successfuly create a new invoice in Intacct and view its details, you should see the following custom fields we just created:
![inew_nvoice_custom_fields][cf5]
 

[cf1]: ./docs/images/intacct_custom_fields_list.png
[cf2]: ./docs/images/intacct_platform_services.png
[cf3]: ./docs/images/intacct_custom_fields_link.png
[cf4]: ./docs/images/intacct_custom_fields_add_link.png
[cf5]: ./docs/images/intacct_new_invoice_custom_fields.png
