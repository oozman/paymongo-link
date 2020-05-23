require('dotenv').config();
const Paymongo = require('./paymongo');

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Parse application/json
app.use(bodyParser.json())

app.use(auth);

app.post('/links', async function (req, res) {
    const result = await makeLink({
        amount: req.body.amount,
        description: req.body.description,
        otherInfo: req.body.other_info
    });
    await res.json({data: result});
});

app.listen(80);

console.log("App is now running at 80");

/**
 * Auth middleware.
 *
 * @param req
 * @param res
 * @param next
 */
function auth(req, res, next) {
    if (req.get("Authorization") !== 'Bearer ' + process.env.APP_TOKEN) {
        res.status(400).json({errors: 'Unauthorized'});
    } else {
        next();
    }
}

/**
 * Make a paymongo link.
 *
 * @param amount
 * @param description
 * @param otherInfo
 * @returns {Promise<*>}
 */
async function makeLink({amount, description, otherInfo}) {
    const paymongo = new Paymongo();

    paymongo.setCredentials({
        username: process.env.PAYMONGO_USERNAME,
        password: process.env.PAYMONGO_PASSWORD,
        namespace: process.env.PAYMONGO_NAMESPACE
    });

    paymongo.setOptions({
        isTest: process.env.APP_ENV !== 'production',
        inputDelay: parseInt(process.env.APP_INPUT_DELAY),
        isHeadless: process.env.APP_HEADLESS === 'true',
        userAgent: process.env.APP_USER_AGENT
    })

    return await paymongo.getLink({
        amount: amount,
        description: description,
        otherInfo: otherInfo
    });
}
