import React, { useEffect } from "react";
import "./App.css";
import Search from "./pages/Search";
import CheckOut from "./pages/CheckOut";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Zoom } from "react-toastify";
import { HashRouter as Router, Routes, Route, Link} from "react-router-dom";
import Doc from "./Doc";

const doc = new Doc();
function App() {
    useEffect(function () {
        async function initialize() {
            console.log("Initialize app");
            console.log(process.env.APP_NAME);
            console.log(process.env.APP_VERSION);
            doc.openDoc();
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
                            <Link to="/"><button id="nav_checkOut">Check Out</button></Link>
                        </td>
                        <td id="nav_item">
                            <Link to="/search"><button id="nav_search">Search</button></Link>
                        </td>
                    </tr>
                    </tbody></table>
                </nav>
            </div>

            <hr />

            <div className="App">
                <Routes>
                    <Route path="/" element={<CheckOut doc={doc}/>} />
                    <Route path="/search" element={<Search doc={doc}/>} />
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
