db.createUser(
    {
        user: "user",
        pwd: "password",
        roles: [ { role: "readWrite", db: "chat_db"} ],
    }
)