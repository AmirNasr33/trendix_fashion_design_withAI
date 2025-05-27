import nanomailer from "nodemailer"


const sendmail=async({ to = '', subject = 'Trendix', message = '<h1>welcome to Trendix </h1>'})=>{
    const transporter=nanomailer.createTransport({
        host:'localhost',
        service:'gmail',
        port:587,
        secure:false,
        auth:{
            user:process.env.EMAIL,
            pass:process.env.EMAIL_PASS
        }
    })
    const info = await transporter.sendMail({
        from: `"Trendix" <${process.env.EMAIL}>`, 
        to, 
        subject,  
        html:message
    });
    return info.accepted.length?true:false
} 

export default sendmail