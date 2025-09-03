const express = require('express');
const sequelize = require('./config');
const Routes = require('./routes');
const Stripe = require('stripe');
const app = express();
const cors = require('cors');
//import the cron job file here to work it properly

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// // 🔹 Webhook must come BEFORE json middleware
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
//
// app.post('/nija-cars/stripe/payment/webhook', express.raw({type: 'application/json'}), (request, response) => {
//     const sig = request.headers['stripe-signature'];
//
//     console.log("sig", sig)
//     console.log("endpointSecret", endpointSecret)
//     console.log("request.body", request.body)
//
//     let event;
//
//     try {
//         event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
//
//         console.log("event", event)
//     } catch (err) {
//         response.status(400).send(`Webhook Error: ${err.message}`);
//         return;
//     }
//
//     // Handle the event
//     switch (event.type) {
//         case 'checkout.session.async_payment_failed':
//             const checkoutSessionAsyncPaymentFailed = event.data.object;
//             console.log("checkoutSessionAsyncPaymentFailed", checkoutSessionAsyncPaymentFailed)
//             // Then define and call a function to handle the event checkout.session.async_payment_failed
//             break;
//         case 'checkout.session.async_payment_succeeded':
//             const checkoutSessionAsyncPaymentSucceeded = event.data.object;
//             console.log("checkoutSessionAsyncPaymentSucceeded", checkoutSessionAsyncPaymentSucceeded)
//             // Then define and call a function to handle the event checkout.session.async_payment_succeeded
//             break;
//         case 'payment_intent.payment_failed':
//             const paymentIntentPaymentFailed = event.data.object;
//             console.log("paymentIntentPaymentFailed", paymentIntentPaymentFailed)
//             // Then define and call a function to handle the event payment_intent.payment_failed
//             break;
//         case 'payment_intent.succeeded':
//             const paymentIntentSucceeded = event.data.object;
//             console.log("paymentIntentSucceeded", paymentIntentSucceeded)
//             // Then define and call a function to handle the event payment_intent.succeeded
//             break;
//         // ... handle other event types
//         default:
//             console.log(`Unhandled event type ${event.type}`);
//     }
//
//     // Return a 200 response to acknowledge receipt of the event
//     response.send();
// });

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Use EXACT path you configured in Stripe (note your code uses /nija-cars/...)

// const endpointSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
app.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object; // type: Stripe.Checkout.Session

        // ✅ What you asked for:
        const email = session.customer_details?.email || null;     // buyer email
        const metadata = session.metadata || {};                   // your metadata from session create

        // (Optional) If you also want line items and full charge details:
        const [lineItems, pi] = await Promise.all([
            stripe.checkout.sessions.listLineItems(session.id, { limit: 100 }),
            stripe.paymentIntents.retrieve(session.payment_intent, { expand: ['latest_charge'] }),
        ]);

        const chargeEmail = pi.latest_charge?.billing_details?.email || null;

        console.log('SESSION META:', JSON.stringify(metadata));
        console.log('BUYER EMAIL:', email, '(from session.customer_details.email)');
        console.log('CHARGE EMAIL:', chargeEmail, '(from latest_charge.billing_details.email)');
        console.log('LINE ITEMS:', JSON.stringify(lineItems.data, null, 2));

        // TODO: fulfill order using metadata, email, lineItems, etc.
    }

    return res.sendStatus(200);
});

// app.post('/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
//     const sig = req.headers['stripe-signature'];
//     let event;
//     console.log("endpointSecret", endpointSecret)
//     console.log("sig", sig)
//     console.log("body", req.body)
//     try {
//         event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//         console.log('✅ Verified:', event);
//     } catch (err) {
//         console.error('❌ Verify failed:', err.message);
//         return res.status(400).send(`Webhook Error: ${err.message}`);
//     }
//
//     // Handle only events you need
//     switch (event.type) {
//         case 'checkout.session.completed':
//             console.log('checkout.session.completed:', event.data.object.id);
//             break;
//         case 'payment_intent.succeeded':
//             console.log('payment_intent.succeeded:', event.data.object.id);
//             break;
//         default:
//             console.log(`Unhandled event type ${event.type}`);
//     }
//
//     res.sendStatus(200);
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