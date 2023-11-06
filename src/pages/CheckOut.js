import React, { useEffect, useState } from "react";
import "./Page.css"
import { toast } from "react-toastify";
import { toastProp, loggingId, loadingId, getUserState } from "../Util";
import { useDebounce } from "use-debounce";
import axios from "axios";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ListView from "../ListView";
import { useNavigate } from "react-router-dom";

const State = {
    LoggedOut: 0,
    LoggingIn: 1,
    LoggedIn:  2,
    LoggingOut: 3
}

function CheckOut(props) {
    const [userText, setUserText] = useState("");
    const [bookText, setBookText] = useState("");
    const [searchQuery] = useDebounce(bookText, 300);
    const [userId, setUserId] = useState("");
    const [state, setState] = useState(State.LoggedOut);
    const [userData, setUserData] = useState({});
    const [scannedBook, setScannedBook] = useState({});
    const [needConfirm, setNeedConfirm] = useState(false);
    const [notifyRequest, setNotifyRequest] = useState({});
    const [barcode, setBarcode] = useState("");
    const [rented, setRented] = useState([]);
    const navigate = useNavigate();

    useEffect(function () {
        async function initialize() {
            console.log("=======================================");
            console.log("CheckOut initialize");
            const prefixList = document.getElementsByName("idPrefix");
            const prefix = barcode.substring(0, 2);
            for (var i = 0 ; i < prefixList.length ; i++)
            {
                const id = prefixList[i].id
                if ("AB" === id)
                    prefixList[i].checked = true
                else
                    prefixList[i].checked = false

            }
        }

        const interval = setInterval(async () => {
//            console.log(props.doc.serverInfo);
            if (!("localIp" in props.doc.serverInfo) || !("port" in props.doc.serverInfo))
                return;
            if (props.doc.admin)
                return;
            import("./PageServer.css");
            const ipAddr = props.doc.serverInfo.localIp;
            const portNum = props.doc.serverInfo.port;
            if (ipAddr.length > 0 && portNum > 0)
            {
                const url = "https://" + ipAddr + ":" +
                    portNum + "/scanBarcode";
                axios.get(url).then( response => {
                        const code = response.data.scan;
                        if (code) {
                            console.log(code)
                            setBarcode(code)
                        }
                    }
                );
            }
        }, 1000)

        initialize();
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => {
            console.log("User data updated ");
            console.log(toast.isActive(loggingId));
            const prop = toastProp;

            let text;
            let notify = false;
            if ("USER_CODE" in userData && state !== State.LoggedIn)
            {
                setState(State.LoggedIn);

                prop.type = toast.TYPE.SUCCESS;
                text = props.text.logInSucceed;
                notify = true;
            }
            else if (!("USER_CODE" in userData))
            {
                setState(State.LoggedOut);

                if (state === State.LoggingIn)
                {
                    prop.type = toast.TYPE.ERROR;
                    text = props.text.logInFail;
                    notify = true;
                }
            }

            if (notify)
            {
                setNotifyRequest({"id": loadingId,
                                  "text": text,
                                  "type": prop.type})
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [userData]
    );

    useEffect(
        () => {
            console.log("book updated ");
            if ("BARCODE" in scannedBook)
            {
                if (scannedBook._STATE === 0)
                {
                    setNeedConfirm(true);
                }
                else
                {
                    setNotifyRequest({"id": loadingId,
                                      "text": props.text.RENTED,
                                      "type": toast.TYPE.ERROR})
                    document.getElementById('barcodeScan').value= null;
                    setNeedConfirm(false);
                }
            }
            else
            {
                setNeedConfirm(false);
                setBarcode("")
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
            console.log("Notification " + notifyRequest.text)
            const prop = toastProp;
            prop.type = notifyRequest.type
            prop.autoClose = 3000;
//            let id = 0
//            if ("id" in notifyRequest)
//                id = notifyRequest.id

//            prop.toastId = id
//            if (toast.isActive(id))
//                toast.update(id, notifyRequest.text, prop);
//            else
                toast.info(notifyRequest.text, prop);
//            setNotifyRequest({})
        },
        [notifyRequest]
    );

    useEffect(
        () => {
            if (state !== State.LoggedIn)
            {
                const prefixList = document.getElementsByName("idPrefix");
                var prefix = ""
                for (var i = 0 ; i < prefixList.length ; i++)
                {
                    if (prefixList[i].checked)
                        prefix = prefixList[i].id
                        console.log("Pressed [" + i.toString() + " " + prefix + "]")

                }
                let barcode;
                if (userText[0] === "A" || userText[0] == "a")
                    barcode = userText;
                else
                    barcode = prefix + userText;
                setBarcode(barcode);
            }
        }, [state, userText]
    );

    const updateUser = async (userText) => {
        const url = "https://" + props.doc.serverInfo.localIp + ":" + props.doc.serverInfo.port + "/user?user=" + userText;
        const obj = {"params": {"user": userText, "data":"nothing"}};
        console.log(obj);
        const response = await axios.get(url, btoa(JSON.stringify(obj)));
        const user = response.data.return;

        setUserData(user);
        console.log(user);
        setUserId(user.USER_CODE);
    }

    const logIn = async () => {
        console.log("LOGIN");
        console.log(barcode);
        if (barcode.length === 0)
            return;
        setState(State.LoggingIn);
        const id = barcode.toUpperCase();
        updateUser(id);
    }

    const logOut = async () => {
        console.log("Finish")
        setUserData({});
        setUserText("");
        setScannedBook({});
        setBarcode("")
        setRented([])
        document.getElementById('barcodeScan').value= null;
        navigate("/")
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
            console.log(url)
            setNotifyRequest({"id": loadingId,
                              "text": props.text.loading,
                              "type": toast.TYPE.INFO})
            getBase64(file).then(
                img => {
                    axios({
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
                        console.log(response);
                        console.log(book);
                        if ('BOOKNAME' in book)
                        {
                            setScannedBook(book)
                            setNotifyRequest({"id": loadingId,
                                              "text": props.text.succeededToOpen,
                                              "type": toast.TYPE.SUCCESS});
                        }
                        else
                        {
                            console.log("Failed");
                            setNotifyRequest({"id": loadingId,
                                              "text": props.text.INVALID_BOOK,
                                              "type": toast.TYPE.ERROR});
                            setScannedBook({});
                            setBarcode("")
                        }
                    });
                }
            );
        }
    }

    useEffect(
        () => {
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
                const obj = {"params": {"book": bookId, "match": true}};
                console.log(obj);
                axios.get(url, obj).then( response => {
                        const book = response.data.return;
                        console.log(book)
//                        if ('BOOKNAME' in book)
                        if ('books' in book && 'BOOKNAME' in book.books)
                        {
                            console.log(book.books)
                            setScannedBook(book.books)
                        }
                    }
                );
            }
        },
        [searchQuery, props.doc]
    );

    useEffect(
        () => {
            console.log("Set barcode: " + barcode);
            if (barcode.length === 0)
                return;
            if (state !== State.LoggedIn)
            {
                if (barcode.search("AA") === 0 || barcode.search("AB") === 0 )
                {
                    const prefixList = document.getElementsByName("idPrefix");
                    const prefix = barcode.substring(0, 2);
                    for (var i = 0 ; i < prefixList.length ; i++)
                    {
                        const id = prefixList[i].id
                        if (prefix === id)
                            prefixList[i].checked = true
                        else
                            prefixList[i].checked = false

                    }
                    setUserText(barcode.substring(2));
                }
            }
            else if (barcode.search("HK") === 0)
            {
                const bookId = barcode;
                console.log("Search book2 " + bookId);
                const url = "https://" + props.doc.serverInfo.localIp + ":" +
                    props.doc.serverInfo.port + "/book";
//                const obj = {"params": {"book": btoa(toUtf8(bookId)), "match": true}};
                const obj = {"params": {"book": bookId, "match": true}};
                console.log(obj);
                axios.get(url, obj).then( response => {
                        const book = response.data.return;
                        console.log(book)
                        if ('books' in book && 'BOOKNAME' in book.books)
                        {
                            setScannedBook(book.books)
                        }
                    }
                );
            }
        },
        [barcode, props.doc, state]
    );

    function confirmAction()
    {
        console.log("Confirmed");
        setNeedConfirm(false);
        console.log(scannedBook);
        document.getElementById('barcodeScan').value= null;
        const url = "https://" + props.doc.serverInfo.localIp + ":" + props.doc.serverInfo.port + "/checkOut"
        axios({
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
                book: scannedBook.BARCODE,
                user: userId
            }
        }).then( response => {
            const ret = response.data.return
            console.log("Rent confirmed");
            console.log(ret)

            if (ret === "SUCCESS")
            {
                setNotifyRequest({"id": loadingId,
                                  "text": props.text.rentSucceed,
                                  "type": toast.TYPE.SUCCESS})
                rented.push({"id": scannedBook.BARCODE, "name": scannedBook.BOOKNAME})
                console.log(rented)
                setRented(rented)
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
            updateUser(userId);
        });
    }

    function showEntry(index, rent)
    {
    /*
        return (<React.Fragment key={index + "Fragment"}>
                    <tr key={index}>
                        <td className="bookCell"> {rent.id} </td>
                        <td colSpan="3" className="bookCell"> {rent.name} </td>
                    </tr>
                </React.Fragment>
                );
    */
        return (<div id="bookEntry" key={rent.id}>
                    <div id="bookItem"> {rent.id} </div>
                    <div id="bookItem"> {rent.name} </div>
                </div>);

    }

    function showBook(books)
    {
        return (<div id="bookList">
                    <div id="dueDate">
                    {props.text.dueDate} : {props.doc.dueDate}
                    </div>
                    {books.map((rent, index) => { return showEntry(index, rent) })}
                </div>);
    }
    /*
                    <table><tbody>
                        {books.map((rent, index) => { return showEntry(index, rent) })}
                    </tbody></table>
    */

    function cancelAction()
    {
        console.log("Cancelled")
        setNeedConfirm(false);
        document.getElementById('barcodeScan').value= null;
        setScannedBook({});
        setBarcode("")
    }

//            <div id="checkOutResult" hidden={state !== State.LoggedIn ? true : false }>
//            <div id="checkOutResult" hidden={true}>
    return (
        <div id="checkOut">
            <div id="title">
                <h2>
                    {props.text.checkOut}
                </h2>
            </div>
            <div id="checkOutInput" hidden={state === State.LoggedIn}>
                <input type="radio" id = "AA" name="idPrefix"/>
                <label htmlFor="AA" className="idPrefix" name="idPrefix"> AA </label>
                <input type="radio" id = "AB" name="idPrefix"/>
                <label htmlFor="AB" className="idPrefix" name="idPrefix"> AB </label>
                <input type="text" id="searchInput" pattern="[0-9]*" inputMode="numeric"
                    placeholder={props.text.idHolder}
                    value={userText}
                    onInput={(event) => {
                        setUserText(event.target.value);
                    }} />
               <button id="logIn" onClick={async () => logIn()}> {props.text.logIn} </button>
            </div>
            <div id="checkOutResult" hidden={state !== State.LoggedIn}>
                {userData.USER_CODE && (
                    <div id="userInfo">
                        <div id="userItem">
                            {userData.USER_CODE + " : " + userData.USER_NAME + props.text.nameSuffix}
                        </div>
                        <div id="userItem"> {getUserState(props.text, userData.USER_STATE)} </div>
                        <div id="userItem"> {userData._RENT.length + " " + props.text.rentSuffix} </div>
                    </div>
                )}
                <div id="bookInput" hidden={needConfirm}>
                    <label id="barcodeScan" hidden>
                        <CameraAltIcon fontSize="large" sx={{color: "#404040"}} />
                        <span>
                        <input type="file" id="barcodeScanInput" accept="image/*" capture="environment" onChange={(e) => imageCaptured(e)} />
                        </span>
                    </label>
                    <label id="manualInput">
                        <div id="hkPrefix">
                        {props.text.numberOnly}
                        </div>
                        <input inputMode="numeric" pattern="[0-9]*" type="text" id="searchInput"
                            placeholder={props.text.bookHolder}
                            onInput={(event) => {
                                setBookText(event.target.value);
                            }} />
                    </label>
                </div>
                <div id="checkRent" hidden={!needConfirm}>
                    <div id="bookName"> {props.text.confirmRent} </div>
                    <div id="bookName"> {scannedBook.AUTHOR + ":"} </div>
                    <div id="bookName"> {scannedBook.BOOKNAME} </div>
                    <button id="confirm" onClick={() => confirmAction()}> {props.text.confirm} </button>
                    <button id="cancel" onClick={() => cancelAction()}> {props.text.cancel} </button>
                </div>
                {rented.length > 0 &&
                    <ListView list={rented} showCallback={(entry) => {return showBook(entry)}}/>
                }
            </div>
            <button id="logOutButton" onClick={() => logOut()}> {props.text.finish} </button>
        </div>
    );
}

export default CheckOut;
