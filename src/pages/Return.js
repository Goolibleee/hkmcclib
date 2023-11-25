import React, { useEffect, useState } from "react";
import "./Page.css"
import { toast } from "react-toastify";
import { toastProp, loadingId } from "../Util";
import { useDebounce } from "use-debounce";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ListView from "../ListView";
import { useNavigate } from "react-router-dom";

function Return(props) {
    const [bookText, setBookText] = useState("");
    const [searchQuery] = useDebounce(bookText, 300);
//    const [initialized, setInitialized] = useState(false);
//    const [userId, setUserId] = useState("");
//    const [state, setState] = useState(State.LoggedOut);
//    const [loadUser, { data: userData }] = useLazyQuery(USER_QUERY,
//                     { "variables": { "_id": userId } });
//    const [loadHistory, { data: historyData }] = useLazyQuery(HISTORY_QUERY,
//                     { "variables": { "user_id": userId } });
    const [scannedBook, setScannedBook] = useState({});
    const [needConfirm, setNeedConfirm] = useState(false);
    const [notifyRequest, setNotifyRequest] = useState({});
    const [barcode, setBarcode] = useState("");
    const [returned, setReturned] = useState([]);
    const navigate = useNavigate();

    useEffect(function () {
        async function initialize() {
            props.doc.setCallback(undefined);
            console.log("=======================================");
            console.log("Return initialize");
        }

        const interval = setInterval(async () => {
            if (!("localIp" in props.doc.serverInfo) || !("port" in props.doc.serverInfo))
                return;
            if (props.doc.admin)
                return;
            import("./PageServer.css")
            const ipAddr = props.doc.serverInfo.localIp;
            const portNum = props.doc.serverInfo.port;
            if (ipAddr && ipAddr.length > 0 && portNum > 0)
            {
                const url = "https://" + ipAddr + ":" +
                    portNum + "/scanBarcode";
                const response = await props.doc.requestGet(url, {});
                const book = response.data.scan;
                if (book) {
                    console.log(book.search("HK"))
                    if (book.search("HK") === 0) {
                        console.log(barcode + " -> " + book)
                        setBarcode(book)
                    }
                }
            }
        }, 1000)

        initialize();
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

/*
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
*/

    useEffect(() => {
        async function setBookId() {
            if (bookText.length > 0)
            {
                var bookId;
                if (props.doc.admin)
                    bookId = bookText;
                else
                    bookId = "HK" + bookText;
                console.log("Search book1 " + bookId);
                const url = "https://" + props.doc.serverInfo.localIp + ":" +
                    props.doc.serverInfo.port + "/book";
//                const obj = {"params": {"book": btoa(toUtf8(bookId)), "match": true}};
                const param = {"book": bookId, "match": true};
                const response = await props.doc.requestGet(url, param);
                const book = response.data.return;
                if ('books' in book && 'BOOKNAME' in book.books)
                {
                    setScannedBook(book.books)
                }
            }
        }
        setBookId();
    }, [searchQuery, props.doc, bookText]);

    useEffect(() => {
        async function setBarcode()  {
            console.log("B" + barcode);
            if (barcode.length > 0)
            {
                const bookId = barcode;
                console.log("Search book2 " + bookId);
                const url = "https://" + props.doc.serverInfo.localIp + ":" +
                    props.doc.serverInfo.port + "/book";
                const param = {"book": bookId, "match": true};
                const response = await props.doc.requestGet(url, param);
                const book = response.data.return;
                console.log(book)
                if ('books' in book && 'BOOKNAME' in book.books)
                {
                    setScannedBook(book.books)
                }
            }
        }
        setBarcode();
    }, [barcode, props.doc]);

/*
    function getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
*/

    useEffect(
        () => {
            console.log("book updated ");
            if ("BARCODE" in scannedBook)
            {
                if (scannedBook._STATE === 1 || scannedBook._STATE === 3)
                {
                    setNeedConfirm(true);
                }
                else
                {
                    console.log("Not rented")
                    setNotifyRequest({"id": loadingId,
                                      "text": props.text.NOT_RENTED,
                                      "type": toast.TYPE.ERROR})
                    document.getElementById('barcodeScan').value= null;
                    setNeedConfirm(false);
                    setBarcode("")
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
            if (! ("text" in notifyRequest))
                return

            toast.dismiss();
            const prop = toastProp;
            prop.type = notifyRequest.type
            prop.autoClose = 3000;
//            let id = 0
//           if ("id" in notifyRequest)
//               id = notifyRequest.id

//           prop.toastId = id
 //          if (toast.isActive(id))
//               toast.update(id, notifyRequest.text, prop);
//           else
                toast.info(notifyRequest.text, prop);
//            setNotifyRequest({})
        },
        [notifyRequest]
    );

    useEffect(
        () => {
            console.log("Returned updated");
            console.log(returned);
            if (!("localIp" in props.doc.serverInfo) || !("port" in props.doc.serverInfo))
                return;
            console.log("Update return list");
            const bookId = "HK" + bookText;
            console.log("Search book1 " + bookId);
            const url = "https://" + props.doc.serverInfo.localIp + ":" +
                props.doc.serverInfo.port + "/book";
            const param = {"books": returned};
            props.doc.requestGet(url, param);
        },
        [returned, bookText, props.doc]
    );

    async function confirmAction()
    {
        console.log("Confirmed");
        setNeedConfirm(false);
        console.log(scannedBook);

        const url = "https://" + props.doc.serverInfo.localIp + ":" + props.doc.serverInfo.port + "/return"
        const param = {
            book: scannedBook.BARCODE
        }
        const response = await props.doc.requestPost(url, param)
        const ret = response.data.return;
        console.log(ret);
        if (ret === "SUCCESS")
        {
            setNotifyRequest({"id": loadingId,
                              "text": props.text.returnSucceed,
                              "type": toast.TYPE.SUCCESS})
            returned.push({"id": scannedBook.BARCODE, "name": scannedBook.BOOKNAME})
            console.log(returned)
            setReturned(returned)
        }
        else
        {
            let text
            if (ret in props.text)
                text = props.text[ret];
            else
                text = props.text.NOT_AVAILABLE;
            console.log(text)
            setNotifyRequest({"id": loadingId,
                              "text": text,
                              "type": toast.TYPE.ERROR})
        }
        setScannedBook({});
        setBarcode("")
    }

    function cancelAction()
    {
        console.log("Cancelled")
        setNeedConfirm(false);
        setScannedBook({});
        setBarcode("")
    }

    function showEntry(index, rent)
    {
        return (<div id="bookEntry" key={rent.id}>
                    <div id="bookItem"> {rent.id} </div>
                    <div id="bookItem"> {rent.name} </div>
                </div>);
    }

    function showBook(books)
    {
        return (<div id="bookList">
                    {books.map((rent, index) => { return showEntry(index, rent) })}
                </div>);
    }

    const logOut = async () => {
        console.log("Finish")
        navigate("/")
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
                <label id="barcodeScan" hidden>
                    <CameraAltIcon fontSize="large" sx={{color: "#404040"}} />
                    <span>
                    </span>
                </label>
                <label id="manualInput">
                    <div id="hkPrefix">
                        {props.text.numberOnly}
                    </div>
                    <input inputMode="numeric" pattern="\d*" type="text" id="searchInput"
                        placeholder={props.text.bookHolder}
                        onInput={(event) => {
                            setBookText(event.target.value);
                        }} />
                </label>
                </div>
                <div id="checkReturn" hidden={!needConfirm}>
                    <div id="bookName"> {props.text.confirmReturn} </div>
                    <div id="bookName"> {scannedBook.AUTHOR + ":"} </div>
                    <div id="bookName"> {scannedBook.BOOKNAME} </div>
                    <button id="confirm" onClick={() => confirmAction()}> {props.text.confirm} </button>
                    <button id="cancel" onClick={() => cancelAction()}> {props.text.cancel} </button>
                </div>
                {returned.length > 0 &&
                    <ListView list={returned} showCallback={(entry) => {return showBook(entry)}}/>
                }
            </div>
            <button id="logOutButton" onClick={() => logOut()}> {props.text.finish} </button>
        </div>
    );
}
//                    <input inputMode="numeric" pattern="[0-9]*" type="text" id="searchInput"

export default Return;
