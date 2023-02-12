import React, { useEffect, useState } from "react";
import "./App.css";
import Search from "./pages/Search";
import CheckOut from "./pages/CheckOut";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Zoom } from "react-toastify";
import { HashRouter as Router, Routes, Route, Link} from "react-router-dom";
import Doc from "./Doc";
import text from "./api/text";

const doc = new Doc();
const textString = {};
function App() {
    const [checkOutStr, setCheckOutStr] = useState("");
    const [searchStr, setSearchStr] = useState("");

    useEffect(function () {
        async function initialize() {
            console.log("Initialize app");
            console.log(process.env.APP_NAME);
            console.log(process.env.APP_VERSION);
            const lang = navigator.languages;
            console.log(lang);
            doc.openDoc();
            let ts = {}
            if (lang.length> 0 && lang[0].toLowerCase().includes("kr"))
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
            setCheckOutStr(textString.checkOut);
            setSearchStr(textString.search);
            console.log(textString);
        }
        initialize();
    }, []);

    return (
        <Router>
            <div>
                <nav id="nav">
                    <table id="nav"><tbody>
                    <tr>
                        <td id="nav_item">
                            <Link to="/"><button id="nav_checkOut">{checkOutStr}</button></Link>
                        </td>
                        <td id="nav_item">
                            <Link to="/search"><button id="nav_search">{searchStr}</button></Link>
                        </td>
                    </tr>
                    </tbody></table>
                </nav>
            </div>

            <hr />

            <div className="App">
                <Routes>
                    <Route path="/" element={<CheckOut doc={doc} text={textString}/>} />
                    <Route path="/search" element={<Search doc={doc} text={textString}/>} />
                </Routes>

                <div>
                <ToastContainer
                    position="bottom-center"
                    autoClose={10}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    draggable
                    pauseOnHover
                    pauseOnFocusLoss={false}
                    transition={Zoom}
                    icon={false}
                />
                </div>
                <h2>
                    v {process.env.REACT_APP_VERSION}
                </h2>
            </div>
        </Router>
    );
}

export default App;
