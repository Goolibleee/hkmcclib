import React, { useEffect, useState } from "react";
import "./Page.css"
import { toast } from "react-toastify";
import { toastProp, loggingId } from "../Util";
import { useLazyQuery } from "@apollo/client";
import gql from "graphql-tag";
import { Link } from 'react-router-dom'
import config from "../api/config";

const NodeRSA = require('node-rsa');

const USER_QUERY = gql`
    query FindUser($_id: String!){
        user (query: {_id:$_id}) {
            _id
            name
            encrypted_email
            encrypted_phone
        }
    }`;

const HISTORY_QUERY = gql`
    query findLogs($user_id: String!){
        rentLogs (query: {user_id: $user_id}) {
            _id
            book_id
            book_state
            timestamp
            user_id
        }
    }`;

const prk = new NodeRSA(config["privateKey"]);

const State = {
    LoggedOut: 0,
    LoggingIn: 1,
    LoggedIn:  2
}

function CheckOut(props) {
    const [userText, setUserText] = useState("");
    const [passwordText, setPasswordText] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [initialized, setInitialized] = useState(false);
    const [userId, setUserId] = useState("");
    const [state, setState] = useState(State.LoggedOut);
    const [history, setHistory] = useState([]);
    const [loadUser, { data: userData }] = useLazyQuery(USER_QUERY,
                     { "variables": { "_id": userId } });
    const [loadHistory, { data: historyData }] = useLazyQuery(HISTORY_QUERY,
                     { "variables": { "user_id": userId } });

    useEffect(function () {
        async function initialize() {
            if (props.doc.isOpen())
                updateDoc(false);
            else
                props.doc.setCallback(updateDoc);
            console.log("=======================================");
            console.log("CheckOut initialize");

        }

        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => {
            console.log("User data updated ");
            compare();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [userData]
    );

    useEffect(
        () => {
            let rawHist = [];
            if (!historyData)
                return;
            console.log("History updated ");
//            console.log(historyData);
            for (let i = 0 ; i < historyData["rentLogs"].length ; i++)
            {
                const entry = historyData["rentLogs"][i];
                if (entry["book_state"] !== "0" && entry["book_state"] !== "1")
                    continue;
                const id = entry["book_id"];
                const date = entry["timestamp"].split(" ")[0].replace("-", "/", 2).replace("-", "/")
                rawHist.push({"id": id, "title": props.doc.book[id]["title"], "date": date, "state": entry["book_state"]});
            }
            rawHist.sort((s1, s2) => { return s1["date"] > s2["date"]; });
//            console.log(rawHist);

            let hist = [];
            for (let i = 0 ; i < rawHist.length - 1 ; i++)
            {
                if (rawHist[i]["state"] !== "1")
                    continue;
                const entry  = rawHist[i];
                const id = entry["id"];
                for (let j = i+1 ; j < rawHist.length ; j++)
                {
                    if (rawHist[j]["state"] !== "0" || id !== rawHist[j]["id"])
                        continue;
                    hist.push({"id": entry["id"], "title": entry["title"], "rentDate": entry["date"], "retDate": rawHist[j]["date"]});
                    break;
                }
            }
//            console.log(hist);
            console.log("Set history");
            setHistory(hist);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [historyData]
    );

    async function updateDoc(notify = true)
    {
        console.log("All data loaded " + initialized);
        if (props.doc.logged)
        {
            setState(State.LoggedIn);
            const userId = props.doc.userInfo['_id'];
            setUserId(userId);
            setSearchResults(props.doc.getRent(userId));
            await loadHistory();
        }

        if (notify)
        {
            const prop = toastProp;
            prop.type = toast.TYPE.SUCCESS;
            prop.render = props.text.succeededToOpen;
            prop.autoClose = 3000;
            prop.toastId = "";
            toast.info(props.text.succeededToOpen, prop);
        }
        console.log("Done");
        setInitialized(true);
    }

    const showRented = (rent, index) => {
        const id = rent["id"];
        const rentDate = rent["rentDate"];
        const retDate = rent["retDate"];
        const bookName = rent["title"];
        return (<><tr key={index} className="bookData">
                    <td className="bookData"><Link to={"/search/"+id}>{id}</Link></td>
                    <td className="bookData">{rentDate}</td>
                    <td className="bookData">{retDate}</td>
                </tr>
                <tr key={index.toString() + "Title"} className="bookName">
                    <td colSpan="3" className="bookName">{bookName}</td>
                </tr></>);
    }

    const showEntries = (result) => {
        return (<div>
                    <table><tbody>
                    <tr>
                        <th id="id">{props.text.id}</th>
                        <th id="rentDate">{props.text.rentDate}</th>
                        <th id="returnDate">{props.text.returnDate}</th>
                    </tr>
                    {
                        result.map((rent, index) => {
                            return showRented(rent, index);
                        })
                    }
                    {
                        result.length === 0 && <tr key="None"><td colSpan="3">{props.text.noEntry}</td></tr>
                    }
                    </tbody></table>
                </div>);
    }

    const logIn = async () => {
        setState(State.LoggingIn);
        setUserId(userText.toUpperCase());
        await loadUser();
        await loadHistory();
        console.log("Log In");
        compare();
    }

    const logOut = async () => {
        setUserId("");
        console.log("Log Out");
        props.doc.logOut();
        setState(State.LoggedOut);
        const passwordInput = document.getElementById("searchPassword");
        passwordInput.value = "";
        setPasswordText("");
    }

    function compare() {
        if (!userData || state === State.LoggedOut)
            return;

        var matched = false;
        if (userData.user && passwordText.length > 0) {
            console.log("User data available");
            const emailDb = userData.user.encrypted_email;
            const phoneDb = userData.user.encrypted_phone;

            const passwordTyped = prk.sign(passwordText, 'base64');
            if (emailDb === passwordTyped)
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
                const passwordTyped = prk.sign(numberString, 'base64');
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
        console.log(toast.isActive(loggingId));
        const prop = toastProp;
        let text;
        if (matched)
        {
            props.doc.logIn(userData.user);

            setSearchResults(props.doc.getRent(userId));
            setState(State.LoggedIn);
            prop.type = toast.TYPE.SUCCESS;
            text = props.text.logInSucceed;
        }
        else
        {
            prop.type = toast.TYPE.ERROR;
            text = props.text.logInFail;
        }
        prop.render = text;
        prop.autoClose = 3000;
        prop.toastId = loggingId;
        if (toast.isActive(loggingId))
        {
            console.log("update toast");
            toast.update(loggingId, prop);
        }
        else
        {
            console.log("New toast");
            toast.info(text, prop);
        }
    }

    return (
        <div id="checkOut">
            <div id="title">
                <h2>{props.text.checkOutTitle}</h2>
            </div>
            <div id="checkOutInput" hidden={state === State.LoggedIn}>
                <input type="text" id="searchInput"
                    placeholder={props.text.idHolder}
                    value={userText}
                    disabled={!initialized}
                    onInput={(event) => {
                        setUserText(event.target.value);
                    }} />
                <input type="password" id="searchPassword"
                    placeholder={props.text.pwHolder}
                    value={passwordText}
                    disabled={!initialized}
                    onInput={(event) => {
                        setPasswordText(event.target.value);
                    }} />
               <button id="logIn" onClick={async () => logIn()}> {props.text.logIn} </button>
            </div>
            <div id="checkOutResult" hidden={state !== State.LoggedIn}>
                <div id="checkOutUser">
                    <div id="name"> {props.doc.userInfo["_id"] + " : " + props.doc.userInfo["name"] + props.text.nameSuffix}
                    </div>
                    <div id="logOut">
                        <button id="logOutButton" onClick={async () => logOut()}> {props.text.logOut} </button>
                    </div>
                </div>
                <div>
                    { showEntries(searchResults) }
                </div>

                <div id="name">{props.text.history}</div>
                <div>
                    { showEntries(history) }
                </div>
            </div>
        </div>
    );
}

export default CheckOut;
