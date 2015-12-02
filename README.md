# Demo Express RESTful API server
This is test project to test API based on Express 4.* framework

Requests
- POST http://localhost:8080/api/login  (User login)
- POST http://localhost:8080/api/register (User register)

- GET http://localhost:8080/api/me (Get current user data)
- PUT http://localhost:8080/api/me (Update current user data)
- GET http://localhost:8080/api/user/1 (Get user by id)

- POST http://localhost:8080/api/item (Create item)
- DELETE http://localhost:8080/api/item/1 (Delete item)
- PUT http://localhost:8080/api/item/1 (Update item)
- GET http://localhost:8080/api/item/1 (Get item by id)
- GET http://localhost:8080/api/item?user_id=1 (Search items)

- POST http://localhost:8080/api/item/1/image (Upload item image)
- DELETE http://localhost:8080/api/item/1/image (Delete item image)

Authorization based on JWT
Data stores in mongodb

This project depends on the following "Node.js" modules:
1. "express"
2. "mongoose"
3. "bcrypt"
4. "jsonwebtoken"
5. "body-parser"
6. "morgan"
7. "express-validator"
