import React, { useEffect, useState } from "react";
import Reader from "./Reader";
import "./Page.css"
import { toast } from "react-toastify";
import { toastProp, loggingId } from "../Util";
import { useLazyQuery } from "@apollo/client";
import { Link } from 'react-router-dom'
import {USER_QUERY, HISTORY_QUERY} from "../api/query.js";

const State = {
    LoggedOut: 0,
    LoggingIn: 1,
    LoggedIn:  2
}

function CheckOutStatus(props) {
    const [userText, setUserText] = useState("");
    const [passwordText, setPasswordText] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [initialized, setInitialized] = useState(false);
    const [userId, setUserId] = useState("");
    const [state, setState] = useState(State.LoggedOut);
    const [history, setHistory] = useState([]);
    const [autoLogin, setAutoLogin] = useState(false);
    const [loadUser, { data: userData }] = useLazyQuery(USER_QUERY,
                     { "variables": { "_id": userId } });
    const [loadHistory, { data: historyData }] = useLazyQuery(HISTORY_QUERY,
                     { "variables": { "user_id": userId } });
    const [expireDate, setExpireDate] = useState("");
    const [title, setTitle] = useState("");

    useEffect(function () {
        async function initialize() {
            if (props.doc.isOpen())
                updateDoc();
            else
                props.doc.setCallback(updateDoc);
            console.log("=======================================");
            console.log("CheckOutStatus initialize");


            if ("autoLogin" in props.context.cookie)
            {
                const autoLogin = (props.context.cookie.autoLogin === "true") ? true : false;
                setAutoLogin(autoLogin);
            }
            const date = new Date();
            const days=2;
            date.setTime(date.getTime()+(days*24*60*60*1000));
            setExpireDate(date.toGMTString());
        }

        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => {
            console.log("User data updated ");
            updateDoc();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.logged]
    );

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
            if (!historyData || !props.doc.bookReady || !props.doc.rentReady)
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
        [historyData, props.doc.bookReady, props.doc.rentReady]
    );

    async function updateDoc()
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
        else
        {
            setState(State.LoggedOut);
            setUserId("");
            setPasswordText("");
        }

        console.log("Set title " + props.logged)
        if (props.doc.logged)
        {
            if (props.doc.adminMode)
                setTitle(props.text.userSearch);
            else
                setTitle(props.text.checkOut);
        }
        else
        {
            setTitle(props.text.logIn);
        }
        console.log("Done");
        setInitialized(true);
    }

    const showRented = (rent, index) => {
        const id = rent["id"];
        const rentDate = rent["rentDate"];
        const retDate = rent["retDate"];
        const bookName = rent["title"];
        const key = index.toString();
        return (<React.Fragment key={key + "Fragment"}>
                    <tr key={key} className="bookData">
                        <td className="bookData"><Link to={"/search/"+id}>{id}</Link></td>
                        <td className="bookData">{rentDate}</td>
                        <td className="bookData">{retDate}</td>
                    </tr>
                    <tr key={key + "Title"} className="bookName">
                        <td colSpan="3" className="bookName">{bookName}</td>
                    </tr>
                </React.Fragment>
                );
    }


    const toggleAutoLogin = () => {
        console.log("Toggle autoLogin");
        const cookieString = "autoLogin=" + (autoLogin ? "false":"true") + "; expires=" + expireDate + ";";
        console.log(cookieString);
        document.cookie = cookieString;
        setAutoLogin(!autoLogin);
    }

    const showEntries = (result) => {
        return (<div>
                    <table><tbody>
                    <tr key="ID">
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

    const compare = () => {
        if (!userData || state === State.LoggedOut)
            return;

        console.log(toast.isActive(loggingId));
        const prop = toastProp;

        let text;
        if (props.context.checkLogIn(userData, passwordText))
        {
            props.doc.logIn(userData.user);

            setSearchResults(props.doc.getRent(userId));
            setState(State.LoggedIn);

            prop.type = toast.TYPE.SUCCESS;
            text = props.text.logInSucceed;
            document.cookie = "user_id=" + userId + "; expires=" + expireDate + ";";
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
                <h2>
                    {title}
                </h2>
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
                <div id="autoLogin">
                    <input type="checkbox" id="autoLoginButton" checked={autoLogin} onChange={() => toggleAutoLogin()}/>
                    <label>
                            {props.text.autoLogin}
                    </label>
                </div>
               <button id="logIn" onClick={async () => logIn()}> {props.text.logIn} </button>
            </div>
            <div id="checkOutResult" hidden={state !== State.LoggedIn}>
                <Link className='menu-items' to="/barcodeReader">
                    Scan
                </Link>
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

export default CheckOutStatus;
