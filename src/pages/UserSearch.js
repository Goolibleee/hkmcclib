import React, { useEffect, useState, useRef } from "react";
import "./Page.css"
import { toast } from "react-toastify";
import { useDebounce } from "use-debounce";
import { toastProp, MAX_SEARCH_ENTRY, getUserState, toUtf8 } from "../Util";
import { useLazyQuery } from "@apollo/client";
import { Link, useParams } from 'react-router-dom'
import {USERS_QUERY} from "../api/query.js";
import ListView from "../ListView";
import UserInfo from "../UserInfo";
import axios from "axios";

//var rentList = [];

function CheckOut(props) {
    const [userText, setUserText] = useState("");
    const [searchQuery] = useDebounce(userText, 50);
    const [queryRequest, toggleQueryRequest] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [initialized, setInitialized] = useState(false);
    const [loadUser, {loading: userLoading, data: userListData, error: userError }] = useLazyQuery(USERS_QUERY);
    const [userList, setUserList] = useState({});
    const [selectedId, setSelectedId] = useState(0);
    const selectedRef = useRef("0");
    const { id } = useParams();
    const [rentList, setRentList] = useState([]);

    useEffect(function () {
        async function initialize() {
            if (!props.doc.initialized)
            {
                console.log("Document is not ready");
                window.location.href = "/";
                return;
            }
            if (props.doc.isOpen())
                updateDoc(false);
            else
                props.doc.setCallback(updateDoc);
            console.log("=======================================");
            console.log("UserSearch initialize");
            console.log("User ID: " + id);

            if (!props.doc.serverAvailable)
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
                var list = [];
                console.log("User list available");
                for (let i = 0; i < userListData.users.length; i++)
                {
                    const user = userListData.users[i];
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

    const selectId = async (id) => {
        if (selectedRef.current === -1 || selectedRef.current !== id)
        {
            console.log("Select " + id);
            setSelectedId(id);
            selectedRef.current = id;
            const rent = await props.doc.getRent(id);
            console.log("Set Rent List");
            console.log(rent)
            setRentList(rent);
//            rentList = rent;
        }
        else
        {
            console.log("Deselect " + id);
            setSelectedId(-1);
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
        const id = user.id
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
                        <th id="returnDate">{props.text.returnDate}</th>
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
        [searchQuery, props, userList, queryRequest]
    );

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
                    <ListView list={searchResults} detail={rentList} showCallback={(entries, detail) => { return showUsers(entries, detail); }}/>
                </div>
            </div>
        </div>
    );
}

export default CheckOut;
