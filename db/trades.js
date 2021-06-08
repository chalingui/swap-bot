const knex = require("./knex");

async function getLast() {

    try {

        return await knex.select()
                    .table('trades')
                    .orderBy('id', 'DESC')
                    .limit(1)
                    .first();

    } catch(error) {

        console.error(error);
    
    }

}

async function save(trade) {

    try {

        let id = await knex("trades").insert(trade);
        return id;

    } catch(error) {

        console.log(error);
    
    }

}

module.exports = {
    getLast,
    save
}