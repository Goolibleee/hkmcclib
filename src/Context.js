import config from "./api/key";

const NodeRSA = require('node-rsa');

const prk = new NodeRSA(config["privateKey"]);

class Context {
    constructor() {
        console.log("Create Context");

        console.log("Cookies");
        const rawCookie = document.cookie;
        this.cookie = rawCookie
            .split(";")
            .map(v => v.split("="))
            .reduce((acc, v) => {
                const key = v.shift().trim();
                const value = v.join("=").trim();
                acc[decodeURIComponent(key)] = decodeURIComponent(value);
                return acc;
            }, {});
        console.log(this.cookie);
    }

    checkLogIn(userData, passwordText) {
        var matched = false;
        var passwordTyped;
        if (userData.user && passwordText.length > 0) {
            console.log("User data available");
            const emailDb = userData.user.encrypted_email;
            const phoneDb = userData.user.encrypted_phone;

            passwordTyped = prk.sign(passwordText, 'base64');
            if (passwordText === emailDb ||
                passwordText === phoneDb )
            {
                passwordTyped = passwordText;
                matched = true;
            }
            else if (emailDb === passwordTyped)
            {
//                console.log("Email match");
                matched = true;
            }
            else
            {
                var numberString = "";
                for (let i = 0 ; i < passwordText.length ; i++)
                {
                    if (!isNaN(passwordText[i]))
                        numberString += passwordText[i];;
                }
                passwordTyped = prk.sign(numberString, 'base64');
                if (passwordTyped === phoneDb)
                {
//                    console.log("Phone match");
                    matched = true;
                }
                else
                {
//                    console.log("Nothing matched");
                }
            }

//            console.log("toast available");
        }
        if (matched)
        {
            const date = new Date();
            const days=2;
            date.setTime(date.getTime()+(days*24*60*60*1000));
            const expireDate = date.toGMTString();
            document.cookie = "password=" +  passwordTyped + "; expires=" + expireDate + " ; SameSite=Lax ;" ;
        }
        return matched
    }
}

export default Context;
