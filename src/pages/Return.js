import React, { useEffect, useState } from "react";
import Reader from "./Reader";
import "./Page.css"
import { toast } from "react-toastify";
import { toastProp, loadingId, toUtf8 } from "../Util";
import { useDebounce } from "use-debounce";
import { useLazyQuery } from "@apollo/client";
import { Link } from 'react-router-dom'
import {USER_QUERY, HISTORY_QUERY} from "../api/query.js";
import axios from "axios";
import CameraAltIcon from '@mui/icons-material/CameraAlt';

const State = {
    LoggedOut: 0,
    LoggingIn: 1,
    LoggedIn:  2
}

function Return(props) {
    const [bookText, setBookText] = useState("");
    const [searchQuery] = useDebounce(bookText, 50);
    const [initialized, setInitialized] = useState(false);
    const [userId, setUserId] = useState("");
    const [state, setState] = useState(State.LoggedOut);
    const [history, setHistory] = useState([]);
    const [autoLogin, setAutoLogin] = useState(false);
    const [loadUser, { data: userData }] = useLazyQuery(USER_QUERY,
                     { "variables": { "_id": userId } });
    const [loadHistory, { data: historyData }] = useLazyQuery(HISTORY_QUERY,
                     { "variables": { "user_id": userId } });
    const [title, setTitle] = useState("");
    const [scannedBook, setScannedBook] = useState({});
    const [needConfirm, setNeedConfirm] = useState(false);
    const [notifyRequest, setNotifyRequest] = useState({});

    useEffect(function () {
        async function initialize() {
            props.doc.setCallback(undefined);
            console.log("=======================================");
            console.log("Return initialize");
        }

        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    async function updateDoc(notify = true)
    {
        setInitialized(true);
    }

    useEffect(
        () => {
            if (bookText.length > 0)
            {
                const bookId = "HK" + bookText;
                console.log("Search book " + bookId);
                const url = "https://" + props.doc.serverInfo.localIp + ":" +
                    props.doc.serverInfo.port + "/book";
//                const obj = {"params": {"book": btoa(toUtf8(bookId)), "match": true}};
                const obj = {"params": {"book": bookId, "match": true}};
                console.log(obj);
                axios.get(url, obj).then( response => {
                        const book = response.data.return;
                        console.log(book)
                        if ('BOOKNAME' in book)
                        {
                            setScannedBook(book)
                        }
                    }
                );
            }
        },
        [searchQuery]
    );
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

    function getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    function imageCaptured(e)
    {
        console.log("Image Captured");
        if (e.target.files && e.target.files.length > 0)
        {
            const file = e.target.files[0];
            console.log(file)
            console.log(file.type);
//            setResult(file.type + " " + file.size.toString());
            const url = "https://" + props.doc.serverInfo.localIp + ":" + props.doc.serverInfo.port + "/uploadImage"
            getBase64(file).then(
                img => {
                    const data = axios({
                        method: "post",
                        mode: 'no-cors',
                        crossDomain: 'true',
                        url: url,
                        headers: {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS"
                        },
                        withCredentials: false,
                        credentials: 'same-origin',
                        data: {
                            image: img
                        }
                    }).then( response => {
                        const book = response.data.return
                        console.log(book)
                        if ('BOOKNAME' in book)
                        {
                            setScannedBook(book)
                        }
                        else
                        {
                            setNotifyRequest({"id": loadingId,
                                              "text": props.text.INVALID_BOOK,
                                              "type": toast.TYPE.ERROR})
                        }
                    });
                }
            );
        }
    }

    useEffect(
        () => {
            console.log("book updated ");
            if ("BARCODE" in scannedBook)
            {
                if (scannedBook._STATE == 1 || scannedBook._STATE == 3)
                {
                    setNeedConfirm(true);
                }
                else
                {

                    setNotifyRequest({"id": loadingId,
                                      "text": props.text.NOT_RENTED,
                                      "type": toast.TYPE.ERROR})
                    document.getElementById('barcodeScan').value= null;
                    setNeedConfirm(false);
                }
            }
            else
            {
                setNeedConfirm(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [scannedBook]
    );

    useEffect(
        () => {
            if (! "text" in notifyRequest)
                return

            const prop = toastProp;
            const text = notifyRequest.text
            prop.type = notifyRequest.type
            prop.autoClose = 3000;
            let id = 0
            if ("id" in notifyRequest)
                id = notifyRequest.id

            prop.toastId = id
            if (toast.isActive(id))
                toast.update(id, notifyRequest.text, prop);
            else
                toast.info(notifyRequest.text, prop);
//            setNotifyRequest({})
        },
        [notifyRequest]
    );

    function confirmAction()
    {
        console.log("Confirmed");
        setNeedConfirm(false);
        console.log(scannedBook);

        const url = "https://" + props.doc.serverInfo.localIp + ":" + props.doc.serverInfo.port + "/return"
        const data = axios({
            method: "post",
            mode: 'no-cors',
            crossDomain: 'true',
            url: url,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
                "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS"
            },
            withCredentials: false,
            credentials: 'same-origin',
            data: {
                book: scannedBook.BARCODE
            }
        }).then( response => {
            const ret = response.data.return;
            console.log(ret);
            setNotifyRequest({"id": loadingId,
                              "text": props.text.returnSucceed,
                              "type": toast.TYPE.SUCCESS})
        });
    }

    function cancelAction()
    {
        console.log("Cancelled")
        setNeedConfirm(false);
    }

    return (
        <div id="checkOut">
            <div id="title">
                <h2>
                    {props.text.return}
                </h2>
            </div>
            <div id="checkOutResult">
                <div id="bookInput" hidden={needConfirm}>
                <label id="barcodeScan">
                    <CameraAltIcon fontSize="large" sx={{color: "#404040"}} />
                    <span>
                    <input type="file" id="barcodeScanInput" accept="image/*" capture="environment" onChange={(e) => imageCaptured(e)} />
                    </span>
                </label>
                <label id="manualInput">
                    <div id="hkPrefix">
                        HK
                    </div>
                    <input inputMode="numeric" pattern="[0-9]*" type="text" id="searchInput"
                        placeholder={props.text.bookHolder}
                        onInput={(event) => {
                            setBookText(event.target.value);
                        }} />
                </label>
                </div>
                {needConfirm && (<div id="checkReturn" >
                    <div id="bookName"> {props.text.confirmReturn} </div>
                    <div id="bookName"> {scannedBook.AUTHOR + ":" + scannedBook.BOOKNAME} </div>
                    <button id="confirm" onClick={() => confirmAction()}> Confirm </button>
                    <button id="cancel" onClick={() => cancelAction()}> Cancel </button>
                </div>)}
            </div>
        </div>
    );
}

export default Return;
