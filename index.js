const express = require("express");
const mongoose = require("mongoose");
const loginUserDetails = require("./login");
const createUserDetails = require('./signup')
const app = express();
const middleware = require('./middleware')
const jwt = require('jsonwebtoken')
const cors = require('cors')
app.use(express.json()); // mididle ware
app.use(cors({ origin: '*' }));
const nodemailer = require('nodemailer');
mongoose
    .connect("mongodb+srv://haridevworld2022:merntypescript@cluster0.zx2nmhm.mongodb.net/userdata", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("DB connection successful");
    })
    .catch((err) => {
        console.error("DB connection error:", err);
    });



// Nodemailer setup
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: 'doradla.hari@gmail.com',
        pass: 'erkluzuuibckjyan'
    }
});

// Function to send welcome email
const sendWelcomeEmail = (email) => {
    const mailOptions = {
        from: 'haridevworld2022@gmail.com',
        to: email,
        subject: 'Welcome to Our Application',
        text: 'Thank you for registering with our application. We are excited to have you on board!',
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending welcome email:', error);
        } else {
            console.log('Welcome email sent:', info.response);
            res.status(200).send(info.response)
        }
    });
};



app.get("/", (req, res) => {
    res.send("Hello hari");
});

app.get("/login", (req, res) => {
    res.send("login page");
});
app.get("/signup", (req, res) => {
    res.send("signup page");
});

// login operations
//post method
app.post("/loginuser", async (req, res) => {
    try {
        const { email } = req.body;
        const { password } = req.body;
        const loggedInUserData = new loginUserDetails({ email, password });
        let exist = await createUserDetails.findOne({ email: email })
        if (!exist) {
            return res.send("user not found")
        }
        if (exist.password !== password) {
            return res.send("invalid credentails")
        }
        let payload = {
            user: {
                id: exist.id
            }
        }
        // Set the token in the browser headers

        jwt.sign(payload, "jwtSecret", { expiresIn: 3600000 },
            (err, token) => {
                if (err) throw err;
                return res.json({ token })
            }
        )
        await loggedInUserData.save();
        res.setHeader('Authorization', `Bearer ${token}`);
        res.status(200).send("successfully loggedin!")
    } catch (err) {
        console.log(err);
        return res.status(500).send("internal server error")
    }
});


app.get("/myprofile", middleware, async (req, res) => {
    try {
        let exist = await createUserDetails.findById(req.user.id)
        if (!exist) {
            return res.send('user not found')
        }
        res.json(exist)
    }
    catch (err) {
        console.log(err)
        return res.status(500).send('internal server error!')
    }
})

app.post("/createuser", async (req, res) => {
    const { firstName } = req.body;
    const { lastName } = req.body;
    const { email } = req.body;
    const { mobileNumber } = req.body;
    const { password } = req.body;
    const { conformPassword } = req.body;
    try {
        const newUserData = new createUserDetails({ firstName, lastName, email, mobileNumber, password, conformPassword });
        let exist = await createUserDetails.findOne({ email: email })
        if (exist) {
            return res.send('user alredy exists')
        }
        if (password !== conformPassword) {
            return res.send('password mismatch')
        }
        await newUserData.save();
        // res.status(200).send("registration sucessfull!")
        // Send welcome email
        sendWelcomeEmail(email);
        res.status(200).send(`Hello, ${firstName} your registration sucessfull! and you have received an email to this email ${email}`)
    } catch (err) {
        console.log(err);
        return res.status(500).send("internal server error!")
    }
});

app.listen(5000, () => console.log("server running............"));
module.exports = app 