const express = require('express');
const sequelize = require('./config');
const Routes = require('./routes');
const Stripe = require('stripe');
const app = express();
const cors = require('cors');
//import the cron job file here to work it properly

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);



const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// 🔹 Webhook must come BEFORE json middleware
app.post('/stripe/payment/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    console.log("endpointSecret", endpointSecret)
    console.log("sig", sig)
    console.log("req.body", req.body)
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        console.log("✅ Event received:", event.data.object);
        const userCheckOutId = event?.data?.object?.id;
        console.log("✅ userCheckOutId:", userCheckOutId);
    } catch (err) {
        console.error("❌ Strip payment Error:", err.message);
        return res.status(400).send(`Strip payment Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log("✅ Payment successful:", session);

        try {
            // const existing = await Transaction.findOne({user_id, cardCustomizationId});
            // if (existing) {
            //     existing.checkout_id = session.id;
            //     existing.payment_inten = session.payment_intent;
            //     existing.price = session.metadata.price;
            //     existing.status = session.payment_status;
            // }

            // await Transaction.create({
            //     user_id: session.metadata.userId,
            //     cardCustomizationId: session.metadata.cardCustomizationId,
            //     checkout_id: session.id,
            //     payment_intent: session.payment_intent,
            //     aud: session.amount_total,
            //     price: session.metadata.price,
            //     status: session.payment_status,
            //     // title:session.metadata.title,
            //     // time: new Date()
            //     // // data: session
            // });
            console.log("✅ Transaction saved!", existing);
        } catch (err) {
            console.error("❌ Error saving transaction:", err);
        }
    }

    res.json({received: true});
});




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