import React, { useEffect, useState } from "react";
import "./Page.css"
import { toast } from "react-toastify";
import { toastProp, loggingId, compareRent } from "../Util";
import { useLazyQuery } from "@apollo/client";
import { Link, Navigate } from 'react-router-dom'
import {USER_QUERY, HISTORY_QUERY, REQUEST_QUERY} from "../api/query.js";
//import {USER_QUERY, HISTORY_QUERY} from "../api/query_test.js";
import ListView from "../ListView";

const State = {
    LoggedOut: 0,
    LoggingIn: 1,
    LoggedIn:  2
}

const MAX_EXTEND = 1;

function CheckOutStatus(props) {
    const [userText, setUserText] = useState("");
    const [passwordText, setPasswordText] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [initialized, setInitialized] = useState(false);
    const [userId, setUserId] = useState("");
    const [state, setState] = useState(State.LoggedOut);
    const [history, setHistory] = useState([]);
    const [extendCount, setExtendCount] = useState(0);
    const [autoLogin, setAutoLogin] = useState(false);
    const [loadUser, { data: userData }] = useLazyQuery(USER_QUERY,
                     { "variables": { "_id": userId } });
    const [loadHistory, { data: historyData }] = useLazyQuery(HISTORY_QUERY,
                     { "variables": { "user_id": userId } });
    const [loadRequest, { data: requestData }] = useLazyQuery(REQUEST_QUERY,
                     { "variables": { "user_id": userId } });
    const [expireDate, setExpireDate] = useState("");
    const [title, setTitle] = useState("");

    useEffect(function () {
        async function initialize() {
            if (!props.doc.initialized)
                return;

            if (props.doc.isOpen())
                updateDoc();
            console.log("=======================================");
            console.log("CheckOutStatus initialize");

            if (props.doc.serverAvailable)
            {
                import("./PageServer.css");
            }

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
        [props.doc.logged]
    );

    useEffect(() => {
            async function func() {
                console.log("User data updated ");
                await compare();
            }
            func();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [userData]
    );

    useEffect(
        () => {
            if (!historyData || !props.doc.bookReady || !props.doc.rentReady)
                return;
            console.log("History updated ");
//            console.log(historyData)
            let hist = [];
            const rentLogs = historyData.rentLog;
//            const rentLogs = historyData.rentLog_tests;
            for (let i = 0 ; i < rentLogs.length ; i++)
            {
                const entry = rentLogs[i];
                if (entry.book_state !== "1" && entry.book_state !== 1)
                    continue;
                if (! ("return_date" in entry) || ! entry.return_date)
                    continue;
//                console.log(entry);
                const id = entry.book_id;
                if (!(id in props.doc.book))
                    continue;

                const book = props.doc.book[id];
//                console.log(book)
                const title = book.title;
                const claim = book.claim;
                const date = entry.timestamp.split(" ")[0].replace("-", "/", 2).replace("-", "/")
                const retDate = entry.return_date.split(" ")[0].replace("-", "/", 2).replace("-", "/")
                hist.push(
                    {"id": id, "title": title, "rentDate": date, "retDate": retDate, "claim": claim,
                     "totalName": book.series, "claim_num": book.claim_num
                    }
                );

            }
            hist.sort(compareRent);
            console.log("Set history");
            setHistory(hist);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [historyData, props.doc.bookReady, props.doc.rentReady]
    );

    useEffect(
        () => {
            console.log("Request data");
            if (requestData)
            {
                console.log("Request available");
                props.doc.setRequest(requestData.request)
            }
        },
        [requestData]
    );

    async function updateDoc()
    {
        console.log("All data loaded " + initialized);
        if (props.doc.logged)
        {
            setState(State.LoggedIn);
            const userId = props.doc.userInfo['_id'];
            setUserId(userId);
            setSearchResults(await props.doc.getRent(userId));
            console.log(props.doc.getRent(userId));
            await loadHistory();
            await loadRequest();
        }
        else
        {
            setState(State.LoggedOut);
            setUserId("");
            setPasswordText("");
        }

        console.log("Set title " + props.doc.logged)
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

    const showRented = (rent, index, history) => {
        const id = rent["id"];
        const rentDate = rent["rentDate"];
        const retDate = rent["retDate"];
        const claim = rent["claim"];
        const key = index.toString();
        const extendCount = rent.extendCount;
        const maxExtended = extendCount >= MAX_EXTEND;
        let titleRowSpan;
        let extending;
        if (history)
        {
            titleRowSpan = "1"
        }
        else
        {
            extending = props.doc.hasRequest(id);
            titleRowSpan = "2"
        }
        return (<React.Fragment key={key + "Fragment"}>
                    <tr key={key} className="bookData">
                        <td className="bookData"><Link to={"/search/"+id}>{id}</Link></td>
                        <td className="bookData">{rentDate}</td>
                        <td className="bookData">{retDate}</td>
                    </tr>
                    <tr key={key + "Title"} className="bookName">
                        <td className="bookName">{claim}</td>
                        <td colSpan="2" rowSpan={titleRowSpan} className="bookName">
                            {rent.totalName + " "}<b>{rent.title}</b>{" " + rent.claim_num}
                        </td>
                    </tr>
                    {!history &&
                        <tr key={key + "Extend"} className="bookExtend">
                            <td className="bookExtend"> <button id="extend" onClick={async () => extend(id)}
                                disabled={extending || maxExtended}>
                                {maxExtended && props.text.maxExtend}
                                {(extending && !maxExtended) && props.text.extending}
                                {!(extending || maxExtended) && props.text.extend}
                                ({extendCount})
                            </button></td>
                        </tr>
                    }
                </React.Fragment>
                );
    }


    const toggleAutoLogin = () => {
        console.log("Toggle autoLogin");
        const cookieString = "autoLogin=" + (autoLogin ? "false":"true") + "; expires=" + expireDate + ";";
//        console.log(cookieString);
        document.cookie = cookieString;
        setAutoLogin(!autoLogin);
    }

    const showEntries = (result, history) => {
        let retText;
        if (history)
            retText = props.text.returnDate;
        else
            retText = props.text.dueDate;
        return (<div>
                    <table><tbody>
                    <tr key="ID">
                        <th id="id">{props.text.id}</th>
                        <th id="rentDate">{props.text.rentDate}</th>
                        <th id="returnDate">{retText}</th>
                    </tr>
                    {
                        result.map((rent, index) => {
                            return showRented(rent, index, history);
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
        await loadRequest();
        console.log("Log In");
        await compare();
    }

    const extend = async (bookId) => {
        console.log("Extend");
        const date = new Date().toISOString().replace("T", " ").replace("Z", "");
        console.log(date);
        const request =
            "{\n" +
            " \"user_id\": \"" + userId + "\",\n" +
            " \"book_id\": \"" + bookId + "\",\n" +
            " \"date\": \"" + date + "\",\n" +
            " \"action\": \"extend\"\n" +
            "}\n"

        props.context.sendRequest(request);
        props.doc.addRequest(bookId);
        setExtendCount(extendCount + 1);
    }

    const compare = async () => {
        if (!userData || state === State.LoggedOut)
            return;

        console.log(toast.isActive(loggingId));
        const prop = toastProp;

        console.log(passwordText);
        let text;
        const user = userData.user[0];
        if (props.context.checkLogIn(user, passwordText))
        {
            props.doc.logIn(user);

            setSearchResults(await props.doc.getRent(userId));
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

    if (!props.doc.initialized)
        return <Navigate to="/" />;

    return (
        <div id="checkOut">
            <div id="title">
                <h2>
                    {title}
                </h2>
            </div>
            <div id="checkOutInput" hidden={!(state !== State.LoggedIn)}>
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
            <div id="checkOutResult" hidden={!(state === State.LoggedIn)}>
                <div>
                    { showEntries(searchResults, false) }
                </div>

                <div id="name">{props.text.history}</div>
                <ListView list={history} showCallback={(entries) => { return showEntries(entries, true); }}/>
            </div>
        </div>
    );
}

export default CheckOutStatus;
