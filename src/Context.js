import {SQSClient, SendMessageCommand, ReceiveMessageCommand} from '@aws-sdk/client-sqs'
import config from "./api/config";

const NodeRSA = require('node-rsa');



const queueUri = config["queue_url"];

class Context {
    constructor(env) {
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
        const aws_key = env.REACT_APP_AWSS_KEY1 + env.REACT_APP_AWSS_KEY2;
        const aws_sec = env.REACT_APP_AWSS_SECRET1 + env.REACT_APP_AWSS_SECRET2;
        const configObject =
        {
            region: config["region"],
            credentials: {
                accessKeyId: aws_key,
                secretAccessKey: aws_sec
            },
        }
        this.sqsClient = new SQSClient(configObject);
//        this.prk = new NodeRSA(config["privateKey"]);
        this.prk = new NodeRSA(env.REACT_APP_PRIVATE_KEY);
    }

    checkLogIn(user, passwordText) {
        var matched = false;
        var passwordTyped;
        if (user && passwordText.length > 0) {
            console.log("User data available");
            const emailDb = user["encrypted_email"];
            const phoneDb = user["encrypted_phone"];

            passwordTyped = this.prk.sign(passwordText, 'base64');
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
                passwordTyped = this.prk.sign(numberString, 'base64');
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

    async sendRequest(body)
    {
        const deduplicationId = Math.floor(Math.random() * 100000000).toString();
        try
        {
            const command = new SendMessageCommand({
                MessageBody: body,
                QueueUrl: queueUri,
                MessageGroupId: "1",
                MessageDeduplicationId: deduplicationId
            });
            await this.sqsClient.send(command);
        }
        catch (error)
        {
            console.log(error);
        }
    };

    async receiveRequest()
    {
        console.log("Read request")
        var requests = [];
        try
        {
            const command = new ReceiveMessageCommand({
                QueueUrl: queueUri,
                AttributeNames: [""], // AttributeNameList
                MessageAttributeNames: [ // MessageAttributeNameList
                "STRING_VALUE",
                ],
                MaxNumberOfMessages: 100,
                VisibilityTimeout: 5,
                WaitTimeSeconds: 5
            });
            const results = await this.sqsClient.send(command);
            console.log(results);
            if (results.Messages !== undefined)
            {
                for (const result of results.Messages)
                {
                    const msg = JSON.parse(result.Body);
                    requests.push(msg);
                }
            }
        }
        catch (error)
        {
            console.log(error);
        }

        return requests;
    }
}

export default Context;
