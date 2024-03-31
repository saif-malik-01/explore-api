const express = require("express");
const fs = require("fs");
const cors = require("cors");
const https = require('https');
const { OpenAI } = require("openai");

const app = express();

app.use(express.json());

app.use(cors({ origin: '*' }));

const port = 443;

const openai = new OpenAI({
  apiKey: "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",
});

const getModels = () => {
  try {
    const data = fs.readFileSync("models.json", "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading file:", err);
  }
};

async function getChatGPTResponse(text) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: text }],
      model: "gpt-3.5-turbo",
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error chat gpt", err);
  }
}

app.get("/models", (req, res) => {
  console.log("models");
  const models = getModels();
  res.status(200).json(models);
});

app.get("/models/:id", (req, res) => {
  const { id } = req.params;
  const models = getModels();
  const model = models.find((model) => model.id === parseInt(id));
  if (model) {
    res.json(model);
  } else {
    res.status(404).json({ error: "Model not found" });
  }
});

app.put("/models/:id/visit", (req, res) => {
  const { id } = req.params;
  const models = getModels();
  const index = models.findIndex((model) => model.id === parseInt(id));
  if (index !== -1) {
    models[index].visitors++;
    fs.writeFile("models.json", JSON.stringify(models, null, 2), (err) => {
      if (err) {
        console.error("Error writing file:", err);
        return;
      }
      console.log("Models data updated in models.json");
    });
    res.json({ message: "Visitor count increased successfully" });
  } else {
    res.status(404).json({ error: "Model not found" });
  }
});

app.get("/model/:id/sandbox", async (req, res) => {
  const { id } = req.params;
  if (id && parseInt(id) !== 2) {
    return res.status(200).json({ status: false });
  }
  const { q } = req.query;
  const content = await getChatGPTResponse(q);
  res.status(200).json({ content });
});

app.get("/search", (req, res) => {
  const { term } = req.query;
  if (!term) {
    return res.status(400).json({ error: "Search term is required" });
  }

  const models = getModels();
  const filteredModels = models.filter(
    (model) =>
      model.name.toLowerCase().includes(term.toLowerCase()) ||
      model.category.toLowerCase().includes(term.toLowerCase()) ||
       model.description.toLowerCase().includes(term.toLowerCase())
  );

  if (filteredModels.length > 0) {
    res.status(200).json(filteredModels);
  } else {
    res.status(404).json([]);
  }
});

app.post("/model", (req, res) => {
  const { name, description, provider, category, license, framework, snippet } = req.body;
  const models = getModels();
  const newId = models.length > 0 ? models[models.length - 1].id + 1 : 1;
  const newModel = {
    id: newId,
    name,
    description,
    provider,
    category,
    license,
    framework,
    snippet,
    visitors: 0,
    sandbox:false,
    useCases:[],
    latestUpdate:""
  };
  models.push(newModel);
  fs.writeFile("models.json", JSON.stringify(models, null, 2), (err) => {
    if (err) {
      console.error("Error writing file:", err);
      return res.status(500).json({ error: "Failed to add model" });
    }
    console.log("New model added:", newModel);
    res.status(201).json(newModel);
  });
});

const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
};

https.createServer(options, app).listen(port,'0.0.0.0', () => {
  console.log(`Server running at https://${ip}:443/`);
});