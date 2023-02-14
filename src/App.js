import React, { useEffect } from "react";
import "./App.css";
import Home from "./pages/Home";
import Search from "./pages/Search";
import CheckOut from "./pages/CheckOut";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Zoom } from "react-toastify";
import { HashRouter as Router, Routes, Route} from "react-router-dom";
import Doc from "./Doc";
import text from "./api/text";
import { toast } from "react-toastify";
import { toastProp, loadingId } from "./Util";
import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Navbar from "./Navbar";

const BOOK_QUERY = gql`
    query AllBook{
        books (sortBy: TITLE_ASC, limit:20000) {
            _id
            author
            title
            claim_num
            num
            series
            category
            claim
            publisher
            seqnum
        }
    }
`;

const RENT_QUERY = gql`
    query AllRent{
        rents (limit:20000) {
            _id
            book_id
            user_id
            rent_date
            return_date
            state
        }
    }
`;

const doc = new Doc();
const textString = {};
let logMsg = ""
function App() {

//    const [checkOutStr, setCheckOutStr] = useState("");
//    const [searchStr, setSearchStr] = useState("");
    const { loading: rentLoading, error: rentError, data: rentData } = useQuery(RENT_QUERY);
    const { loading: bookLoading, error: bookError, data: bookData } = useQuery(BOOK_QUERY);
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
            const prop = toastProp;
            prop.type = toast.TYPE.LOADING;
            prop.autoClose = false;
            prop.toastId = loadingId;
            toast.loading(textString.loading, prop);
        }
        initialize();
    }, []);

    return (
    <Router>
        <div className="App">
            <Navbar text={textString}/>
            <Routes>
                <Route path="/" element={<Home doc={doc} text={textString}/>} />
                <Route path="/search/:id?" element={<Search doc={doc} text={textString}/>} />
                <Route path="/checkOut" element={<CheckOut doc={doc} text={textString}/>} />
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
