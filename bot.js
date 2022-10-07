require('dotenv').config();
const cron = require('node-cron');

const chalk = require('chalk');

// conecto a la DB
const db_trades = require("./db/trades");
const db_logs = require("./db/logs");

// conecto a la API de oneinch
const api_oneinch = require("./api/oneinch");

// modulo smtp
const email = require("./modules/email");

// BINANCE
const Web3 = require('web3');
web3 = new Web3(new Web3.providers.HttpProvider(process.env.API_MORALIS_BSC_URL));

var pjson = require('./package.json');
var transactionOngoing = false;

async function run() {

    if(transactionOngoing) {

        console.log(chalk.yellow(`=== Transaction already ongoing`));
        return;

    }

    let [month, date, year]    = new Date().toLocaleDateString("en-US").split("/")
    let [hour, minute, second] = new Date().toLocaleTimeString("en-US").split(/:| /)

    console.log(chalk.inverse.yellow(`\n${date}/${month} ${hour}:${minute}:${second} ============== Bot v${pjson.version} ==============\n`));
    // console.log(new Date());

    const base_price = parseFloat(process.env.BASE_PRICE).toFixed(6);

    console.log(chalk.yellow(`Base price: ${base_price} | ${process.env.PERCENT}% spread | Amount: ${process.env.AMOUNT} ${process.env.COIN_1}\n`));

    // ME FIJO EN QUE ESTOY Y CUANTO LO PAGUE
    // BUSCO EL ULTIMO MOVIMIENTO

    const last_trade = await db_trades.getLast();
    
    const new_trade_type = last_trade.type == 'SELL' ? 'BUY' : 'SELL';

    
    // SI ESTOY EN BUY TENGO QUE COMPRAR ALTS
    if(new_trade_type == 'BUY') {

        const target_price = parseFloat(base_price*(100-parseFloat(process.env.PERCENT))/100).toFixed(6);

        const fromTokenAmount = process.env.AMOUNT;

        console.log(`==> Spending: ${parseFloat(fromTokenAmount).toFixed(6)} ${process.env.COIN_1}\n`);

        const targetAmount = fromTokenAmount*1/target_price;

        console.log(`       Buy price: `+chalk.green(target_price)+` - Wanting: ${chalk.green(parseFloat(targetAmount).toFixed(6))} ${process.env.COIN_2}`);

        let response = {};

        try {
            
            // VOY A 1INCH CON EL TOKEN Y EL PRECIO QUE QUIERO PAGAR
            response  = await api_oneinch.getQuote(process.env.COIN_1,fromTokenAmount);

        } catch(error) {

            console.log(error);

        }

        if(!response || response === null) return;

        const toTokenAmount = web3.utils.fromWei(response.data.toTokenAmount, 'ether');

        const market_price = fromTokenAmount/toTokenAmount;

        console.log(`    Market price: ${chalk.yellow(parseFloat(market_price).toFixed(6))} - Getting: ${chalk.yellow(parseFloat(toTokenAmount).toFixed(6))} ${process.env.COIN_2}`);

        console.log(`      Diff price: ${chalk.red(parseFloat(market_price - target_price).toFixed(6))}\n`);

        let action = 'yes';

        // Si esta mas caro de lo que quiero comprar
        if(market_price > target_price) {

            action = 'no';
            
            console.log(chalk.grey('<== Quiting'));

        }
        
        var log = {

            trade_pair: process.env.COIN_2+process.env.COIN_1,
            type: new_trade_type,
            amount: fromTokenAmount,
            market_price,
            target_price,
            base_price,
            percent: process.env.PERCENT,
            estimated_gas: response.data.tx ? response.data.tx.gas : response.data.estimatedGas,
            gas_price: response.data.tx ? response.data.tx.gasPrice : 0,
            action,
            date: db_logs.now(),

        }

        const log_id = await db_logs.save(log);

        
        
        if(action == 'yes') {

            console.log(chalk.black.bgGreen('\n================================== Buying '+process.env.COIN_2+' ==================================\n'));

            if(process.env.DEBUG == "false") {

                try {

                    transactionOngoing = true;

                    // 1) HAGO EL TRADE
                    let nonce = await web3.eth.getTransactionCount(process.env.WALLET_ADDRESS, 'pending');

                    // nonce = parseInt(nonce);

                    // nonce++;

                    console.log('=== Nonce value: '+nonce);
                    
                    nonce = await web3.utils.toHex(nonce);

                    response.data.tx.nonce = nonce;

                    response.data.tx.gasPrice = parseInt(response.data.tx.gasPrice) * 2;

                    console.log('=== Signing transaction');
                    
                    const tx = await web3.eth.accounts.signTransaction(response.data.tx, process.env.PRIVATE_KEY_1);

                    console.log('=== Sending signed transaction');

                    // deploy our transaction
                    const receipt = await web3.eth.sendSignedTransaction(tx.rawTransaction);
                    
                    console.log(`=== Transaction succesfull with hash: ${receipt.transactionHash}`);

                    // 2) GRABO EL TRADE EN LA DB
                    var trade = {

                        log_id,
                        type: new_trade_type,
                        tx: receipt.transactionHash,
                        fromToken: response.data.fromToken.symbol,
                        fromTokenAmount,
                        toToken: response.data.toToken.symbol,
                        toTokenAmount,
                        gas_used: receipt.gasUsed,
                        gas_price: response.data.tx.gasPrice,
                        date: db_logs.now(),
            
                    }

                    await db_trades.save(trade);


                    // 3) Envío el email
                    await email.send(trade.fromToken, fromTokenAmount, trade.toToken, toTokenAmount, trade.gas_used, trade.tx);

                    transactionOngoing = false;

                } catch(error) {

                    transactionOngoing = false;
                    console.error(error);

                }

            } else {

                console.log(chalk.grey('<== DEBUG MODE: Quiting'));


            }

        }

    }


    // SI ESTOY EN BUY TENGO QUE VENDER ALTS
    if(new_trade_type == 'SELL') {

        const target_price = parseFloat(base_price*(100+parseFloat(process.env.PERCENT))/100).toFixed(6);

        const fromTokenAmount = String(parseFloat(process.env.AMOUNT/target_price).toFixed(10));

        const targetAmount = process.env.AMOUNT;
        
        console.log(`==> Spending: ${parseFloat(fromTokenAmount).toFixed(6)} ${process.env.COIN_2}\n`);

        console.log(`      Sell price: ${chalk.green(target_price)} - Wanting: ${chalk.green(parseFloat(targetAmount).toFixed(6))} ${process.env.COIN_1}`);

        let response = {};

        try {
            
            // VOY A 1INCH CON EL TOKEN Y LO QUE VOY A GASTAR
            response  = await api_oneinch.getQuote(process.env.COIN_2,fromTokenAmount);

        } catch(error) {

            console.log(error);

        }

        if(!response || response === null) return;

        const toTokenAmount = web3.utils.fromWei(response.data.toTokenAmount, 'ether');

        const market_price = toTokenAmount/fromTokenAmount;

        console.log(`    Market price: ${chalk.yellow(parseFloat(market_price).toFixed(6))} - Getting: ${chalk.yellow(parseFloat(toTokenAmount).toFixed(6))} `);

        console.log(`            Diff: ${chalk.red(parseFloat(target_price - market_price).toFixed(6))}\n`);

        let action = 'yes';

        // Si me dan menos de lo que quiero digo que no
        if(market_price < target_price) {

            action = 'no';
            console.log(chalk.grey('<== Quiting'));

        }

        var log = {

            trade_pair: process.env.COIN_2+process.env.COIN_1,
            type: new_trade_type,
            amount: fromTokenAmount,
            market_price,
            target_price,
            base_price,
            percent: process.env.PERCENT,
            estimated_gas: response.data.tx ? response.data.tx.gas : response.data.estimatedGas,
            gas_price: response.data.tx ? response.data.tx.gasPrice : 0,
            action,
            date: db_logs.now(),

        }
        
        const log_id = await db_logs.save(log);
        
        if(action == 'yes') {

            console.log(chalk.black.bgGreen('\n=================================== Selling '+process.env.COIN_2+' ===================================\n'));

            if(process.env.DEBUG == "false") {

                try {

                    transactionOngoing = true;
                    
                    // 1) HAGO EL TRADE
                    let nonce = await web3.eth.getTransactionCount(process.env.WALLET_ADDRESS);

                    // nonce = parseInt(nonce);

                    // nonce++;
                    
                    console.log('=== Nonce value: '+nonce);
                    
                    nonce = await web3.utils.toHex(nonce);

                    response.data.tx.nonce = nonce;

                    // // console.log(response.data.tx);

                    response.data.tx.gasPrice *= 1.4;

                    response.data.tx.gasPrice = String(response.data.tx.gasPrice);

                    console.log('=== Signing transaction');
                    
                    const tx = await web3.eth.accounts.signTransaction(response.data.tx, process.env.PRIVATE_KEY_1);

                    console.log('=== Sending signed transaction');

                    // console.log(response.data.tx);
                    
                    // deploy our transaction
                    const receipt = await web3.eth.sendSignedTransaction(tx.rawTransaction);
                    
                    console.log(`=== Transaction succesfull with hash: ${receipt.transactionHash}`);

                    // 2) GRABO EL TRADE EN LA DB
                    var trade = {

                        log_id,
                        type: new_trade_type,
                        tx: receipt.transactionHash,
                        fromToken: response.data.fromToken.symbol,
                        fromTokenAmount,
                        toToken: response.data.toToken.symbol,
                        toTokenAmount,
                        gas_used: receipt.gasUsed,
                        gas_price: response.data.tx.gasPrice,
                        date: db_logs.now(),
            
                    }

                    await db_trades.save(trade);

                    // 3) Envío el email
                    await email.send(trade.fromToken, fromTokenAmount, trade.toToken, toTokenAmount, trade.gas_used, trade.tx);

                    transactionOngoing = false;

                } catch(error) {

                    transactionOngoing = false;
                    console.error(error);

                }

            } else {

                console.log(chalk.grey('<== DEBUG MODE: Quiting'));


            }

        }

    }





}

cron.schedule(`*/${process.env.DELAY_SECS} * * * * *`,() => { run(); });

// run();
