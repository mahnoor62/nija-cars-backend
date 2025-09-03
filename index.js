const express = require('express');
const sequelize = require('./config');
const Routes = require('./routes');
const Stripe = require('stripe');
const app = express();
const cors = require('cors');
//import the cron job file here to work it properly

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔹 Webhook must come BEFORE json middleware
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

app.post('/nija-cars/stripe/payment/webhook', express.raw({type: 'application/json'}), (request, response) => {
    const sig = request.headers['stripe-signature'];

    console.log("sig", sig)
    console.log("endpointSecret", endpointSecret)
    console.log("request.body", request.body)

    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);

        console.log("event", event)
    } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.async_payment_failed':
            const checkoutSessionAsyncPaymentFailed = event.data.object;
            console.log("checkoutSessionAsyncPaymentFailed", checkoutSessionAsyncPaymentFailed)
            // Then define and call a function to handle the event checkout.session.async_payment_failed
            break;
        case 'checkout.session.async_payment_succeeded':
            const checkoutSessionAsyncPaymentSucceeded = event.data.object;
            console.log("checkoutSessionAsyncPaymentSucceeded", checkoutSessionAsyncPaymentSucceeded)
            // Then define and call a function to handle the event checkout.session.async_payment_succeeded
            break;
        case 'payment_intent.payment_failed':
            const paymentIntentPaymentFailed = event.data.object;
            console.log("paymentIntentPaymentFailed", paymentIntentPaymentFailed)
            // Then define and call a function to handle the event payment_intent.payment_failed
            break;
        case 'payment_intent.succeeded':
            const paymentIntentSucceeded = event.data.object;
            console.log("paymentIntentSucceeded", paymentIntentSucceeded)
            // Then define and call a function to handle the event payment_intent.succeeded
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
});

// app.post('/stripe/payment/webhook', express.raw({ type: '*/*' }), (req, res) => {
//     const sig = req.headers['stripe-signature'];
//     const secret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim(); // trim = important
//
//     try {
//         const event = stripe.webhooks.constructEvent(req.body, sig, secret);
//         console.log('✅ Verified:', event.type, event.id);
//
//         if (event.type === 'checkout.session.completed') {
//             const session = event.data.object;
//             console.log('checkout.session.completed:', session.id);
//         } else if (event.type === 'payment_intent.succeeded') {
//             console.log('payment_intent.succeeded:', event.data.object.id);
//         }
//         return res.sendStatus(200);
//     } catch (err) {
//         console.error('❌ Verify failed:', err.message, {
//             ct: req.headers['content-type'],
//             clen: req.headers['content-length'],
//             bufLen: Buffer.isBuffer(req.body) ? req.body.length : 'not-buffer',
//         });
//         return res.status(400).send('Bad signature');
//     }
// });



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use(express.static(__dirname + '/public'));


const CORS_OPTIONS = process.env.CORS_OPTIONS;
let corsOrigins = [];

if (CORS_OPTIONS) {
    corsOrigins = CORS_OPTIONS.split(',').map(origin => origin.trim());
}

const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));


app.use('/api', Routes);

app.get('/', (req, res) => {
    res.send('Hello, From Nija cars!');

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);

    try {
        // Check database connection
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Synchronize Sequelize models with database (if needed)
        await sequelize.sync();
        console.log('Database synchronized');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
});