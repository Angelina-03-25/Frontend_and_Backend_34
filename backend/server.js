const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
const port = 3000;

let products = [
  { id: nanoid(6), name: 'The Witcher 3: Wild Hunt', category: 'Игры', description: 'Эпическая ролевая игра с открытым миром', price: 1299, stock: 100 },
  { id: nanoid(6), name: 'Cyberpunk 2077', category: 'Игры', description: 'Футуристический экшен-RPG от создателей The Witcher', price: 2499, stock: 85 },
  { id: nanoid(6), name: 'Red Dead Redemption 2', category: 'Игры', description: 'Захватывающий вестерн с невероятно детализированным миром', price: 1999, stock: 60 },
  { id: nanoid(6), name: 'Grand Theft Auto V', category: 'Игры', description: 'Культовая игра с открытым миром в Лос-Сантосе', price: 1499, stock: 150 },
  { id: nanoid(6), name: 'Elden Ring', category: 'Игры', description: 'Темное фэнтези от FromSoftware и Джорджа Р.Р. Мартина', price: 2999, stock: 70 },
  { id: nanoid(6), name: 'The Legend of Zelda: Breath of the Wild', category: 'Игры', description: 'Новаторская приключенческая игра для Nintendo Switch', price: 3499, stock: 40 },
  { id: nanoid(6), name: 'Minecraft', category: 'Игры', description: 'Песочница с возможностью строительства и исследования', price: 899, stock: 200 },
  { id: nanoid(6), name: 'Fortnite', category: 'Игры', description: 'Популярная игра в жанре battle royale', price: 0, stock: 1000 },
  { id: nanoid(6), name: 'Call of Duty: Modern Warfare II', category: 'Игры', description: 'Шутер от первого лица с кампанией и мультиплеером', price: 3999, stock: 55 },
  { id: nanoid(6), name: 'FIFA 23', category: 'Игры', description: 'Футбольный симулятор от EA Sports', price: 2999, stock: 75 },
  { id: nanoid(6), name: 'Hogwarts Legacy', category: 'Игры', description: 'Ролевая игра в мире Гарри Поттера', price: 3999, stock: 90 },
  { id: nanoid(6), name: 'Doom Eternal', category: 'Игры', description: 'Динамичный шутер от первого лица', price: 2499, stock: 50 }
];

app.use(express.json());

app.use(cors({
  origin: "http://localhost:3001",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}][${req.method}] ${res.statusCode} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      console.log('Body:', req.body);
    }
  });
  next();
});

function findProductOr404(id, res) {
  const product = products.find(p => p.id == id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return null;
  }
  return product;
}

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  res.json(product);
});

app.post('/api/products', (req, res) => {
  const { name, category, description, price, stock, rating, photo } = req.body;

  const newProduct = {
    id: nanoid(6),
    name: name.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price),
    stock: Number(stock),
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.patch('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;

  if (req.body?.name === undefined && req.body?.category === undefined && req.body?.description === undefined && req.body?.price === undefined && req.body?.stock === undefined && req.body?.rating === undefined && req.body?.photo === undefined) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const { name, category, description, price, stock, rating, photo } = req.body;

  if (name !== undefined) product.name = name.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);

  res.json(product);
});

app.delete('/api/products/:id', (req, res) => {
  const id = req.params.id;
  const exists = products.some(p => p.id === id);
  if (!exists) return res.status(404).json({ error: "Product not found" });

  products = products.filter(p => p.id !== id);
  res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});