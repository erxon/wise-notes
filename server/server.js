const express = require("express");
const userRoute = require("./routes/user.route");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const auth = require("./routes/auth.route");
const protected = require("./routes/protected.route");
const notes = require("./routes/notes.route");
const test = require("./routes/test.route");
const rag = require("./routes/rag.route");
const notebook = require("./routes/notebook.route");
const chats = require("./routes/chats.route");
const initializePassport = require("./config/passport.config");
const passport = require("passport");
const session = require("express-session");
const helmet = require("helmet");
const MongoStore = require("connect-mongo");
const bin = require("./routes/bin.route");

const app = express();

app.set("trust proxy", 1);

dotenv.config();
const version = "/api/v1";
const port = process.env.PORT || 8080;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to database"))
  .catch((err) => console.log(err));

app.use(helmet());
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.use(
  cors({
    origin: [process.env.ORIGIN],
    credentials: true,
  })
);

app.use(express.json());
// Passport
app.use(
  session({
    secret: process.env.PASSPORT_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    name: "sessionId",
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
      ttl: 1000 * 60 * 60,
    }),
    cookie: {
      sameSite: "none",
      httpOnly: false,
      secure: true,
      maxAge: 1000 * 60 * 60,
    },
  })
);

initializePassport(passport);

app.use(passport.initialize());
app.use(passport.session());

// My Routes
app.use(`${version}/users`, userRoute);
app.use(`${version}/chats`, chats);
app.use(`${version}/notebooks`, notebook);
app.use(`${version}/auth`, auth);
app.use(`${version}/protected`, protected);
app.use(`${version}/notes`, notes);
app.use(`${version}/bin`, bin);
app.use(`${version}/rag`, rag);
app.use(`${version}/test`, test);

app.listen(port, () => {
  console.log("Server is running on port", port);
});
