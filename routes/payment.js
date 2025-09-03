const {Router} = require('express');
const router = Router();
// const app = express();
const SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEB_URL = process.env.APP_URL;
const BASE_URL = process.env.API_URL;

const stripe = require('stripe')(SECRET_KEY)

router.post('/create-checkout-session', async (req, res) => {
    try {
        const { product, userId, cardCustomizationId  } = req.body;
        console.log("product from frontend:", product);

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'aud',
                        product_data: {
                            carImage: product.carImage,
                            title: product.title,

                        },
                        unit_amount: Math.round(product.price * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${WEB_URL}/success`,
            cancel_url: `${WEB_URL}/cancel`,
            metadata: {
                title: product.title,
                price: product.price,
                carImage: product.carImage
            }
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error("Error creating checkout session:", err);
        res.status(500).json({ error: err.raw?.message || 'Stripe error' });
    }
});

module.exports = router;
