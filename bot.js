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
web3 = new Web3(new Web3.providers.HttpProvider(process.env.API_ANKR_BSC_URL));

var pjson = require('./package.json');

async function run() {

    let [month, date, year]    = new Date().toLocaleDateString("en-US").split("/")
    let [hour, minute, second] = new Date().toLocaleTimeString("en-US").split(/:| /)

    console.log(chalk.inverse.yellow(`\n${date}/${month} ${hour}:${minute}:${second} ======================= Bot v${pjson.version} ===================================\n`));
    // console.log(new Date());

    const base_price = parseFloat(process.env.BASE_PRICE).toFixed(6);

    console.log(chalk.yellow(`=========== Base price: ${base_price} (${parseFloat(1/base_price).toFixed(6)}) | ${process.env.PERCENT}% spread | Amount: ${process.env.AMOUNT} ===========\n`));

    // ME FIJO EN QUE ESTOY Y CUANTO LO PAGUE
    // BUSCO EL ULTIMO MOVIMIENTO

    const last_trade = await db_trades.getLast();
    
    const new_trade_type = last_trade.type == 'SELL' ? 'BUY' : 'SELL';


    // SI ESTOY EN BUY TENGO QUE COMPRAR VAIS
    if(new_trade_type == 'SELL') {

        const fromToken = 'BUSD';

        const target_price = parseFloat(base_price*(100+parseFloat(process.env.PERCENT))/100).toFixed(6);

        const fromTokenAmount = process.env.AMOUNT;

        console.log(`==> Spending: ${parseFloat(fromTokenAmount).toFixed(6)} ${fromToken}\n`);

        const targetAmount = fromTokenAmount*target_price;

        console.log(`      Sell price: `+chalk.green(target_price)+` - Wanting: ${chalk.green(parseFloat(targetAmount).toFixed(6))} VAI`);

        // VOY A 1INCH CON EL TOKEN Y EL PRECIO QUE QUIERO PAGAR
        const response  = await api_oneinch.getQuote(fromToken,fromTokenAmount);

        if(!response) return;

        const toTokenAmount = web3.utils.fromWei(response.data.toTokenAmount, 'ether');

        const market_price = toTokenAmount/fromTokenAmount;

        console.log(`    Market price: ${chalk.yellow(parseFloat(market_price).toFixed(6))} - Getting: ${chalk.yellow(parseFloat(toTokenAmount).toFixed(6))} VAI`);

        console.log(`      Diff price: ${chalk.red(parseFloat(target_price - market_price).toFixed(6))} - Waiting:   ${chalk.red(parseFloat(targetAmount - toTokenAmount).toFixed(6))} VAI\n`);

        let action = 'yes';

        // Si esta mas caro de lo que quiero comprar
        if(market_price < target_price) {

            action = 'no';
            
            console.log(chalk.grey('<== Quiting'));

        }
        
        var log = {

            trade_pair: 'BUSDVAI',
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

            console.log(chalk.black.bgGreen('\n=================================== Selling BUSD ==================================\n'));
            
            // 1) HAGO EL TRADE
            let nonce = await web3.eth.getTransactionCount(process.env.ADDRESS_1);
            console.log('=== Nonce value: '+nonce);
            
            nonce = await web3.utils.toHex(nonce);

            console.log('=== Signing transaction');
            
            const tx = await web3.eth.accounts.signTransaction(response.data.tx, process.env.PRIVATE_KEY_1);

            console.log('=== Sending signed transaction');
            
            // deploy our transaction
            const receipt = await web3.eth.sendSignedTransaction(tx.rawTransaction);
            
            console.log('=== Transaction succesfull with hash: ',receipt.transactionHash);

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


            
        }

    }

    // SI ESTOY EN BUY TENGO QUE COMPRAR BUSD
    if(new_trade_type == 'BUY') {

        const fromToken = 'VAI';

        const target_price = parseFloat(base_price*(100-parseFloat(process.env.PERCENT))/100).toFixed(6);

        // YO SE QUE QUIERO RECOMPRAR MIS 100 BUSD
        const fromTokenAmount = String(process.env.AMOUNT*target_price);

        const targetAmount = process.env.AMOUNT;
        
        console.log(`==> Spending: ${parseFloat(fromTokenAmount).toFixed(6)} ${fromToken}\n`);

        console.log(`       Buy price: `+chalk.green(target_price)+` - Wanting: ${chalk.green(parseFloat(targetAmount).toFixed(6))} BUSD`);

        // VOY A 1INCH CON EL TOKEN Y EL PRECIO QUE QUIERO PAGAR
        const response  = await api_oneinch.getQuote(fromToken,fromTokenAmount);

        if(!response) return;

        const toTokenAmount = web3.utils.fromWei(response.data.toTokenAmount, 'ether');

        const market_price = fromTokenAmount/toTokenAmount;

        console.log(`    Market price: ${chalk.yellow(parseFloat(market_price).toFixed(6))} - Getting: ${chalk.yellow(parseFloat(toTokenAmount).toFixed(6))} BUSD`);

        console.log(`            Diff: ${chalk.red(parseFloat(market_price - target_price).toFixed(6))} - Waiting:  ${chalk.red(parseFloat(targetAmount - toTokenAmount).toFixed(6))} BUSD\n`);

        let action = 'yes';

        // Si esta mas caro de lo que quiero comprar
        if(market_price > target_price) {

            action = 'no';
            console.log(chalk.grey('<== Quiting'));

        }

        var log = {

            trade_pair: 'BUSDVAI',
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

            console.log(chalk.black.bgGreen('\n=================================== Buying BUSD ===================================\n'));

            // 1) HAGO EL TRADE
            let nonce = await web3.eth.getTransactionCount(process.env.ADDRESS_1);
            console.log('=== Nonce value: '+nonce);
            
            nonce = await web3.utils.toHex(nonce);

            console.log('=== Signing transaction');
            
            const tx = await web3.eth.accounts.signTransaction(response.data.tx, process.env.PRIVATE_KEY_1);

            console.log('=== Sending signed transaction');
            
            // deploy our transaction
            const receipt = await web3.eth.sendSignedTransaction(tx.rawTransaction);
            
            console.log('=== Transaction succesfull with hash: ',receipt.transactionHash);

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


            
        }

    }


}

cron.schedule(`*/${process.env.DELAY_MIN} * * * *`,() => { run(); });

// run();
