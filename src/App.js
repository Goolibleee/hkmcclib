import React, { useEffect, useState } from "react";
import "./App.css";
import Home from "./pages/Home";
import Notice from "./pages/Notice";
import Search from "./pages/Search";
import CheckOut from "./pages/CheckOut";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Zoom } from "react-toastify";
import { HashRouter as Router, Routes, Route} from "react-router-dom";
import Doc from "./Doc";
import Context from "./Context";
import text from "./api/text";
import { toast } from "react-toastify";
import { toastProp, loadingId } from "./Util";
import { useQuery, useLazyQuery } from "@apollo/client";
import Navbar from "./Navbar";
import {BOOK_QUERY, RENT_QUERY, USER_QUERY} from "./api/query.js";

const doc = new Doc();
const context = new Context();

const textString = {};
let logMsg = ""
function App() {

//    const [checkOutStr, setCheckOutStr] = useState("");
    const [logged, setLogged] = useState(false);
    const [userId, setUserId] = useState("");
    const { loading: rentLoading, error: rentError, data: rentData } = useQuery(RENT_QUERY);
    const { loading: bookLoading, error: bookError, data: bookData } = useQuery(BOOK_QUERY);
    const [loadUser, { data: userData }] = useLazyQuery(USER_QUERY, { "variables": { "_id": userId } });

    useEffect(function () {
        async function initialize() {
            console.log("Initialize app");
            logMsg = logMsg + "<p>Initialize app</p>";
            console.log(process.env.APP_NAME);
            console.log(process.env.APP_VERSION);
            const lang = navigator.languages;
            console.log(lang);
            let ts = {}
            if (lang.length> 0 && (lang[0].toLowerCase().includes("kr") || lang[0].toLowerCase().includes("ko")))
            {
                ts = text.kr;
            }
            else
            {
                ts = text.en;
            }
            for (let key in ts)
            {
                textString[key] = ts[key];
            }

            if ("autoLogin" in context.cookie &&  context.cookie.autoLogin === "true")
            {
                console.log("Auto Login: " + context.cookie.user_id);
                setUserId(context.cookie.user_id);
                console.log(context.cookie.nothing);
            }
            const prop = toastProp;
            prop.type = toast.TYPE.LOADING;
            prop.autoClose = false;
            prop.toastId = loadingId;
            toast.loading(textString.loading, prop);
            doc.setLogCallback(updateLog);

            loadUser();

        }
        initialize();
    }, [loadUser]);

    useEffect(
        () => {
            console.log("User data loaded");
            if (!userData)
            {
                return;
            }

            console.log("Login check " + context.cookie.password);
            console.log(userData);
            if (context.cookie.password && context.checkLogIn(userData, context.cookie.password))
            {
                console.log("Login suceeded");
                doc.logIn(userData.user);
            }



        }, [userData]
    );
    useEffect(
        () => {
            console.log("Rent Query Updated");
            logMsg = logMsg + "<p>Rent Query Updated " + rentLoading + " " + rentError + "</p>";
            console.log(rentLoading);
            console.log(rentError);
            if (rentData)
            {
                console.log("Rent available");
                logMsg = logMsg + "<p>Rent available</p>"
//                console.log(rentData.rents)
                doc.setRent(rentData.rents)
            }
        }, [rentLoading, rentError, rentData]
    );

    useEffect(
        () => {
            console.log("Book Query Updated");
            logMsg = logMsg + "<p>Book Query Updated</p>";
            console.log(bookLoading)
            console.log(bookError)
            if (bookData)
            {
                console.log("Book available")
                logMsg = logMsg + "<p>Book available</p>";
//                console.log(bookData.books)
                doc.setBook(bookData.books)
            }
        }, [bookLoading, bookError, bookData]
    );

    function updateLog(logged) {
        console.log("==== Update logging state");
        console.log(doc.userInfo);
        setLogged(doc.logged);
    }

    return (
    <Router>
        <div className="App">
            <Navbar doc={doc} text={textString} logged={logged}/>
            <Routes>
                <Route path="/" element={<Home doc={doc} text={textString}/>} />
                <Route path="/notice" element={<Notice doc={doc} text={textString} />} />
                <Route path="/search/:id?" element={<Search doc={doc} text={textString}/>} />
                <Route path="/checkOut" element={<CheckOut context={context} doc={doc} text={textString} logged={logged}/>} />
            </Routes>

            <div>
                <ToastContainer
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    draggable
                    pauseOnHover
                    pauseOnFocusLoss={false}
                    transition={Zoom}
                    limit={2}
                />
            </div>
            <h3>
                v {process.env.REACT_APP_VERSION}
            </h3>
        </div>
    </Router>
    );
}

export default App;
