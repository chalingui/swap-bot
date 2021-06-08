const knex = require("./knex");

async function save(log) {

    try {

        let id = await knex("logs").insert(log);
        return id;

    } catch(error) {

        console.log(error);
    
    }

}

function now() {

    return knex.fn.now();

}

module.exports = {
    save,
    now
}