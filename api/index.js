const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const shortid = require("shortid");
const validUrl = require("valid-url");
const serverless = require("serverless-http");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());
const port = process.env.PORT;

mongoose
  .connect(process.env.Mongo_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const urlSchema = new mongoose.Schema({
  longUrl: { type: String, required: true },
  shortUrl: { type: String, required: true },
  urlCode: { type: String, required: true, unique: true },
  date: { type: String, default: Date.now },
  clicks: { type: Number, default: 0 },
});

const Url = mongoose.model("Url", urlSchema);

app.get("/api/", (req, res) => {
  res.send("hello");
});

app.post("/api/shorten", async (req, res) => {
  const { longUrl } = req.body;

   const baseUrl = `${req.protocol}://${req.get("host")}`;

  if (!validUrl.isUri(longUrl)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    let url = await Url.findOne({ longUrl });

    if (url) {
      res.json(url);
    } else {
      const urlCode = shortid.generate();
      const shortUrl = `${baseUrl}/${urlCode}`;

      url = new Url({
        longUrl,
        shortUrl,
        urlCode,
        date: new Date(),
      });

      await url.save();
      res.json(url);
    }
  } catch (errro) {
    console.error(erro); 
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/:code", async (req, res) => {
  try {
    const url = await Url.findOne({ urlCode: req.params.code });

    if (url) {
      url.clicks++;
      await url.save();
      return res.redirect(url.longUrl);
    } else {
      return res.status(404).json({ error: "No URL found" });
    }
  } catch (err) {
    console.error(err); 
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/url/:code", async (req, res) => {
  try {
    const url = await Url.findOne({ urlCode: req.params.code });

    if (url) {
      res.json({
        longUrl: url.longUrl,
        shortUrl: url.shortUrl,
        clicks: url.clicks,
        date: url.date,
      });
    } else {
      res.status(404).json({ error: "No URL found" });
    }
  } catch (err) {
    console.error(err); 
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});

module.exports = app;
