import React, { useEffect, useState, useRef } from "react";
import "./Page.css"
import { toast } from "react-toastify";
import { useDebounce } from "use-debounce";
import { toastProp, MAX_SEARCH_ENTRY, getUserState, toUtf8 } from "../Util";
import { useLazyQuery } from "@apollo/client";
import { Link, Navigate, useParams } from 'react-router-dom'
//import {USERS_QUERY} from "../api/query.js";
import {USERS_QUERY} from "../api/query_test.js";
import ListView from "../ListView";
import UserInfo from "../UserInfo";
import axios from "axios";

//var rentList = [];

function CheckOut(props) {
    const [userText, setUserText] = useState("");
    const [searchQuery] = useDebounce(userText, 300);
    const [queryRequest, toggleQueryRequest] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [initialized, setInitialized] = useState(false);
    const [loadUser, {loading: userLoading, data: userListData, error: userError }] = useLazyQuery(USERS_QUERY);
    const [userList, setUserList] = useState({});
//    const [selectedId, setSelectedId] = useState(0);
    const selectedRef = useRef("0");
    const { id } = useParams();
    const [rentList, setRentList] = useState([]);

    useEffect(function () {
        async function initialize() {
            if (!props.doc.initialized)
            {
                return;
            }
            if (props.doc.isOpen())
                updateDoc(false);
            else
                props.doc.setCallback(updateDoc);
            console.log("=======================================");
            console.log("UserSearch initialize");
            console.log("User ID: " + id);

            if (props.doc.serverAvailable)
            {
                import("./PageServer.css");
            }
            else
            {
                console.log("Load users");
                loadUser();
            }
        }

        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => {
            console.log("Updated id: " + id);
            if (id)
            {
                setUserText(id);
            }
            else
            {
                setUserText("");
            }
        }, [id]
    );

    useEffect(
        () => {
            console.log("User data updated ");
            updateDoc(false);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.logged]
    );

    useEffect(
        () => {
            console.log("User list loaded");
            console.log(userError);
            console.log(userLoading);
            if (userListData)
            {
//                const users = userListData.users;
                const users = userListData.user_tests;
                var list = [];
                console.log("User list available");
                for (let i = 0; i < users.length; i++)
                {
                    const user = users[i];
                    const entry = {"id": user._id, "name": user.name, "level": user.level, "state": getUserState(props.text, user.state)};
                    list.push(entry)
                }
                console.log(list);
                props.doc.setUser(list);
                console.log(props.doc.getUser());
                setUserList(props.doc.getUser());
            }
        },
        [userListData, userLoading, userError, props]
    );

    async function updateDoc(notify = true)
    {
        console.log("All data loaded " + initialized);

        if (notify)
        {
            const prop = toastProp;
            prop.type = toast.TYPE.SUCCESS;
            prop.render = props.text.succeededToOpen;
            prop.autoClose = 3000;
            prop.toastId = "";
            toast.info(props.text.succeededToOpen, prop);
        }
        console.log("Set title " + props.logged)
        console.log("Done");
        setInitialized(true);
    }

    function refresh(response)
    {
        console.log("Refresh page " + queryRequest);
        console.log(response)
        toggleQueryRequest(!queryRequest);
    }

    async function extend(key)
    {
        console.log("Extend " + key);
        const ipAddr = props.doc.serverInfo.localIp;
        const portNum = props.doc.serverInfo.port;
        if (ipAddr.length === 0 || portNum <= 0)
            return;

        const url = "https://" + ipAddr + ":" +
            portNum + "/extend";
        var obj = {};
        obj["book"] = key

        const ret = await axios.post(url, obj);
        console.log("Extended")
        console.log(ret)
        selectId(selectedRef.current, true);
        if (ret.data.return === "SUCCESS")
        {
            const prop = toastProp;
            prop.type = toast.TYPE.SUCCESS;
            prop.render = props.text.succeededToOpen;
            prop.autoClose = 3000;
            prop.toastId = "";
            toast.info(props.text.extend, prop);
        }
    }

    const showRented = (rent, index) => {
        const id = rent["id"];
        const rentDate = rent["rentDate"];
        const retDate = rent["retDate"];
        const bookName = rent["title"];
        const extendCount = rent.extendCount;
        const key = index.toString();
//                        <td colSpan={props.doc.serverAvailable?"3":"2"} className="bookName">{bookName}</td>
        return (<React.Fragment key={key + "Fragment"}>
                    <tr key={key} className="bookData">
                        <td className="bookData"><Link to={"/search/"+id}>{id}</Link></td>
                        <td className="bookData">{rentDate}</td>
                        <td className="bookData">{retDate}</td>
                    </tr>
                    <tr key={key + "Title"} className="bookName">
                        <td colSpan={props.doc.serverAvailable?"2":"3"} className="bookName">{bookName}</td>
                        {props.doc.serverAvailable &&
                            <td className="bookName"><button className="extend" onClick={() => extend(id)}>{props.text.extend + " (" + extendCount.toString() + ")"}</button></td>
                        }
                    </tr>
                </React.Fragment>
                );
    }

    const selectId = async (id, forceSelect = false) => {
        const rent = await props.doc.getRent(id);
        console.log(rent);
        if (selectedRef.current === -1 || selectedRef.current !== id || forceSelect )
        {
            console.log("Select " + id);
//            setSelectedId(id);
            selectedRef.current = id;
            console.log("Set Rent List");
            console.log(rent)
            setRentList(rent);
//            rentList = rent;
        }
        else if (searchResults.length > 1)
        {
            console.log("Deselect " + id);
//            setSelectedId(-1);
            selectedRef.current = -1;
            setRentList([]);
//            rentList = [];
        }
    }

    const showUser = (user, detail, index) => {
        const key = index.toString();
        return (
                <div key={key}>
                    <table><tbody>
                        <tr key={user.id} className="searchTr" onClick={async ()=> await selectId(user.id)}>
                            <td className="bookData">{user.id}</td>
                            <td className="bookData">{user.name}</td>
                            <td className="bookData">{user.state}</td>
                            <td className="bookData">{user.rent}</td>
                        </tr>
                    </tbody></table>
                        {user.id === selectedRef.current && showEntries(user, detail) }
                </div>
                );
    }

    const showUsers = (result, detail) => {
        return (<div>
                    {
                        result.map((user, index) => {
                            return showUser(user, detail, index);
                        })
                    }
                    {
                        result.length === 0 &&
                        <table><tbody>
                            <tr key="None"><td colSpan="3">{props.text.noEntry}</td></tr>
                        </tbody></table>
                    }
                </div>);
    }

    const showEntries = (user, detail) => {
        console.log("Detail");
        console.log(user);
        return (<>
                    {props.doc.serverAvailable &&
                        <UserInfo text={props.text} doc={props.doc} info={user} refresh={refresh}/>
                    }
                    <table><tbody>
                    <tr key="ID">
                        <th id="id">{props.text.id}</th>
                        <th id="rentDate">{props.text.rentDate}</th>
                        <th id="returnDate">{props.text.dueDate}</th>
                    </tr>
                    {
                        detail.map((rent, index) => {
                            return showRented(rent, index);
                        })
                    }
                    {
                        detail.length === 0 && <tr key="None"><td colSpan="3">{props.text.noEntry}</td></tr>
                    }
                    </tbody></table>
                </>);
    }
    useEffect(
        () => {
            async function findUsers(text) {
                let results = [];

//                for (let i = 0 ; i < userList.length ; i++) {
                  for (const key in userList) {
                    const row = userList[key];
                    if (results.length >= MAX_SEARCH_ENTRY) break;
                    if ((row.name && row.name.toString().includes(text)) ||
                        (row.id.toLowerCase() === text.toLowerCase()))
                    {
                        results.push(row);
                    }
                }
                results.sort(function(a,b) { return a.name > b.name; });
                console.log(results);
                return results;
            }
            async function query() {
                const input = userText.trim()
                console.log("Query " + input + " " + searchQuery)
                if (input.length > 0 && searchQuery) {

                    let sr;
                    if (props.doc.serverAvailable)
                    {
                        console.log("from CLIB")
                        const url = "https://" + props.doc.serverInfo.localIp + ":" + props.doc.serverInfo.port + "/users";
                        const obj = {"params": {"user": btoa(toUtf8(input))}};
                        console.log(obj);
                        const response = await axios.get(url, obj);
                        const users = response.data.return.data;
                        console.log(response.data.return);
                        sr = [];
                        if (users) {
                            for (const entry of response.data.return.data)
                            {
                                console.log(entry);
                                let user = entry;
                                user.id = entry.USER_CODE;
                                user.name = entry.USER_NAME;
                                user.state = getUserState(props.text, entry.USER_STATE);
                                user.rent = entry._RENT.length;
                                sr.push(user);
                            }
                        }
                    }
                    else
                    {
                        console.log("from DB")
                        sr = await findUsers(searchQuery);
                    }

                    if (sr.length > 0)
                        setSearchResults(sr);
                    else
                        setSearchResults([]);
                    if (sr.length === 1)
                       selectId(sr[0].id);
                   else
                       selectId(0);
                } else {
                    setSearchResults([]);
                }
            }
            query();
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
       [searchQuery, props, userList, queryRequest, userText]
    );

    if (!props.doc.initialized)
        return <Navigate to="/" />;

    return (
        <div id="checkOut">
            <div id="title">
                <h2>
                    {props.text.userSearch}
                </h2>
            </div>
            <div id="checkOutInput" hidden={!props.doc.admin}>
                <input type="text" id="searchInput"
                    placeholder={props.text.idHolder}
                    value={userText}
                    onChange={(event) => {
                        setUserText(event.target.value);
                    }} />
                <div>
                    <ListView keyValue={searchQuery} list={searchResults} detail={rentList} showCallback={(entries, detail) => { return showUsers(entries, detail); }}/>
                </div>
            </div>
        </div>
    );
}

export default CheckOut;
