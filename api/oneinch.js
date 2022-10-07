const axios = require('axios');
const web3 = require('web3');
const chalk = require('chalk');

const getQuote = async (fromToken,fromTokenAmount) => {

    const fromTokenAddress = fromToken == process.env.COIN_1 ? process.env.COIN_1_ADDRESS : process.env.COIN_2_ADDRESS;
    const toTokenAddress = fromToken == process.env.COIN_1 ? process.env.COIN_2_ADDRESS : process.env.COIN_1_ADDRESS;
    
    const fromTokenAmountWei = web3.utils.toWei(fromTokenAmount,'ether');

    const params = {
        "fromAddress": process.env.WALLET_ADDRESS,
        "fromTokenAddress": fromTokenAddress,
        "toTokenAddress": toTokenAddress,
        "amount": fromTokenAmountWei,
        "slippage": process.env.SLIPPAGE,
    }

    // VOY PROBANDO CON QUOTE PORQUE EL SWAP NO ME DEJA SINO TENGO LA PLATA

    var method = process.env.DEBUG == "false" ? 'swap' : 'quote'

    try {

        return await axios.get(process.env.API_1INCH_BSC_URL+method, { params }, { timeout: 30000 });
        
    } catch (error) {
        
        console.error(chalk.black.bgRed("Error en 1inch"));

        if(error.isAxiosError) {

            // console.log(chalk.red(error.response.data.message));
            console.log(chalk.red(error));

        }

    }

}

module.exports = {
    getQuote
}

