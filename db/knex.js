const knex = require("knex");
 
const connectedKnex = knex({

    client: "mysql",
    connection: {

        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,

    },
    pool: {min:0, max: 15},
});

module.exports = connectedKnex;