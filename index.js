const express = require("express");
const mongoose = require("mongoose");
const loginUserDetails = require("./login");
const createUserDetails = require('./signup');
const app = express();
const generateOTPValue = require('./otp/otp');
const resetPassword = require('./resetpassword/resetpassword');
const checkuser = require('./forgotpassword/forgotpassword');
const middleware = require('./middleware');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
app.use(express.json()); // middleware
app.use(cors({ origin: '*', credentials: true }));
const nodemailer = require('nodemailer');

mongoose
    .connect("mongodb+srv://haridevworld2022:merntypescriptapi@cluster0.firewrq.mongodb.net/userdata", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
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
};

app.get('/videos/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = videoFileMap[fileName];
    if (!filePath) {
        return res.status(404).send('File not found');
    }
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        const chunkSize = end - start + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize,
            "Content-Type": "video/mp4",
        };

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            "Content-Length": fileSize,
            "Content-Type": "video/mp4",
        };

        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
    }
});

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
const sendWelcomeEmail = async (email, res, userId) => {
    try {
        // saving otp in to DB
        const storeOtp = new generateOTPValue({
            otp: otp, email:
                email
        });
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
                return res.status(500).send('Internal server error');
            }
            res.status(200).send(`OTP sent successfully to ${email}`);
        });
    } catch (err) {
        console.error('Error sending welcome email:', err);
        return res.status(500).send('Internal server error');
    }
};

// Function to send reset password link
const sendResetPasswordLink = async (email, userId, res,) => {

    try {
        const mailOptions = {
            from: 'haridevworld2022@gmail.com',
            to: email,
            subject: 'Reset Password',
            text: `Use this link to reset your password: http://mern-typescript.s3-website.ap-south-1.amazonaws.com/resetpassword/${userId},
            http://localhost:3000/resetpassword/${userId}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending reset password email:', error);
                return res.status(500).send('Internal server error');
            }
            res.status(200).send(`Reset password link sent successfully to ${email}`);
        });
    } catch (err) {
        console.error('Error sending reset password email:', err);
        return res.status(500).send('Internal server error');
    }
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
// post method
app.post("/loginuser", async (req, res) => {
    try {
        const { email, password } = req.body;
        const loggedInUserData = new loginUserDetails({ email, password });

        let exist = await createUserDetails.findOne({ email: email });
        if (!exist) {
            return res.send("User not found");
        }
        if (exist.password !== password) {
            return res.send("Invalid credentials");
        }

        await loggedInUserData.save();

        let payload = {
            user: {
                id: loggedInUserData._id
            }
        };

        // Generate the token
        jwt.sign(payload, "jwtSecret", { expiresIn: 3600000 }, (err, token) => {
            if (err) throw err;

            // Include the token and ID in the response
            res.json({ token: token, id: loggedInUserData._id });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
});

// protected route
app.get("/myprofile", middleware, async (req, res) => {
    try {
        let exist = await createUserDetails.findById(req.user.id);
        if (!exist) {
            return res.send('User not found');
        }
        res.json(exist);
    } catch (err) {
        console.log(err);
        return res.status(500).send('Internal server error!');
    }
});

// signup method
app.post("/createuser", async (req, res) => {
    const { firstName, lastName, email, mobileNumber, password, confirmPassword } = req.body;
    try {
        const exist = await createUserDetails.findOne({ email: email });
        if (exist) {
            return res.send('User already exists');
        }
        if (password !== confirmPassword) {
            return res.send('Password mismatch');
        }
        const newUserData = new createUserDetails({ firstName, lastName, email, mobileNumber, password, confirmPassword });
        await newUserData.save();

        // Retrieve the generated ID
        const userId = newUserData._id;
        // Send welcome email
        sendWelcomeEmail(email, userId);

        res.status(200).json({ message: 'Registration successful!', userId: userId, otp: otp });
    } catch (err) {
        return res.status(500).send('Internal server error!');
    }
});



// OTP validation method
app.post('/checkotp', async (req, res) => {
    const { otp } = req.body;
    try {
        let exist = await generateOTPValue.findOne({ otp: otp });
        if (!exist) {
            return res.send('Invalid OTP');
        } else {
            res.status(200).json({ message: "Account Verification Successfull" })
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send('Internal server error');
    }
});

// Forgot password method
app.post('/forgotpassword', async (req, res) => {
    try {
        const { email } = req.body;
        const exist = await createUserDetails.findOne({ email: email });
        if (!exist) {
            return res.send('User not found');
        } else {
            const userId = exist._id; // Retrieve the generated ID from the existing user
            await checkuser.findOneAndUpdate({ email: email }, { email: email }, { upsert: true, new: true });
            sendResetPasswordLink(email, userId, res); // Pass the userId to the sendResetPasswordLink function
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send('Internal server error');
    }
});


// Reset password method
app.put("/resetpassword/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { password, confirmPassword } = req.body;

        let existingUser = await createUserDetails.findById(id);
        if (!existingUser) {
            return res.send("User not found");
        }

        if (password !== confirmPassword) {
            return res.send("Password mismatch");
        }

        existingUser.password = password;
        existingUser.confirmPassword = confirmPassword;
        await existingUser.save();

        return res.status(200).send("Password reset successfully");
    } catch (err) {
        return res.status(500).send("Internal server error");
    }
});

app.listen(5000, () => console.log("Server running -> Auth + Video Streaming...."));

module.exports = app;
