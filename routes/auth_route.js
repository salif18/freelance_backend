const express = require("express");
const Router = express.Router();


const Auth_Controller = require("../controllers/auth_controller");
const Complete_info_Controller = require("../controllers/complete_formulaire")

Router.post("/registre",Auth_Controller.register);
Router.post("/login",Auth_Controller.login);

Router.put("/user/:userId", Complete_info_Controller.completInfos);


module.exports = Router;