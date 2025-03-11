require("dotenv").config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

// exports.stripeCheckout= async(req,res)=>{
//     stripe.charges.create({
//         source:req.body.tokenId,
//         amount:req.body.amount,
//         currency:'usd'
//     },(stripeErr,stripeRes)=>{
//         if(stripeErr){
//             res.status(500).json(stripeErr)
//         }else{
//             res.status(200).json(stripeRes)
//         }
//     })
// }

// Exportez la fonction stripeCheckout
exports.stripeCheckout = async (req, res) => {
    try {
      const charge = await stripe.charges.create({
        source: req.body.tokenId,
        amount: req.body.amount,
        currency: 'usd',
      });
      res.status(200).json(charge); // Réponse en cas de succès
    } catch (stripeErr) {
      res.status(500).json(stripeErr); // Réponse en cas d'erreur
    }
  };
  