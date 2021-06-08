const email = require('@sendgrid/mail');

email.setApiKey(process.env.SENDGRID_API_KEY);

var pjson = require('../package.json');



const send = async (fromToken, fromTokenAmount, toToken, toTokenAmount, gasUsed, tx) => {

    console.log('==> Envío el email');

    fromTokenAmount = parseFloat(fromTokenAmount).toFixed(4);
    toTokenAmount = parseFloat(toTokenAmount).toFixed(4);

    const subject = `Vendidos ${fromTokenAmount} ${fromToken} por ${toTokenAmount} ${toToken}`;

    const html = `
    <== Bot v${pjson.version} ==><br>
    Vendidos <strong>${fromTokenAmount} ${fromToken}</strong> por <strong>${toTokenAmount} ${toToken}</strong><br>
    <strong>GasUsed:</strong> ${gasUsed}<br>
    <strong>Hash:</strong> ${tx}<br>
    <strong>BSC Scan:</strong> https://bscscan.com/tx/${tx}`;

    const msg = {
        to: process.env.EMAIL,
        from: 'www@nodejs.xyu.com.ar', // Use the email address or domain you verified above
        subject,
        html
    };

    try {
        
        await email.send(msg);

      } catch (error) {
        
        console.error(error);
    
        if (error.response) {
          console.error(error.response.body)
        }
      }

}


module.exports = {
    send
}