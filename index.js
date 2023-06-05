const express = require("express");
const mongoose = require("mongoose");
const loginUserDetails = require("./login");
const createUserDetails = require("./signup");
const app = express();
const generateOTPValue = require("./otp/otp");
const checkuser = require("./forgotpassword/forgotpassword");
const middleware = require("./middleware");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const fs = require("fs");
app.use(express.json()); // middleware
const multer = require("multer");
const Tesseract = require("tesseract.js");
app.use(cors({ origin: "*", credentials: true }));
const nodemailer = require("nodemailer");
const Image = require("./textfromimage/imagescheema"); // Import the image schema
mongoose
    .connect(
        "mongodb+srv://haridevworld2022:merntypescriptapi@cluster0.firewrq.mongodb.net/userdata",
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    )
    .then(() => {
        console.log("DB connection successful");
    })
    .catch((err) => {
        console.error("DB connection error:", err);
    });

// video streaming
const videoFileMap = {
    cdn: "videos/cdn.mp4",
    "generate-pass": "videos/generate-pass.mp4",
    "get-post": "videos/get-post.mp4",
    "index-video": "videos/index-video.mp4",
    cricket: "videos/cricket.mp4",
};

app.get("/videos/:filename", (req, res) => {
    const fileName = req.params.filename;
    const filePath = videoFileMap[fileName];
    if (!filePath) {
        return res.status(404).send("File not found");
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
        user: "doradla.hari@gmail.com",
        pass: "erkluzuuibckjyan",
    },
});

// Function to send welcome email
const sendWelcomeEmail = async (email, res, userId) => {
    try {
        // saving otp in to DB
        const storeOtp = new generateOTPValue({
            otp: otp,
            email: email,
        });
        await storeOtp.save();
        const mailOptions = {
            from: "haridevworld2022@gmail.com",
            to: email,
            subject: "Welcome to Our Application",
            text: `Thank you for registering with our application. We are excited to have you on board! Here is your OTP: ${otp}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending welcome email:", error);
                return res.status(500).send("Internal server error");
            }
            res.status(200).send(`OTP sent successfully to ${email}`);
        });
    } catch (err) {
        console.error("Error sending welcome email:", err);
        return res.status(500).send("Internal server error");
    }
};

// Function to send reset password link
const sendResetPasswordLink = async (email, userId, res) => {
    try {
        const mailOptions = {
            from: "haridevworld2022@gmail.com",
            to: email,
            subject: "Reset Password",
            text: `Use this link to reset your password: http://mern-typescript.s3-website.ap-south-1.amazonaws.com/resetpassword/${userId},
            http://localhost:3000/resetpassword/${userId}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending reset password email:", error);
                return res.status(500).send("Internal server error");
            }
            res.status(200).send(`Reset password link sent successfully to ${email}`);
        });
    } catch (err) {
        console.error("Error sending reset password email:", err);
        return res.status(500).send("Internal server error");
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
                id: loggedInUserData._id,
            },
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
            return res.send("User not found");
        }
        res.json(exist);
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error!");
    }
});

// signup method
app.post("/createuser", async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        mobileNumber,
        password,
        confirmPassword,
    } = req.body;
    try {
        const exist = await createUserDetails.findOne({ email: email });
        if (exist) {
            return res.send("User already exists");
        }
        if (password !== confirmPassword) {
            return res.send("Password mismatch");
        }
        const newUserData = new createUserDetails({
            firstName,
            lastName,
            email,
            mobileNumber,
            password,
            confirmPassword,
        });
        await newUserData.save();

        // Retrieve the generated ID
        const userId = newUserData._id;
        // Send welcome email
        sendWelcomeEmail(email, userId);

        res
            .status(200)
            .json({ message: "Registration successful!", userId: userId, otp: otp });
    } catch (err) {
        return res.status(500).send("Internal server error!");
    }
});

// OTP validation method
app.post("/checkotp", async (req, res) => {
    const { otp } = req.body;
    try {
        let exist = await generateOTPValue.findOne({ otp: otp });
        if (!exist) {
            return res.send("Invalid OTP");
        } else {
            res.status(200).json({ message: "Account Verification Successfull" });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
});

// Forgot password method
app.post("/forgotpassword", async (req, res) => {
    try {
        const { email } = req.body;
        const exist = await createUserDetails.findOne({ email: email });
        if (!exist) {
            return res.send("User not found");
        } else {
            const userId = exist._id; // Retrieve the generated ID from the existing user
            await checkuser.findOneAndUpdate(
                { email: email },
                { email: email },
                { upsert: true, new: true }
            );
            sendResetPasswordLink(email, userId, res); // Pass the userId to the sendResetPasswordLink function
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
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

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: "./uploads", // Set the destination folder to store uploaded files
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

// Create GridFS Bucket
let gfs;
mongoose.connection.once("open", () => {
    gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: "uploads",
    });
});

// Set up the routes
app.post("/upload", upload.array("image", 10), (req, res) => {
    const files = req.files;

    if (!files) {
        res.status(400).send("No files were uploaded.");
        return;
    }

    const responses = []; // Array to store the JSON responses

    // Process each uploaded file
    files.forEach((file) => {
        const imagePath = file.path;
        const filename = file.filename;

        // Perform text extraction using Tesseract.js
        Tesseract.recognize(imagePath, "eng")
            .then((result) => {
                const text = result.data.text;
                const newImage = new Image({ filename, filePath: imagePath, text });

                // Create write stream to store the image in GridFS
                const writeStream = gfs.openUploadStream(filename);

                fs.createReadStream(imagePath).pipe(writeStream);

                writeStream.on("finish", (file) => {
                    newImage
                        .save()
                        .then(() => {
                            console.log("Image and text saved to MongoDB");
                            // Add the JSON response to the array
                            responses.push({ filename, text });

                            // Check if all files have been processed
                            if (responses.length === files.length) {
                                // Send the JSON responses
                                res.json(responses);
                            }
                        })
                        .catch((error) => {
                            console.error("Error saving image and text:", error);
                        });
                });

                writeStream.on("error", (error) => {
                    console.error("Error storing image in GridFS:", error);
                });
            })
            .catch((error) => {
                console.error("Error extracting text from image:", error);
            });
    });
});

// storing audio in db 
const gtts = require("gtts");
app.get("/text/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const image = await Image.findById(id);
        const text = image.text;

        // Create a new instance of gtts with the desired language
        const speech = new gtts(text, "en");

        // Generate a unique filename for the audio file
        const filename = `audio_${id}.mp3`;

        // Create the "audios" directory if it doesn't exist
        const directory = "storeaudiotodb";
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
        }

        // Save the audio file inside the "audios" directory
        speech.save(`${directory}/${filename}`, async function (err) {
            if (err) {
                console.error(err);
                res.status(500).json({ error: "An error occurred while generating the audio file" });
            } else {
                // Read the audio file as binary data
                const audioData = fs.readFileSync(`${directory}/${filename}`);

                // Save the audio data to the database
                image.audio = audioData; // Assuming your Image model has an 'audio' field

                await image.save();

                // Set the appropriate headers for the audio response
                res.setHeader("Content-Type", "application/octet-stream");
                res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

                // Send the audio data as the response
                res.status(200).json({ audioData });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "An error occurred while retrieving the image text" });
    }
});





app.listen(5000, () =>
    console.log("Server running -> Auth + Video Streaming....")
);

module.exports = app;
