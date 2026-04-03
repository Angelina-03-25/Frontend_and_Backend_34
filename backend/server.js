const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

// === КОНФИГУРАЦИЯ JWT (Практика 8) ===
const ACCESS_SECRET = process.env.ACCESS_SECRET || 'access_secret_key_change_in_prod';
const ACCESS_EXPIRES_IN = '15m';

// === SWAGGER КОНФИГУРАЦИЯ ===
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Toy Shop API',
      version: '1.0.0',
      description: 'API для интернет-магазина игрушек (Практики 5-11)',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Локальный сервер',
      },
    ],
        components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// === ХРАНИЛИЩА (в памяти) ===
let users = [];
let products = [
  { id: nanoid(6), title: 'Плюшевый мишка Classic', category: 'Мягкие игрушки', description: 'Классический плюшевый медведь из гипоаллергенных материалов', price: 1299 },
  { id: nanoid(6), title: 'Конструктор LEGO City', category: 'Развивающие', description: 'Набор для строительства полицейского участка, 500 деталей', price: 3499 },
  { id: nanoid(6), title: 'Кукла Collectible Doll', category: 'Коллекционные', description: 'Лимитированная серия, фарфор, ручная работа', price: 5999 },
  { id: nanoid(6), title: 'Интерактивный робот', category: 'Развивающие', description: 'Программируемый робот для обучения детей основам кодирования', price: 4299 },
  { id: nanoid(6), title: 'Плюшевый единорог', category: 'Мягкие игрушки', description: 'Мягкий единорог с радужной гривой, 40 см', price: 1599 },
  { id: nanoid(6), title: 'Набор деревянных кубиков', category: 'Развивающие', description: 'Экологически чистые кубики с буквами и цифрами', price: 899 },
  { id: nanoid(6), title: 'Фигурка Marvel Heroes', category: 'Коллекционные', description: 'Подвижная фигурка супергероя, 15 см', price: 1999 },
  { id: nanoid(6), title: 'Пазл 3D Замок', category: 'Развивающие', description: 'Объёмный пазл для всей семьи, 216 деталей', price: 1199 },
  { id: nanoid(6), title: 'Плюшевый заяц Long-Ears', category: 'Мягкие игрушки', description: 'Заяц с длинными ушами, можно стирать в машинке', price: 1399 },
  { id: nanoid(6), title: 'Набор для опытов Юный учёный', category: 'Развивающие', description: 'Безопасный химический набор для детей от 8 лет', price: 2499 },
  { id: nanoid(6), title: 'Фигурка Star Wars Collection', category: 'Коллекционные', description: 'Детализированная фигурка персонажа, 12 см', price: 2299 },
  { id: nanoid(6), title: 'Развивающий коврик Baby', category: 'Для малышей', description: 'Яркий коврик с дугами и игрушками для новорождённых', price: 3299 }
];

// === MIDDLEWARE ===
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3001",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}][${req.method}] ${res.statusCode} ${req.path}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      console.log('Body:', req.body);
    }
  });
  next();
});

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
async function hashPassword(password) {
  const rounds = 10;
  return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

// Генерация access-токена (Практика 8)
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function findProductOr404(id, res) {
  const product = products.find(p => p.id == id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return null;
  }
  return product;
}

// === AUTH MIDDLEWARE (Практика 8) ===
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload; // { sub, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// === МАРШРУТЫ АВТОРИЗАЦИИ ===

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: qwerty123
 *               first_name:
 *                 type: string
 *                 example: Иван
 *               last_name:
 *                 type: string
 *                 example: Иванов
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *       400:
 *         description: Некорректные данные
 *       409:
 *         description: Пользователь уже существует
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, password, first_name, last_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const exists = users.some(u => u.email === email.toLowerCase());
  if (exists) {
    return res.status(409).json({ error: "User with this email already exists" });
  }

  const passwordHash = await hashPassword(password);
  const user = {
    id: nanoid(6),
    email: email.trim().toLowerCase(),
    first_name: first_name?.trim() || "",
    last_name: last_name?.trim() || "",
    passwordHash
  };

  users.push(user);
  res.status(201).json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name
  });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIs...
 *       400:
 *         description: Отсутствуют обязательные поля
 *       401:
 *         description: Неверные учетные данные
 *       404:
 *         description: Пользователь не найден
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = users.find(u => u.email === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Генерация access-токена (Практика 8)
  const accessToken = generateAccessToken(user);
  res.json({ accessToken });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные текущего пользователя
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Пользователь не найден
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { passwordHash, ...safeUser } = user;
  res.json(safeUser);
});

// === МАРШРУТЫ ТОВАРОВ (с защитой) ===

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 */
app.get('/api/products', (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Данные товара
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Товар создан
 */
app.post('/api/products', (req, res) => {
  const { title, category, description, price } = req.body;

  const newProduct = {
    id: nanoid(6),
    title: title?.trim() || "",
    category: category?.trim() || "",
    description: description?.trim() || "",
    price: Number(price) || 0
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Товар обновлён
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Товар не найден
 */
app.put('/api/products/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;

  const { title, category, description, price } = req.body;

  if (title !== undefined) product.title = title.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);

  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Товар удалён
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: "Product not found" });

  products.splice(index, 1);
  res.status(204).send();
});

// === ОБРАБОТЧИКИ ОШИБОК ===
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});