const axios = require('axios');
const web3 = require('web3');
const chalk = require('chalk');

const getQuote = async (fromToken,fromTokenAmount) => {

    const fromTokenAddress = fromToken == 'BUSD' ? process.env.COIN_BUSD : process.env.COIN_VAI;
    const toTokenAddress = fromToken == 'BUSD' ? process.env.COIN_VAI : process.env.COIN_BUSD;
    
    const fromTokenAmountWei = web3.utils.toWei(fromTokenAmount,'ether');

    const params = {
        "fromAddress": process.env.ADDRESS_1,
        "fromTokenAddress": fromTokenAddress,
        "toTokenAddress": toTokenAddress,
        "amount": fromTokenAmountWei,
        "slippage": '1'
    }

    // VOY PROBANDO CON QUOTE PORQUE EL SWAP NO ME DEJA SINO TENGO LA PLATA

    try {

        return await axios.get(process.env.API_1INCH_BSC_URL+'swap', { params });
        
    } catch (error) {
        
        console.error(chalk.black.bgRed("Error en 1inch"));

        // console.log(error);
        
        if(error.isAxiosError) {

            console.log(chalk.red(error.response.data.message));

        }

    }

}

module.exports = {
    getQuote
}

