const express = require("express");
const mongoose = require("mongoose");
const loginUserDetails = require("./login");
const createUserDetails = require('./signup')
const app = express();
const generateOTPValue = require('./otp/otp')
const resetPassword = require('./resetpassword/resetpassword')
const middleware = require('./middleware')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const fs = require('fs')
app.use(express.json()); // mididle ware
app.use(cors({ origin: '*' }));
const nodemailer = require('nodemailer');
mongoose
    .connect("mongodb+srv://haridevworld2022:merntypescriptapi@cluster0.firewrq.mongodb.net/userdata",
        // {
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true,
        // }
    )
    .then(() => {
        console.log("DB connection successful");
    })
    .catch((err) => {
        console.error("DB connection error:", err);
    });

// video streaming
const videoFileMap = {
    "cdn": 'videos/cdn.mp4',
    'generate-pass': 'videos/generate-pass.mp4',
    'get-post': 'videos/get-post.mp4',
    'index-video': 'videos/index-video.mp4',
    'cricket': 'videos/cricket.mp4'
}
app.get('/videos/:filename', (req, res) => {
    const fileName = req.params.filename
    const filePath = videoFileMap[fileName]
    if (!filePath) {
        return res.status(404).send('File not found')
    }
    const stat = fs.statSync(filePath)
    const fileSize = stat.size
    const range = req.headers.range

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

        const chunkSize = end - start + 1
        const file = fs.createReadStream(filePath, { start, end })
        const head = {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize,
            "Content-Type": "video/mp4",
        };
        return res.writeHead(206, head),
            file.pipe(res)
    } else {
        const head = {
            "Content-Length": fileSize,
            "Content-Type": "video/mp4",
        };
        return res.writeHead(200, head),
            fs.createReadStream(filePath).pipe(res)
    }
})


// otp method 
function generateOTP() {
    var characters = "0123456789";
    var otp = "";
    for (var i = 0; i < 6; i++) {
        var randomIndex = Math.floor(Math.random() * characters.length);
        otp += characters.charAt(randomIndex);
    }
    return otp;
}

// Generate OTP
var otp = generateOTP();

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
const sendWelcomeEmail = async (email) => {

    // saving otp in to DB
    const storeOtp = new generateOTPValue({ otp: otp, email: email });
    await storeOtp.save();
    const mailOptions = {
        from: 'haridevworld2022@gmail.com',
        to: email,
        subject: 'Welcome to Our Application',
        text: `Thank you for registering with our application. We are excited to have you on board! Here is your OTP: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending welcome email:', error);
        } else {
            res.status(200).send(info.response)
        }
        let exist = generateOTPValue.findOne({ otp: otp })
        if (!exist) {
            return res.send('invalid otp')
        } else {
            res.status(200).send(`otp sent sucessfully`)
            return res.send('valid otp')
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

// protected route
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

// signup method
app.post("/createuser", async (req, res) => {
    const { firstName } = req.body;
    const { lastName } = req.body;
    const { email } = req.body;
    const { mobileNumber } = req.body;
    const { password } = req.body;
    const { conformPassword } = req.body;
    try {
        const newUserData = new createUserDetails({ firstName, lastName, email, mobileNumber, password, conformPassword });
        // validating email for exists and non exists
        let exist = await createUserDetails.findOne({ email: email })
        if (exist) {
            return res.send('user alredy exists')
        }
        if (password !== conformPassword) {
            return res.send('password mismatch')
        }
        await newUserData.save();
        // Send welcome email
        sendWelcomeEmail(email);
        res.status(200).send(`registration sucessfull! ${otp}`)
    } catch (err) {
        return res.status(500).send("internal server error!")
    }
});

// otp validation method
app.post('/checkotp', async (req, res) => {
    const { otp } = req.body;
    try {
        // validating email for exists and non exists
        let exist = await generateOTPValue.findOne({ otp: otp })
        if (!exist) {
            return res.send('invalid otp')
        } else {
            res.status(200).send(`valid otp`)
            return res.send('valid otp')
        }
    } catch (err) {
        return res.status(500).send("internal server error!")
    }
})

// resetpassword method
app.post("/resetpassword", async (req, res) => {
    const { email } = req.body
    const { password } = req.body
    const { conformPassword } = req.body
    const resetPasswordData = new resetPassword({ password, conformPassword })
    let exist = await createUserDetails.findOne({ email: email })
    if (exist) {
        return res.send('user alredy exists')
    }
    if (password !== conformPassword) {
        return res.send('password mismatch')
    }
    await newUserData.save();
})
app.listen(5000, () => console.log("server running -> auth + video streaming............"));
module.exports = app